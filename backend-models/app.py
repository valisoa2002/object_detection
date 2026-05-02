from fastapi import FastAPI
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

# Chargement du modèle YOLO26 une seule fois au démarrage
model = YOLO("yolo26n.pt") 

@app.on_event("startup")
async def startup_event():
    # Optionnel : On peut pré-charger le modèle ici pour plus de rapidité
    print("Modèle YOLO26 chargé et prêt.")

@app.post("/process-frame")
async def process_frame(source_url: str):
    # 1. Capture de la frame via OpenCV
    cap = cv2.VideoCapture(source_url)
    success, frame = cap.read()
    
    if not success:
        return {"error": "Impossible de lire la source vidéo"}

    # 2. Inférence YOLO26 (La détection magique sans annotation)
    # On limite aux 80 classes COCO par défaut
    results = model.predict(frame, conf=0.5) 

    # 3. Extraction des données (Le format "Contrat" pour Node.js)
    detections = []
    for r in results:
        for box in r.boxes:
            # On prépare l'objet exactement comme vous l'avez testé dans Insomnia
            detection_data = {
                "labelId": int(box.cls),
                "label": model.names[int(box.cls)],
                "confidence": round(float(box.conf), 2),
                "bbox": [int(x) for x in box.xyxy[0].tolist()] # [x1, y1, x2, y2]
            }
            detections.append(detection_data)
            
            # 4. Envoi immédiat vers Node.js (L'interopérabilité en action)
            await send_to_node(detection_data)

    cap.release()
    return {"message": "Frame traitée", "count": len(detections)}

async def send_to_node(data):
    async with httpx.AsyncClient() as client:
        # C'est ici que FastAPI remplace Insomnia !
        await client.post("http://localhost:8000/api/detections", json=data)
        

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=True)