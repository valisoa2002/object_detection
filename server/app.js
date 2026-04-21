const express = require("express");
const sequelize = require("./database/connect");
const app = express();

require("dotenv").config();

const PORT = process.env.PORT || 5000;

const cors = require("cors");

app.use(cors());
app.use(express.json());

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

app.listen(PORT, () => console.log(`Example app listening on port: ${PORT}!`));
