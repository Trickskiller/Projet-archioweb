import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import config from "../../config.js";
import { Place } from "../model/Place.js";
import authenticate from "../auth.js";
import { broadcastMessage } from "../ws.js";
import { User } from "../model/User.js";
import { Vehicule } from "../model/Vehicule.js";

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
    const newPlace = new Place(req.body)

    console.log(newPlace)
    await newPlace.save()
    res.status(201).send("Place enregistré avec succès.");
const user = await User.findOne ({_id: req.currentUserId})
    broadcastMessage({Update : `New reservation made by ${user.userName}`, newPlace})
  } catch (error) {
    res
    .status(403)
    .send("Erreur de création de place")
  }
})

// Route de mise à jour d'un véhicule par son ID, avec vérification du propriétaire
router.put("/:placeId", authenticate , async (req, res) => {
  try {
    const _id = req.params.placeId;
    const updateData = req.body;

    // Rechercher le véhicule par ID


    // Vérifier si le véhicule existe
    if (!place) {
      return res.status(404).json({ error: "Place non trouvé" });
    }

    // Vérifier si l'utilisateur authentifié est le propriétaire du véhicule
    if (userId !== req.currentUserId) {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    // Mise à jour du véhicule

    res.status(200).json({ message: "Place mis à jour avec succès", updatedPlace });
  } catch (error) {
    res

    .status(500)
    .json({error: "Erreur de mise à jour de place"})
  }
})


// module.exports = router;

export default router;
