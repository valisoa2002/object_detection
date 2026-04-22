# 👁️ ObjectVision AI - Système Détecteur d'Objets Interopérable

Ce projet est une solution complète de vision par ordinateur en temps réel. Il utilise **YOLO26** pour la détection, **FastAPI** comme micro-service d'IA, **Node.js** pour la logique métier et la persistance des données, et **React** pour une interface utilisateur élégante.

---

## 🏗️ Architecture du Système

Le flux de données circule comme suit :

1. **Source Vidéo** -> **FastAPI (YOLO26)** : Inférence et extraction JSON.
2. **FastAPI** -> **Node.js (Express/Sequelize)** : Transmission des données via HTTP.
3. **Node.js** -> **PostgreSQL** : Sauvegarde de l'historique.
4. **Node.js** -> **React (WebSockets)** : Affichage instantané sur l'interface.

---

## 🚀 Installation et Lancement

### 1. 🧠 Serveur d'IA (Python - FastAPI)

Ce serveur gère l'inférence du modèle YOLO26 sur 80 classes.

**Installation :**

```bash
cd backend-models
python -m venv .venv
source .venv/bin/activate  # Sur Windows: .venv\Scripts\activate
pip install requirements.txt
```

Configurer le fichier .env

```bash
NODE_SERVER_URL=http://localhost:3000/api/detections
YOLO_MODEL=yolo26n.pt
PORT=8000
```

```bash
cd backend-models
python app.py
```

---

### 2. ⚙️ Serveur Backend (Node.js - Express)

Le pivot central qui gère la base de données et la communication temps réel.

**Installation :**

```bash
cd server
npm install
```

**Configuration de la base de données (.env) :**

```env
DB_NAME=objectvision
DB_USER=mysql
DB_PASS=votre_mot_de_passe
DB_HOST=localhost
PORT=8000
```

**Installation de sequelize-cli pour démmarer la migration et la création de la base de données:**

```bash
npm install -g sequelize-cli
```

**Lancement des migrations et création de la base de données :**

```bash
npx sequelize db:create
npx sequelize db:migrate
```

**Lancement :**

```bash
npm run dev
```

---

### 3. 💻 Interface Frontend (React)

Tableau de bord pour visualiser les détections en direct.

**Installation :**

```bash
cd client
npm install
```

**Lancement :**

```bash
npm run dev
```
