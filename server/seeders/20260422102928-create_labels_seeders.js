"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("labels", [
      // 👤 Person
      { id: 0, name: "person", category: "Humain" },

      // 🚗 Véhicules
      { id: 1, name: "bicycle", category: "Véhicules" },
      { id: 2, name: "car", category: "Véhicules" },
      { id: 3, name: "motorcycle", category: "Véhicules" },
      { id: 4, name: "airplane", category: "Véhicules" },
      { id: 5, name: "bus", category: "Véhicules" },
      { id: 6, name: "train", category: "Véhicules" },
      { id: 7, name: "truck", category: "Véhicules" },
      { id: 8, name: "boat", category: "Véhicules" },

      // 🚦 Extérieur
      { id: 9, name: "traffic light", category: "Extérieur" },
      { id: 10, name: "fire hydrant", category: "Extérieur" },
      { id: 11, name: "stop sign", category: "Extérieur" },
      { id: 12, name: "parking meter", category: "Extérieur" },
      { id: 13, name: "bench", category: "Extérieur" },

      // 🐶 Animaux
      { id: 14, name: "bird", category: "Animaux" },
      { id: 15, name: "cat", category: "Animaux" },
      { id: 16, name: "dog", category: "Animaux" },
      { id: 17, name: "horse", category: "Animaux" },
      { id: 18, name: "sheep", category: "Animaux" },
      { id: 19, name: "cow", category: "Animaux" },
      { id: 20, name: "elephant", category: "Animaux" },
      { id: 21, name: "bear", category: "Animaux" },
      { id: 22, name: "zebra", category: "Animaux" },
      { id: 23, name: "giraffe", category: "Animaux" },

      // 🎒 Accessoires
      { id: 24, name: "backpack", category: "Accessoires" },
      { id: 25, name: "umbrella", category: "Accessoires" },
      { id: 26, name: "handbag", category: "Accessoires" },
      { id: 27, name: "tie", category: "Accessoires" },
      { id: 28, name: "suitcase", category: "Accessoires" },

      // ⚽ Loisirs
      { id: 29, name: "frisbee", category: "Loisirs" },
      { id: 30, name: "skis", category: "Loisirs" },
      { id: 31, name: "snowboard", category: "Loisirs" },
      { id: 32, name: "sports ball", category: "Loisirs" },
      { id: 33, name: "kite", category: "Loisirs" },
      { id: 34, name: "baseball bat", category: "Loisirs" },
      { id: 35, name: "baseball glove", category: "Loisirs" },
      { id: 36, name: "skateboard", category: "Loisirs" },
      { id: 37, name: "surfboard", category: "Loisirs" },
      { id: 38, name: "tennis racket", category: "Loisirs" },

      // 🍴 Cuisine
      { id: 39, name: "bottle", category: "Cuisine" },
      { id: 40, name: "wine glass", category: "Cuisine" },
      { id: 41, name: "cup", category: "Cuisine" },
      { id: 42, name: "fork", category: "Cuisine" },
      { id: 43, name: "knife", category: "Cuisine" },
      { id: 44, name: "spoon", category: "Cuisine" },
      { id: 45, name: "bowl", category: "Cuisine" },

      // 🍎 Nourriture
      { id: 46, name: "banana", category: "Nourriture" },
      { id: 47, name: "apple", category: "Nourriture" },
      { id: 48, name: "sandwich", category: "Nourriture" },
      { id: 49, name: "orange", category: "Nourriture" },
      { id: 50, name: "broccoli", category: "Nourriture" },
      { id: 51, name: "carrot", category: "Nourriture" },
      { id: 52, name: "hot dog", category: "Nourriture" },
      { id: 53, name: "pizza", category: "Nourriture" },
      { id: 54, name: "donut", category: "Nourriture" },
      { id: 55, name: "cake", category: "Nourriture" },

      // 🪑 Mobilier
      { id: 56, name: "chair", category: "Mobilier" },
      { id: 57, name: "couch", category: "Mobilier" },
      { id: 58, name: "potted plant", category: "Mobilier" },
      { id: 59, name: "bed", category: "Mobilier" },
      { id: 60, name: "dining table", category: "Mobilier" },
      { id: 61, name: "toilet", category: "Mobilier" },

      // 💻 Électronique
      { id: 62, name: "tv", category: "Électronique" },
      { id: 63, name: "laptop", category: "Électronique" },
      { id: 64, name: "mouse", category: "Électronique" },
      { id: 65, name: "remote", category: "Électronique" },
      { id: 66, name: "keyboard", category: "Électronique" },
      { id: 67, name: "cell phone", category: "Électronique" },

      // 🔌 Électroménager
      { id: 68, name: "microwave", category: "Électroménager" },
      { id: 69, name: "oven", category: "Électroménager" },
      { id: 70, name: "toaster", category: "Électroménager" },
      { id: 71, name: "sink", category: "Électroménager" },
      { id: 72, name: "refrigerator", category: "Électroménager" },

      // 📦 Divers
      { id: 73, name: "book", category: "Divers" },
      { id: 74, name: "clock", category: "Divers" },
      { id: 75, name: "vase", category: "Divers" },
      { id: 76, name: "scissors", category: "Divers" },
      { id: 77, name: "teddy bear", category: "Divers" },
      { id: 78, name: "hair drier", category: "Divers" },
      { id: 79, name: "toothbrush", category: "Divers" },
    ]),
      {
        ignoreDuplicates: true,
      };
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("labels", null, {});
  },
};
