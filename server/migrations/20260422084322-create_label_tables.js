"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "labels",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
        }, // L'ID envoyé par YOLO (0-79)
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        }, // ex: "person", "car", "bottle"
        category: {
          type: Sequelize.STRING,
        }, // Pour grouper (ex: "Véhicules", "Humains")
      },
      {
        timestamps: false,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("labels");
  },
};
