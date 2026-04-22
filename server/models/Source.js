const { DataTypes } = require("sequelize");
const { sequelize } = require("../database/connect");

const Source = sequelize.define("Source", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primary_key: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  }, // ex: "Caméra Entrepôt Sud"
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  }, // ex: "rtsp://..."
  type: {
    type: DataTypes.ENUM("stream", "file"),
    defaultValue: "stream",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = Source;
