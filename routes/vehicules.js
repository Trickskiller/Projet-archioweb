import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import config from "../../config.js";
import { Vehicule } from "../model/Vehicule.js";
import authenticate from "../auth.js";

const router = express.Router();

/**
 * @api {get} /vehicules Get all vehicles
 * @apiName GetVehicles
 * @apiGroup Vehicles
 *
 * @apiSuccess {Object[]} vehicules List of vehicles.
 * @apiSuccess {String} vehicules._id Vehicle ID.
 * @apiSuccess {String} vehicules.model Vehicle model.
 * @apiSuccess {String} vehicules.brand Vehicle brand.
 * @apiSuccess {String} vehicules.registrationNumber Vehicle registration number.
 * @apiSuccess {String} vehicules.userId Owner user ID.
 *
 * @apiError {Object} error Error object with details.
 * @apiError {String} error.message Error message.
 */
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

/**
 * @api {get} /vehicules/:vehiculeId Get vehicle by ID
 * @apiName GetVehicleById
 * @apiGroup Vehicles
 *
 * @apiParam {String} vehiculeId Vehicle ID.
 *
 * @apiSuccess {String} _id Vehicle ID.
 * @apiSuccess {String} model Vehicle model.
 * @apiSuccess {String} brand Vehicle brand.
 * @apiSuccess {String} registrationNumber Vehicle registration number.
 * @apiSuccess {String} userId Owner user ID.
 *
 * @apiError {Object} error Error object with details.
 * @apiError {String} error.message Error message.
 */
// Route pour récupérer un véhicule par son ID
router.get("/:vehiculeId", async (req, res) => {
  try {
    const vehiculeId = req.params.vehiculeId;

    // Rechercher le véhicule par son ID
    const vehicule = await Vehicule.findById(vehiculeId);

    // Vérifier si le véhicule a été trouvé
    if (!vehicule) {
      return res.status(404).json({ error: "Véhicule non trouvé" });
    }

    res.status(200).json(vehicule);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération du véhicule" });
  }
});

/**
 * @api {post} /vehicules Create a new vehicle
 * @apiName CreateVehicle
 * @apiGroup Vehicles
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiParam {String} model Vehicle model.
 * @apiParam {String} brand Vehicle brand.
 * @apiParam {String} registrationNumber Vehicle registration number.
 *
 * @apiSuccess {String} message Success message.
 *
 * @apiError {Object} error Error object with details.
 * @apiError {String} error.message Error message.
 */
//route pour créer un véhicule
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

/**
 * @api {put} /vehicules/:vehiculeId Update vehicle by ID with owner verification
 * @apiName UpdateVehicleById
 * @apiGroup Vehicles
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiParam {String} vehiculeId Vehicle ID.
 *
 * @apiSuccess {String} message Success message.
 *
 * @apiError {Object} error Error object with details.
 * @apiError {String} error.message Error message.
 */
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
      .json({ message: "Véhicule mis à jour avec succès"});
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du véhicule" });
  }
});

/**
 * @api {delete} /vehicules/:vehiculeId Delete vehicle by ID with owner verification
 * @apiName DeleteVehicleById
 * @apiGroup Vehicles
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiParam {String} vehiculeId Vehicle ID.
 *
 * @apiSuccess {String} message Success message.
 *
 * @apiError {Object} error Error object with details.
 * @apiError {String} error.message Error message.
 */
router.delete("/:vehiculeId", authenticate, async (req, res) => {
  try {
    const vehiculeId = req.params.vehiculeId;
    const userId = req.currentUserId; 

    // Rechercher le véhicule par ID
    const vehicule = await Vehicule.findById(vehiculeId);

    // Vérifier si le véhicule existe
    if (!vehicule) {
      return res.status(404).json({ error: "Véhicule non trouvé" });
    }

    // Vérifier si l'utilisateur authentifié est le propriétaire du véhicule
    if (vehicule.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    // Suppression du véhicule
    await Vehicule.findByIdAndDelete(vehiculeId);

    res.status(200).json({ message: "Véhicule supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression du véhicule" });
  }
});


export default router;
