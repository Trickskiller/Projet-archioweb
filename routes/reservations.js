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
import schedule from "node-schedule";

const router = express.Router();

/**
 * @api {get} /reservations Get all reservations
 * @apiName GetReservations
 * @apiGroup Reservations
 *
 * @apiSuccess {Object[]} reservations List of reservations.
 * @apiSuccess {String} reservations._id Reservation ID.
 * @apiSuccess {String} reservations.parkingId Parking ID for the reservation.
 * @apiSuccess {Object} reservations.renterUserId Renter user details.
 * @apiSuccess {String} reservations.renterUserId._id Renter user ID.
 * @apiSuccess {String} reservations.renterUserId.firstName Renter user's first name.
 * @apiSuccess {String} reservations.renterUserId.lastName Renter user's last name.
 * @apiSuccess {String} reservations.renterUserId.userName Renter user's username.
 * @apiSuccess {Object} reservations.parkingId Parking details.
 * @apiSuccess {String} reservations.parkingId._id Parking ID.
 * @apiSuccess {String} reservations.parkingId.description Parking description.
 * @apiSuccess {String} reservations.parkingId.type Parking type.
 * @apiSuccess {Number[]} reservations.parkingId.geolocation Parking geolocation coordinates [longitude, latitude].
 * @apiSuccess {String} reservations.parkingId.picture Parking picture URL.
 * @apiSuccess {Date} reservations.parkingId.availabilityDate Parking availability date.
 * @apiSuccess {Object} reservations.vehiculeId Vehicule details.
 * @apiSuccess {String} reservations.vehiculeId._id Vehicule ID.
 * @apiSuccess {String} reservations.vehiculeId.registrationNumber Vehicule registration number.
 * @apiSuccess {Date} reservations.startDate Reservation start date.
 * @apiSuccess {Date} reservations.endDate Reservation end date.
 * @apiSuccess {String} reservations.status Reservation status.
 *
 * @apiError {Object} error Error object with details.
 * @apiError {String} error.message Error message.
 */
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

/**
 * @api {get} /reservations/:reservationId Get reservation by ID
 * @apiName GetReservationById
 * @apiGroup Reservations
 *
 * @apiParam {String} reservationId Reservation ID.
 *
 * @apiSuccess {String} _id Reservation ID.
 * @apiSuccess {String} parkingId Parking ID for the reservation.
 * @apiSuccess {Object} renterUserId Renter user details.
 * @apiSuccess {String} renterUserId._id Renter user ID.
 * @apiSuccess {String} renterUserId.firstName Renter user's first name.
 * @apiSuccess {String} renterUserId.lastName Renter user's last name.
 * @apiSuccess {String} renterUserId.userName Renter user's username.
 * @apiSuccess {Object} parkingId Parking details.
 * @apiSuccess {String} parkingId._id Parking ID.
 * @apiSuccess {String} parkingId.description Parking description.
 * @apiSuccess {String} parkingId.type Parking type.
 * @apiSuccess {Number[]} parkingId.geolocation Parking geolocation coordinates [longitude, latitude].
 * @apiSuccess {String} parkingId.picture Parking picture URL.
 * @apiSuccess {Date} parkingId.availabilityDate Parking availability date.
 * @apiSuccess {Object} vehiculeId Vehicule details.
 * @apiSuccess {String} vehiculeId._id Vehicule ID.
 * @apiSuccess {String} vehiculeId.registrationNumber Vehicule registration number.
 * @apiSuccess {Date} startDate Reservation start date.
 * @apiSuccess {Date} endDate Reservation end date.
 * @apiSuccess {String} status Reservation status.
 *
 * @apiError {Object} error Error object with details.
 * @apiError {String} error.message Error message.
 */
