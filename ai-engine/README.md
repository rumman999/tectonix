# 🧠 AI Engine — Starter Guide

This directory contains the **AI microservice** responsible for structural image analysis and damage detection.  
It runs as a **Python FastAPI service** and communicates with the main backend via HTTP.

---

## 📂 Folder Contents

```bash
ai-engine/
├── facade_model.pt    # Trained facade crack / damage model
├── yolov8n.pt         # YOLOv8 base model
├── main.py            # FastAPI application entry point
├── requirements.txt   # Python dependencies
└── README.md          # This guide
```

---

## ⚙️ Requirements

- Python **3.9+** (recommended)
- pip
- (Optional) Virtual environment tool: `venv` or `conda`

---

## 🧪 Setup Instructions

### 1️⃣ Create & Activate Virtual Environment (Recommended)

```bash
python -m venv venv
```

**Windows**
```bash
venv\Scripts\activate
```

**Linux / macOS**
```bash
source venv/bin/activate
```

---

### 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🚀 Run the AI Engine

Start the FastAPI server using **uvicorn**:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- `main` → `main.py`
- `app` → FastAPI app instance
- `--reload` enables auto-restart during development

---

## 🌐 API Access

Once running, the service will be available at:

```
http://localhost:8000
```

### Interactive API Docs
FastAPI automatically provides Swagger UI:

```
http://localhost:8000/docs
```

---

## 🔌 Integration Notes

- This AI engine is designed to run as a **separate microservice**
- The **Node.js backend** sends image data or URLs to this service
- Responses include detected damage regions and confidence scores
- Models (`.pt` files) must remain in this directory or configured correctly in `main.py`

---

## 📌 Notes

- Ensure `.pt` model files are present before starting the server
- GPU acceleration (CUDA) can be enabled if PyTorch is configured accordingly
- Keep this service isolated for scalability and fault tolerance

---

