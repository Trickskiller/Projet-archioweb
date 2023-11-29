import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import config from "../../config.js";
import { Place } from "../model/Place.js";
import authenticate from "../auth.js";
import { broadcastMessage } from "../ws.js";
import { User } from "../model/User.js";
import { Vehicule } from "../model/Vehicule.js";
import { Reservation } from "../model/Reservation.js";

const router = express.Router();

// Route pour récupérer tous les vehicules
router.get("/", async (req, res) => {
  try {
    // Récupérer le paramètre de requête 'type', s'il existe
    const { type } = req.query;
    let query = {};

    // Si le paramètre 'type' est fourni, l'utiliser pour filtrer les résultats
    if (type) {
      query.type = type;
    }

    // Recherche des places avec le filtre appliqué
    const places = await Place.find(query);
    res.status(200).json(places);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des places" });
  }
});

//Pour filtrer la recherche de toutes les places, faire un filtre sur l'app avec des query où on peut avoir les places libres par exemple.


router.get("/:placeId", async (req, res) => {
  try {
    const placeId = req.params.placeId;

    // Recherche de la place par son ID
    const place = await Place.findById(placeId);

    // Vérifier si la place a été trouvée
    if (!place) {
      return res.status(404).json({ error: "Place non trouvée" });
    }

    res.status(200).json(place);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de la place" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    console.log("Current User ID:", req.currentUserId); // Vérifiez si l'ID de l'utilisateur est correctement reçu
    console.log("Request Body:", req.body); // Vérifiez les données reçues dans la requête

    const newPlace = new Place({
      ...req.body,
      userId: req.currentUserId, // Assurez-vous que l'utilisateur authentifié est attaché à la requête
    });

    await newPlace.save();

    broadcastMessage({
      type: 'new-place-available',
      data: {
        id: newPlace._id,
        description: newPlace.description,
        geolocation: newPlace.geolocation,
        type: newPlace.type,
        picture: newPlace.picture,

      }
    });

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
    const updatedPlace = await Place.findByIdAndUpdate(placeId, updateData, {
      new: true,
    });

    res
      .status(200)
      .json({ message: "Place mise à jour avec succès", updatedPlace });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de la place" });
  }
});

router.delete("/:placeId", authenticate, async (req, res) => {
  try {
    const placeId = req.params.placeId;
    const userId = req.currentUserId;

    // Rechercher la place par ID
    const place = await Place.findById(placeId);

    // Vérifier si la place existe
    if (!place) {
      return res.status(404).json({ error: "Place non trouvée" });
    }

    // Rechercher l'utilisateur par ID
    const user = await User.findById(userId);

    // Vérifier si l'utilisateur authentifié est le propriétaire ou admin de la place 
    if (place.userId.toString() !== userId.toString() && !user.admin) { 
      return res.status(403).json({ error: "Action non autorisée" });
    }

    // Suppression de la place
    await Place.findByIdAndDelete(placeId);

    res.status(200).json({ message: "Place supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression de la place" });
  }
});

//Choper toutes les résa liées à une seule place
router.get("/:placeId/reservations", authenticate, async (req, res) => {
  try {
    const placeId = req.params.placeId;
    const userId = req.currentUserId; // ID de l'utilisateur authentifié

    // Rechercher la place pour vérifier le propriétaire ou si l'utilisateur est admin
    const place = await Place.findById(placeId);
    const user = await User.findById(userId);
    if (!place) {
      return res.status(404).json({ error: "Place non trouvée" });
    }

    if ((place.userId.toString() !== userId.toString()) && !user.admin) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    // Récupérer les paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Rechercher les réservations avec pagination
    const reservations = await Reservation.find({ parkingId: placeId })
      .populate("renterUserId", "firstName lastName userName")
      .populate("vehiculeId", "registrationNumber")
      .skip(skip)
      .limit(limit);

    // Optionnel: Compter le nombre total de réservations pour cette place
    const totalReservations = await Reservation.countDocuments({ parkingId: placeId });

    res.status(200).json({
      total: totalReservations,
      page,
      pageSize: reservations.length,
      data: reservations
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des réservations" });
  }
});

// module.exports = router;

export default router;
