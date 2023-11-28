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

// Route pour récupérer toutes les résa
router.get("/", async (req, res) => {
    try {
      const reservations = await Reservation.find();
      res.send(reservations);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des réservations" });
    }
  });

// Route pour créer une nouvelle réservation
router.post("/", authenticate, async (req, res) => {
  try {
    // Extraire les informations nécessaires de la requête
    const { parkingId, startDate, endDate } = req.body;

    // Vérifier la validité des données (ajoutez d'autres validations au besoin)
    if (!parkingId || !startDate || !endDate) {
      return res.status(400).send("Paramètres de réservation invalides.");
    }

    // Récupérer les détails de la place pour obtenir l'ID du propriétaire
    const placeDetails = await Place.findOne({ _id: parkingId });

    // Vérifier si la place existe
    if (!placeDetails) {
      return res
        .status(404)
        .send("La place de parking spécifiée n'existe pas.");
    }

    // Créer une nouvelle réservation avec les données de la requête
    const newReservation = new Reservation({
      parkingId,
      renterUserId: req.currentUserId,
      ownerUserId: placeDetails.userId, // Utiliser l'ID du propriétaire de la place
      startDate,
      endDate,
      status: "In process",
    });

    // Sauvegarder la nouvelle réservation dans la base de données
    await newReservation.save();

    // Récupérer le nom d'utilisateur du locataire pour la notification
    const user = await User.findOne({ _id: req.currentUserId });

    // Envoyer une réponse réussie avec un statut 201
    res.status(201).json({
      message: "Réservation faite avec succès.",
      reservation: newReservation,
    });

    // Diffuser un message de notification
    broadcastMessage({
      update: `Nouvelle réservation effectuée par ${user.userName}`,
      newReservation,
    });
  } catch (error) {
    console.error("Erreur de création de réservation:", error);
    res
      .status(500)
      .send("Erreur interne du serveur lors de la création de la réservation.");
  }
});


export default router;
