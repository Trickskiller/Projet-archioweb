//Reservation :
// - reservationId
// - parkingId
// - renterUserId
// - ownerUserId
// - startDate
// - endDate
// - status

import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

// Schéma de la table Reservation
const reservationSchema = new Schema({
  id: {
    type: mongoose.ObjectId,
  },
  // Relation avec le modèle Place pour savoir de quel parking il s'agit
  parkingId: {
    type: mongoose.ObjectId,
    required: true,
  },
  renterUserId: {
    type: mongoose.ObjectId,
    required: true,
  },
  ownerUserId: {
    type: mongoose.ObjectId,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["In process", "Confirmed", "Cancelled", "Finished"],
    default: "In process",
  },
});

// Exportation du modèle Reservation pour l'utiliser ailleurs dans l'application
export const Reservation = model("Reservation", reservationSchema);
