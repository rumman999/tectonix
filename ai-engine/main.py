from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from pydantic import BaseModel
from typing import List
from PIL import Image, ImageOps
import io
import numpy as np
import torch
import torch.nn as nn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SeismicData(BaseModel):
    payload: List[List[float]]

class Seismic1DCNN(nn.Module):
    def __init__(self):
        super(Seismic1DCNN, self).__init__()
        self.features = nn.Sequential(
            nn.Conv1d(3, 16, kernel_size=5, stride=1, padding=2),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(16, 32, kernel_size=5, stride=1, padding=2),
            nn.ReLU(),
            nn.MaxPool1d(2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(32 * 25, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

general_model = YOLO('yolov8n.pt') 

try:
    facade_model = YOLO('facade_model.pt')
    print("### Custom Facade Model Loaded")
except:
    print("# Custom model missing, using fallback")
    facade_model = YOLO('yolov8n-seg.pt')

seismic_model = Seismic1DCNN()
try:
    seismic_model.load_state_dict(torch.load("seismic_1d_cnn.pt", map_location=torch.device('cpu'), weights_only=True))
    seismic_model.eval()
    print("### Seismic 1D-CNN Model Loaded")
except:
    print("# Seismic model missing")

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data))
    
    image = ImageOps.exif_transpose(image)
    
    detected_objects = []
    
    indoor_ids = [63, 64, 66, 41, 62, 56] 
    gen_results = general_model(image, conf=0.40)
    
    forZX = gen_results[0].boxes
    for box in forZX:
        if int(box.cls[0]) in indoor_ids:
            return {
                "analysis_id": "aborted",
                "risk_status": "INVALID_TARGET",
                "risk_score": 0,
                "message": "Indoor object detected (e.g., Laptop/TV). Please scan a building facade.",
                "detected_elements": []
            }

    results = facade_model(image, conf=0.45, retina_masks=True)
    result = results[0]
    
    total_opening_pixels = 0.0 
    total_wall_pixels = 0.0
    
    window_count = 0
    door_count = 0
    
    if result.masks:
        masks = result.masks.xy 
        classes = result.boxes.cls.cpu().numpy()
        confidences = result.boxes.conf.cpu().numpy()
        
        for i, mask in enumerate(masks):
            obj_class_id = int(classes[i])
            obj_name = result.names[obj_class_id]
            
            display_label = obj_name.capitalize()
            
            if obj_name in ['window', 'glass', 'opening']:
                window_count += 1
                display_label = f"Window {window_count}"
            elif obj_name == 'door':
                door_count += 1
                display_label = f"Door {door_count}"

            x = mask[:, 0]
            y = mask[:, 1]
            area_val = float(0.5 * np.abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1))))
            
            is_opening = obj_name in ['window', 'door', 'garage', 'glass']
            is_wall = obj_name in ['wall', 'facade', 'building', 'brick']
            
            if is_opening: 
                total_opening_pixels += area_val
            elif is_wall: 
                total_wall_pixels += area_val
            
            detected_objects.append({
                "type": display_label,  
                "confidence": float(confidences[i]),
                "area_px": area_val,
                "is_risk_element": is_opening,
                "polygon": mask.tolist() 
            })

    relevant_area = total_wall_pixels + total_opening_pixels
    risk_score = 0.0
    
    if relevant_area > 0:
        risk_score = (total_opening_pixels / relevant_area) * 100
    
    status = "SAFE"
    if risk_score > 45: status = "CRITICAL_SOFT_STORY"
    elif risk_score > 25: status = "MODERATE_RISK"

    return {
        "analysis_id": "scan_complete",
        "risk_status": status,
        "risk_score": float(round(risk_score, 2)),
        "detected_elements": detected_objects
    }

@app.post("/analyze-seismic")
async def analyze_seismic(data: SeismicData):
    try:
        if len(data.payload) != 3 or any(len(axis) != 100 for axis in data.payload):
            raise HTTPException(status_code=400, detail="Invalid payload")

        input_tensor = torch.tensor([data.payload], dtype=torch.float32)

        with torch.no_grad():
            prediction = seismic_model(input_tensor).item()

        is_earthquake = bool(prediction > 0.85) 

        return {
            "success": True,
            "is_earthquake": is_earthquake,
            "confidence_score": round(prediction * 100, 2)
        }

    except Exception as e:
        return {"success": False, "error": str(e)}