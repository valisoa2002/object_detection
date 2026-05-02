const detectController = require("../controllers/detect.controller");

const router = require("express").Router();

router.post("/", detectController.detectObject);

module.exports = router;
