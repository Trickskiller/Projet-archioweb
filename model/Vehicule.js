import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

// Définition du schéma Véhicule
const vehiculeSchema = new mongoose.Schema({
  id:{
    type : mongoose.ObjectId
  },
  type: {
    type: String,
    required: true,
    enum: ["Voiture", "Moto", "Vélo", "Autre"], // Vous pouvez ajouter ou modifier ces types selon vos besoins
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  color: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  // Relation avec le modèle User pour savoir à qui appartient le véhicule
  userId: {
    type: mongoose.ObjectId,
    //ref: "User",
    required: true,
  },
});

// Exportation du modèle Véhicule pour l'utiliser ailleurs dans l'application
export const Vehicule = model("Vehicule", vehiculeSchema);
