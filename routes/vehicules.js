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
// Route pour récupérer un véhicule par son ID
router.post("/", authenticate, async (req, res) => {
  try {
    const newVehicule = new Vehicule(req.body);

    console.log(newVehicule);
    newVehicule.userId = req.currentUserId;
    console.log(req.currentUserId);
    await newVehicule.save();
    res.status(201).send("Véhicule enregistré avec succès.");
  } catch (error) {
    res.status(500).json({ error: "Erreur de création de véhicule" });
  }
});

// Route de mise à jour d'un véhicule par son ID, avec vérification du propriétaire
router.put("/:vehiculeId", authenticate, async (req, res) => {
  try {
    console.log("Mise à jour du véhicule", req.params.vehiculeId);
    const vehiculeId = req.params.vehiculeId;
    const updateData = req.body;

    const vehicule = await Vehicule.findById(vehiculeId);
    console.log("Véhicule trouvé:", vehicule);

    if (!vehicule) {
      return res.status(404).json({ error: "Véhicule non trouvé" });
    }

    console.log(
      "Vérification du propriétaire",
      vehicule.userId,
      req.currentUserId
    );
    if (vehicule.userId.toString() !== req.currentUserId) {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    const updatedVehicule = await Vehicule.findByIdAndUpdate(
      vehiculeId,
      updateData,
      { new: true }
    );
    console.log("Véhicule mis à jour", updatedVehicule);

    res
      .status(200)
      .json({ message: "Véhicule mis à jour avec succès", updatedVehicule });
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du véhicule" });
  }
});

// module.exports = router;

export default router;