// Route pour récupérer une réservation par son ID
router.get("/:reservationId", async (req, res) => {
  try {
    const reservationId = req.params.reservationId;

    // Rechercher la réservation par son ID
    const reservation = await Reservation.findById(reservationId)
      .populate("renterUserId", "firstName lastName userName")
      .populate("parkingId")
      .populate({
        path: "vehiculeId",
        select: "registrationNumber",
      });

    // Vérifier si la réservation a été trouvée
    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    res.status(200).json(reservation);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de la réservation" });
  }
});

/**
 * @api {post} /reservations Create a new reservation
 * @apiName CreateReservation
 * @apiGroup Reservations
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiParam {String} parkingId Parking ID for the reservation.
 * @apiParam {Date} startDate Reservation start date.
 * @apiParam {Date} endDate Reservation end date.
 * @apiParam {String} vehiculeId Vehicule ID for the reservation.
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {Object} reservation Created reservation details.
 * @apiSuccess {String} reservation._id Reservation ID.
 * @apiSuccess {String} reservation.parkingId Parking ID for the reservation.
 * @apiSuccess {Object} reservation.renterUserId Renter user details.
 * @apiSuccess {String} reservation.renterUserId._id Renter user ID.
 * @apiSuccess {String} reservation.renterUserId.firstName Renter user's first name.
 * @apiSuccess {String} reservation.renterUserId.lastName Renter user's last name.
 * @apiSuccess {String} reservation.renterUserId.userName Renter user's username.
 * @apiSuccess {Object} reservation.parkingId Parking details.
 * @apiSuccess {String} reservation.parkingId._id Parking ID.
 * @apiSuccess {String} reservation.parkingId.description Parking description.
 * @apiSuccess {String} reservation.parkingId.type Parking type.
 * @apiSuccess {Number[]} reservation.parkingId.geolocation Parking geolocation coordinates [longitude, latitude].
 * @apiSuccess {String} reservation.parkingId.picture Parking picture URL.
 * @apiSuccess {Date} reservation.parkingId.availabilityDate Parking availability date.
 * @apiSuccess {Object} reservation.vehiculeId Vehicule details.
 * @apiSuccess {String} reservation.vehiculeId._id Vehicule ID.
 * @apiSuccess {String} reservation.vehiculeId.registrationNumber Vehicule registration number.
 * @apiSuccess {Date} reservation.startDate Reservation start date.
 * @apiSuccess {Date} reservation.endDate Reservation end date.
 * @apiSuccess {String} reservation.status Reservation status.
 *
 * @apiError {Object} error Error object with details.
 * @apiError {String} error.message Error message.
 */
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
      endDate: { $gte: new Date(startDate) },
    });

    if (existingReservation) {
      return res
        .status(400)
        .send("Une réservation existe déjà pour ces dates.");
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
      owner: ownerUser.userName,
    });
  } catch (error) {
    console.error("Erreur de création de réservation:", error);
    res
      .status(500)
      .send("Erreur interne du serveur lors de la création de la réservation.");
  }

 
});

/**
 * @api {put} /reservations/:reservationId Update a reservation
 * @apiName UpdateReservation
 * @apiGroup Reservations
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiParam {String} reservationId Reservation ID.
 * @apiParam {String} [parkingId] Parking ID for the reservation.
 * @apiParam {Date} [startDate] Reservation start date.
 * @apiParam {Date} [endDate] Reservation end date.
 * @apiParam {String} [vehiculeId] Vehicule ID for the reservation.
 * @apiParam {String} [status] Reservation status.
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {Object} updatedReservation Updated reservation details.
 *
 * @apiError {Object} error Error object with details.
 * @apiError {String} error.message Error message.
 */

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

    res.status(200).json({
      message: "Réservation mise à jour avec succès",
      updatedReservation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de la réservation" });
  }
});


/**
 * @api {delete} /reservations/:reservationId Delete a reservation
 * @apiName DeleteReservation
 * @apiGroup Reservations
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiParam {String} reservationId Reservation ID.
 *
 * @apiSuccess {String} message Success message.
 *
 * @apiError {Object} error Error object with details.
 * @apiError {String} error.message Error message.
 */

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
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la réservation" });
  }
});

export default router;
