const { DataTypes } = require("sequelize");
const { sequelize } = require("../database/connect");

const Detection = sequelize.define("Detection", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  // Coordonnées [x, y, w, h] stockées en JSON
  bbox: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = Detection;
