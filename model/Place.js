import mongoose, { Schema, model } from "mongoose";

// Fonctions pour valider la géolocalisation
function validateGeoJsonCoordinates(value) {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    value.length <= 3 &&
    isLongitude(value[0]) &&
    isLatitude(value[1])
  );
}

function isLatitude(value) {
  return value >= -90 && value <= 90;
}

function isLongitude(value) {
  return value >= -180 && value <= 180;
}

// Définition du schéma Place
const placeSchema = new mongoose.Schema({

  id: {
    type: mongoose.ObjectId
  },

  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["Parking couvert", "Parking ouvert", "Garage", "Autre"], // Ajustez ces types selon vos besoins
  },
  geolocation: {
    type: [Number], // Format [longitude, latitude]
    required: true,
    validate: {
      validator: validateGeoJsonCoordinates,
      message: '{VALUE} est pas une coordonnée géographique valide!',
    },
  },
  picture: {
    type: String,
    required: false,
  },
  availabilityDate: {
    type: Date,
    required: false,
  },
  // Relation avec le modèle User pour savoir qui a posté la place -> propriétaire
  userId: {
    type: mongoose.ObjectId,
    required: true,
  },
  

});


// Exportation du modèle Place pour l'utiliser ailleurs dans l'application
// const Place = mongoose.model("Place", placeSchema);
// module.exports = Place;

export const Place = model("Place", placeSchema);

