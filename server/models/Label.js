const { DataTypes } = require("sequelize");
const { sequelize } = require("../database/connect");

const Label = sequelize.define(
  "Label",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    }, // L'ID envoyé par YOLO (0-79)
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    }, // ex: "person", "car", "bottle"
    category: {
      type: DataTypes.STRING,
    }, // Pour grouper (ex: "Véhicules", "Humains")
  },
  {
    timestamps: false,
  }
); // Pas besoin de dates pour les noms de classes

module.exports = Label;
