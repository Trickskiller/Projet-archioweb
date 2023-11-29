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
import schedule from 'node-schedule';

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
    const { parkingId, startDate, endDate, vehiculeId } = req.body;

    // Vérifier la validité des données (ajoutez d'autres validations au besoin)
    if (!parkingId || !startDate || !endDate || !vehiculeId) {
      return res.status(400).send("Paramètres de réservation invalides.");
    }

    // Récupérer les détails de la place pour obtenir l'ID du propriétaire
    const placeDetails = await Place.findOne({ _id: parkingId });
    console.log("Détails de la place:", placeDetails);

    // Vérifier si la place existe
    if (!placeDetails) {
      return res
        .status(404)
        .send("La place de parking spécifiée n'existe pas.");
    }

     // Vérifier s'il existe déjà une réservation pour la même place aux mêmes dates
     const existingReservation = await Reservation.findOne({
      parkingId: parkingId,
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) }
    });

    if (existingReservation) {
      return res.status(400).send("Une réservation existe déjà pour ces dates.");
    }


     // Vérifier si le véhicule appartient à l'utilisateur authentifié
     const vehicule = await Vehicule.findById(vehiculeId);
     if (!vehicule || vehicule.userId.toString() !== req.currentUserId) {
       return res.status(403).send("Véhicule non autorisé ou inexistant.");
     }

     
    // Créer une nouvelle réservation avec les données de la requête
    const newReservation = new Reservation({
      parkingId,
      renterUserId: req.currentUserId,
      ownerUserId: placeDetails.userId, // Utiliser l'ID du propriétaire de la place
      vehiculeId,
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

    // Envoyer une notification au propriétaire de la place

    const ownerUser = await User.findById(placeDetails.userId);

    broadcastMessage({
      update: `Nouvelle réservation sur votre place par ${user.userName}`,
      newReservation,
      owner: ownerUser.userName
    });
  } catch (error) {
    console.error("Erreur de création de réservation:", error);
    res
      .status(500)
      .send("Erreur interne du serveur lors de la création de la réservation.");
  }

  const notificationTime = new Date(newReservation.endDate.getTime() - 30 * 60000); // 30 minutes avant la fin

schedule.scheduleJob(notificationTime, function() {
  broadcastMessage({
    update: `Votre réservation se termine dans 30 minutes.`,
    reservation: newReservation
  });
});

});

router.put("/:reservationId", authenticate, async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    const updateData = req.body;
    const userId = req.currentUserId;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    if (reservation.renterUserId.toString() !== userId) {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    const updatedReservation = await Reservation.findByIdAndUpdate(
      reservationId,
      updateData,
      { new: true }
    );

    res.status(200).json({ message: "Réservation mise à jour avec succès", updatedReservation });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour de la réservation" });
  }
});

router.delete("/:reservationId", authenticate, async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    const userId = req.currentUserId;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    if (reservation.renterUserId.toString() !== userId) {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    await Reservation.findByIdAndDelete(reservationId);

    res.status(200).json({ message: "Réservation supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression de la réservation" });
  }
});



export default router;
