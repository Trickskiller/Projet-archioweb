import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import config from "../../config.js";
import { Vehicule } from "../model/Vehicule.js";
import authenticate from "../auth.js";

const router = express.Router();

// Route pour récupérer toutes les places

router.get("/", async (req, res) => {
  try {
    const vehicules = await Vehicule.find();
    res.send(vehicules);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des vehicules" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const newVehicule = new Vehicule(req.body)

    console.log(newVehicule)
    await newVehicule.save()
    res.status(201).send("Véhicule enregistré avec succès.");
  } catch (error) {
    res
    .status(500)
    .json({error: "Erreur de création de véhicule"})
  }
})
// module.exports = router;

export default router;
