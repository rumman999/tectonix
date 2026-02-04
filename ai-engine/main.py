from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image, ImageOps
import io
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. General Awareness (Filters out office clutter)
general_model = YOLO('yolov8n.pt') 

# 2. Structural Awareness (Your Custom Model)
try:
    facade_model = YOLO('facade_model.pt')
    print("✅ Custom Facade Model Loaded")
except:
    print("⚠️ Custom model missing, using fallback (Warning: Standard YOLOv8n cannot detect windows)")
    facade_model = YOLO('yolov8n-seg.pt')

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data))
    
    # FIX: Rotation for mobile
    image = ImageOps.exif_transpose(image)
    
    detected_objects = []
    
    # --- STEP 1: SAFETY CHECK (Filter out mice/laptops) ---
    # COCO IDs: Laptop(63), Mouse(64), Keyboard(66), Cup(41), TV(62), Chair(56)
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

    # --- STEP 2: FACADE SCAN ---
    results = facade_model(image, conf=0.45, retina_masks=True)
    result = results[0]
    
    total_opening_pixels = 0.0 
    total_wall_pixels = 0.0
    
    # Counters for labeling
    window_count = 0
    door_count = 0
    
    if result.masks:
        masks = result.masks.xy 
        classes = result.boxes.cls.cpu().numpy()
        confidences = result.boxes.conf.cpu().numpy()
        
        for i, mask in enumerate(masks):
            obj_class_id = int(classes[i])
            obj_name = result.names[obj_class_id]
            
            # --- LABELING LOGIC ---
            # Create a distinct label like "Window 1", "Window 2"
            display_label = obj_name.capitalize()
            
            if obj_name in ['window', 'glass', 'opening']:
                window_count += 1
                display_label = f"Window {window_count}"
            elif obj_name == 'door':
                door_count += 1
                display_label = f"Door {door_count}"

            # Calculate Area (Shoelace Formula)
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
                "type": display_label,  # <--- Updates the text shown on Frontend
                "confidence": float(confidences[i]),
                "area_px": area_val,
                "is_risk_element": is_opening,
                "polygon": mask.tolist() 
            })

    # --- STEP 3: SCORE ---
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