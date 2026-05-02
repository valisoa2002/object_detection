const Detection = require("../models/Detection");

module.exports = {
  // -------------------------------------------------------------------
  // 1. detectObject : Réceptionne les données du micro-service FastAPI
  // -------------------------------------------------------------------
  detectObject: async (req, res) => {
    try {
      // Récupération du tableau de détections envoyé par FastAPI
      const detections = req.body;

      if (!detections || !Array.isArray(detections)) {
        return res.status(400).json({
          success: false,
          message: "Format de données invalide. Un tableau est attendu.",
        });
      }

      // Insertion groupée (bulk) pour de meilleures performances
      const createdDetections = await Detection.bulkCreate(detections);

      req.app.get("io").emit("new-detections", createdDetections);

      return res.status(201).json({
        success: true,
        count: createdDetections.length,
        message: "Détections enregistrées avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des détections :", error);
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};
