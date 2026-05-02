from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from ultralytics import YOLO
import cv2
import httpx
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En développement, on autorise tout
    allow_methods=["*"],
    allow_headers=["*"],
)


app = FastAPI()

# 1. Chargement du modèle YOLO26 (pré-entraîné sur 80 classes)
model = YOLO("yolo26n.pt") 

# 2. Schéma de données pour l'interopérabilité
class DetectionResult(BaseModel):
    label: str
    confidence: float
    bbox: list[float]

class PredictRequest(BaseModel):
    image_url: str

@app.post("/predict")
async def predict(request: PredictRequest, background_tasks: BackgroundTasks):
    # Inférence sur le flux/image
    results = model(request.image_url)
    
    detections = []
    for r in results:
        for box in r.boxes:
            det = {
                "label": model.names[int(box.cls)],
                "confidence": float(box.conf),
                "bbox": box.xywh.tolist()[0] # [x_center, y_center, width, height]
            }
            detections.append(det)
            
    # 3. Envoyer TOUTES les détections en une seule fois en arrière-plan
    if detections:
        background_tasks.add_task(send_to_node, detections)

    return {"status": "success", "data": detections}

async def send_to_node(data: list):
    async with httpx.AsyncClient() as client:
        await client.post("http://localhost:8000/api/detections", json=data)