const express = require("express");
const app = express();

require("dotenv").config();

const PORT = process.env.PORT || 5000;

const cors = require("cors");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(PORT, () => console.log(`Example app listening on port: ${PORT}!`));
