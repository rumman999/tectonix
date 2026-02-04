# 🌍 Tectonix - Seismic Risk & Disaster Management Platform

**Tectonix** is an integrated seismic risk and disaster management platform designed to bridge the gap between building owners, structural engineers, and emergency responders. It focuses on seismic risk assessment, real-time ground vibration monitoring, and coordinated disaster response for urban areas like Dhaka.

---

## 🚀 Key Features

* **🤖 AI Structural Scanner:** Analyze building images to detect cracks, soft-story risks, and calculate structural integrity scores.
* **📡 Real-Time Seismic Mode:** IoT-driven dashboard visualizing ground motion (PGA), epicenter triangulation, and automated "Drop, Cover, Hold On" alerts.
* **🚨 Rescue Coordination:** Live tracking of distress beacons and coordination of first responder missions.
* **🏗️ Building Asset Manager:** Digital twin management for owners, including ownership history, retrofit cost estimation, and soil liquefaction data.
* **🔐 Role-Based Access:** Specialized interfaces for five user types: Specialists, Owners, First Responders, Volunteers, and Citizens.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, Leaflet Maps
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL with **PostGIS** extension (for geospatial queries)
* **AI Engine:** Python / FastAPI microservice integrated via Node.js

---

## 📂 Project Structure

```bash
tectonix/
├── client/        # React frontend application
│   └── README.md  # Frontend setup & usage
├── server/        # Node.js Express backend API
│   └── README.md  # Backend setup, DB & API docs
├── ai-engine/     # AI-Engine
│   └── README.md  # AI Engine Guide
└── README.md      # Main project overview
```

---

## 🏁 Getting Started

This repository uses **separate documentation** for the frontend and backend.

➡️ **Frontend instructions:**  
See [`client/README.md`](./client/README.md)

➡️ **Backend instructions:**  
See [`server/README.md`](./server/README.md)

---

## 🎯 Target Users

* Structural & Seismic Engineers  
* Building Owners & Developers  
* Emergency Responders  
* Volunteers & NGOs  
* Citizens in high-risk seismic zones  

---

## 📌 Notes

* Designed with a **microservices architecture**.
* Geospatial operations rely on **PostGIS**.
* AI services are isolated for scalability and independent deployment.

---

