import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import config from "../../config.js";
import { Place } from "../model/Place.js";
import authenticate from "../auth.js";

const router = express.Router();

// Route pour récupérer tous les vehicules

router.get("/", async (req, res) => {
  try {
    const places = await Place.find({});
    res.send(places);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des places" });
  }
});

// module.exports = router;

export default router;
