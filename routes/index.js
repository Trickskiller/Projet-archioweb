import express from "express";
const router = express.Router();

router.get("/", function (req, res, next) {
  res.send("Bienvenue sur notre application de gestion de parking !");
});

export default router;
