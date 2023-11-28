import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import config from "../../config.js";
import { Place } from "../model/Place.js";
import authenticate from "../auth.js";
import { broadcastMessage } from "../ws.js";
import { User } from "../model/User.js";

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

router.post("/", authenticate, async (req, res) => {
  try {
    console.log("Current User ID:", req.currentUserId); // Vérifiez si l'ID de l'utilisateur est correctement reçu
    console.log("Request Body:", req.body); // Vérifiez les données reçues dans la requête

    const newPlace = new Place({
      ...req.body,
      userId: req.currentUserId // Assurez-vous que l'utilisateur authentifié est attaché à la requête
    });

    await newPlace.save();
    res.status(201).json({ message: "Place créée avec succès", newPlace });
  } catch (error) {
    console.error("Erreur lors de la création de la place:", error); // Log d'erreur plus détaillé
    res.status(500).json({ error: error.message });
  }
});


router.put("/:placeId", authenticate, async (req, res) => {
  try {
    const placeId = req.params.placeId;
    const updateData = req.body;
    const userId = req.currentUserId; // Assurez-vous que l'utilisateur authentifié est attaché à la requête

    // Rechercher la place par ID
    const place = await Place.findById(placeId);

    // Vérifier si la place existe
    if (!place) {
      return res.status(404).json({ error: "Place non trouvée" });
    }

    // Vérifier si l'utilisateur authentifié est le propriétaire de la place
    if (place.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    // Mise à jour de la place
    const updatedPlace = await Place.findByIdAndUpdate(placeId, updateData, { new: true });

    res.status(200).json({ message: "Place mise à jour avec succès", updatedPlace });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour de la place" });
  }
});

router.delete("/:placeId", authenticate, async (req, res) => {
  try {
    const placeId = req.params.placeId;
    const userId = req.currentUserId; // Assurez-vous que l'utilisateur authentifié est attaché à la requête

    // Rechercher la place par ID
    const place = await Place.findById(placeId);

    // Vérifier si la place existe
    if (!place) {
      return res.status(404).json({ error: "Place non trouvée" });
    }

    // Vérifier si l'utilisateur authentifié est le propriétaire de la place
    if (place.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    // Suppression de la place
    await Place.findByIdAndDelete(placeId);

    res.status(200).json({ message: "Place supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression de la place" });
  }
});

// module.exports = router;

export default router;
