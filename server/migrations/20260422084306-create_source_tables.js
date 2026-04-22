"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sources", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primary_key: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      }, // ex: "Caméra Entrepôt Sud"
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      }, // ex: "rtsp://..."
      type: {
        type: Sequelize.ENUM("stream", "file"),
        defaultValue: "stream",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("sources");
  },
};
