const Source = require("./Source");
const Label = require("./Label");
const Detection = require("./Detection");

// 1:N - Une source a plusieurs détections
Source.hasMany(Detection, { foreignKey: "sourceId", onDelete: "CASCADE" });
Detection.belongsTo(Source, { foreignKey: "sourceId" });

// 1:N - Une classe d'objet apparaît dans plusieurs détections
Label.hasMany(Detection, { foreignKey: "labelId" });
Detection.belongsTo(Label, { foreignKey: "labelId" });

module.exports = { Source, Label, Detection, sequelize };
