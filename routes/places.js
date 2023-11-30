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

/**
 * @api {get} /places Get all places
 * @apiName GetAllPlaces
 * @apiGroup Place
 * @apiVersion 1.0.0
 * 
 * @apiDescription Retrieve a list of all places. You can filter the places by type.
 *
 * @apiQuery {String} [type] Optional filter by type of the place (e.g., "Parking couvert", "Parking ouvert", "Garage", "Autre").
 * 
 * @apiSuccess {Object[]} places List of places.
 * @apiSuccess {String} places._id Unique ID of the place.
 * @apiSuccess {String} places.description Description of the place.
 * @apiSuccess {String} places.type Type of the place (e.g., "Parking couvert", "Parking ouvert", "Garage", "Autre").
 * @apiSuccess {Number[]} places.geolocation Geolocation coordinates in the format [longitude, latitude].
 * @apiSuccess {String} places.picture URL of the picture associated with the place.
 * @apiSuccess {String} places.userId Unique ID of the user who posted the place.
 * @apiSuccess {String} places.reservationId Unique ID of the reservation associated with the place.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *         {
 *             "_id": "637a42301497883f834a5caa",
 *             "description": "Covered Parking",
 *             "type": "Parking couvert",
 *             "geolocation": [2.3522, 48.8566],
 *             "picture": "https://example.com/parking.jpg",
 *             "userId": "637a42301497883f834a5cbb",
 *             "reservationId": "637a42301497883f834a5ccc"
 *         },
 *         // More places...
 *     ]
 *
 * @apiError (Error 500) {Object} error Error object with a code.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Erreur lors de la récupération des places"
 *     }
 */

// Route pour récupérer toutes les places
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


/**
 * @api {get} /places/:placeId Get place by ID
 * @apiName GetPlaceById
 * @apiGroup Place
 *
 * @apiDescription Retrieve details of a place identified by its unique ID.
 *
 * @apiParam {String} placeId Unique ID of the place.
 *
 * @apiSuccess {String} _id Unique ID of the place.
 * @apiSuccess {String} description Description of the place.
 * @apiSuccess {String} type Type of the place (e.g., "Parking couvert", "Parking ouvert", "Garage", "Autre").
 * @apiSuccess {Number[]} geolocation Geolocation coordinates in the format [longitude, latitude].
 * @apiSuccess {String} picture URL of the picture associated with the place.
 * @apiSuccess {String} userId Unique ID of the user who posted the place.
 * @apiSuccess {String} reservationId Unique ID of the reservation associated with the place.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "_id": "637a42301497883f834a5caa",
 *         "description": "Covered Parking",
 *         "type": "Parking couvert",
 *         "geolocation": [2.3522, 48.8566],
 *         "picture": "https://example.com/parking.jpg",
 *         "userId": "637a42301497883f834a5cbb",
 *         "reservationId": "637a42301497883f834a5ccc"
 *     }
 *
 * @apiError (Error 404) {Object} error Error object indicating the place was not found.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *         "error": "Place non trouvée"
 *     }
 *
 * @apiError (Error 500) {Object} error Error object with a code.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Erreur lors de la récupération de la place"
 *     }
 */

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

/**
 * @api {post} /places Create a new place
 * @apiName CreatePlace
 * @apiGroup Place
 *
 * @apiDescription Create a new place with the provided details.
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiParam {String} description Description of the place.
 * @apiParam {String} type Type of the place (e.g., "Parking couvert", "Parking ouvert", "Garage", "Autre").
 * @apiParam {Number[]} geolocation Geolocation coordinates in the format [longitude, latitude].
 * @apiParam {String} [picture] URL of the picture associated with the place.
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {Object} newPlace Details of the newly created place.
 * @apiSuccess {String} newPlace._id Unique ID of the place.
 * @apiSuccess {String} newPlace.description Description of the place.
 * @apiSuccess {String} newPlace.type Type of the place.
 * @apiSuccess {Number[]} newPlace.geolocation Geolocation coordinates.
 * @apiSuccess {String} newPlace.picture URL of the picture associated with the place.
 * @apiSuccess {String} newPlace.userId Unique ID of the user who posted the place.
 * @apiSuccess {String} newPlace.reservationId Unique ID of the reservation associated with the place.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *         "message": "Place créée avec succès",
 *         "newPlace": {
 *             "_id": "637a42301497883f834a5caa",
 *             "description": "Covered Parking",
 *             "type": "Parking couvert",
 *             "geolocation": [2.3522, 48.8566],
 *             "picture": "https://example.com/parking.jpg",
 *             "userId": "637a42301497883f834a5cbb",
 *             "reservationId": "637a42301497883f834a5ccc"
 *         }
 *     }
 *
 * @apiError (Error 500) {Object} error Error object with a code.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Erreur lors de la création de la place",
 *         "details": "Additional error details if available"
 *     }
 */

router.post("/", authenticate, async (req, res) => {
  try {
    console.log("Current User ID:", req.currentUserId); // Vérifiez si l'ID de l'utilisateur est correctement reçu
    console.log("Request Body:", req.body); // Vérifiez les données reçues dans la requête

    const newPlace = new Place({
      ...req.body,
      userId: req.currentUserId, // Ajout de l'ID de l'utilisateur courant
    });

    await newPlace.save();

    broadcastMessage({
      type: 'Nouvelle place disponible',
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
    console.error("Erreur lors de la création de la place:", error); 
    res.status(500).json({ error: error.message });
  }
});

/**
 * @api {put} /places/:placeId Update a place
 * @apiName UpdatePlace
 * @apiGroup Place
 *
 * @apiDescription Update the details of a place identified by its unique ID.
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiParam {String} placeId Unique ID of the place.
 * @apiParam {String} [description] New description of the place.
 * @apiParam {String} [type] New type of the place.
 * @apiParam {Number[]} [geolocation] New geolocation coordinates.
 * @apiParam {String} [picture] New URL of the picture associated with the place.
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {Object} updatedPlace Details of the updated place.
 * @apiSuccess {String} updatedPlace._id Unique ID of the place.
 * @apiSuccess {String} updatedPlace.description Description of the place.
 * @apiSuccess {String} updatedPlace.type Type of the place.
 * @apiSuccess {Number[]} updatedPlace.geolocation Geolocation coordinates.
 * @apiSuccess {String} updatedPlace.picture URL of the picture associated with the place.
 * @apiSuccess {String} updatedPlace.userId Unique ID of the user who posted the place.
 * @apiSuccess {String} updatedPlace.reservationId Unique ID of the reservation associated with the place.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "message": "Place mise à jour avec succès",
 *         "updatedPlace": {
 *             "_id": "637a42301497883f834a5caa",
 *             "description": "Updated Covered Parking",
 *             "type": "Parking couvert",
 *             "geolocation": [2.3522, 48.8566],
 *             "picture": "https://example.com/updated-parking.jpg",
 *             "userId": "637a42301497883f834a5cbb",
 *             "reservationId": "637a42301497883f834a5ccc"
 *         }
 *     }
 *
 * @apiError (Error 404) {Object} error Error object indicating the place was not found.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *         "error": "Place non trouvée"
 *     }
 *
 * @apiError (Error 403) {Object} error Error object indicating unauthorized access.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *         "error": "Action non autorisée"
 *     }
 *
 * @apiError (Error 500) {Object} error Error object with a code.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Erreur lors de la mise à jour de la place"
 *     }
 */

router.put("/:placeId", authenticate, async (req, res) => {
  try {
    const placeId = req.params.placeId;
    const updateData = req.body;
    const userId = req.currentUserId; 

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

/**
 * @api {delete} /places/:placeId Delete a place
 * @apiName DeletePlace
 * @apiGroup Place
 *
 * @apiDescription Delete a place identified by its unique ID.
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiParam {String} placeId Unique ID of the place.
 *
 * @apiSuccess {String} message Success message.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "message": "Place supprimée avec succès"
 *     }
 *
 * @apiError (Error 404) {Object} error Error object indicating the place was not found.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *         "error": "Place non trouvée"
 *     }
 *
 * @apiError (Error 403) {Object} error Error object indicating unauthorized access.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *         "error": "Action non autorisée"
 *     }
 *
 * @apiError (Error 500) {Object} error Error object with a code.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Erreur lors de la suppression de la place"
 *     }
 */

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
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la place" });
  }
});

/**
 * @api {get} /places/:placeId/reservations Get reservations for a place
 * @apiName GetPlaceReservations
 * @apiGroup Place
 * @apiVersion 1.0.0
 * @apiPermission user
 *
 * @apiDescription Get all reservations associated with a specific place, with support for pagination.
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiParam {String} placeId Unique ID of the place.
 *
 * @apiQuery {Number} [page=1] Page number for pagination.
 * @apiQuery {Number} [limit=10] Number of reservations per page.
 *
 * @apiSuccess {Number} total Total number of reservations for the place.
 * @apiSuccess {Number} page Current page number.
 * @apiSuccess {Number} pageSize Number of reservations in the current page.
 * @apiSuccess {Object[]} data List of reservations for the place.
 * @apiSuccess {String} data._id Reservation ID.
 * @apiSuccess {Object} data.renterUserId Renter user details.
 * @apiSuccess {String} data.renterUserId._id Renter user ID.
 * @apiSuccess {String} data.renterUserId.firstName Renter user's first name.
 * @apiSuccess {String} data.renterUserId.lastName Renter user's last name.
 * @apiSuccess {String} data.renterUserId.userName Renter user's username.
 * @apiSuccess {Object} data.vehiculeId Vehicule details.
 * @apiSuccess {String} data.vehiculeId.registrationNumber Vehicule registration number.
 * @apiSuccess {Date} data.startDate Start date of the reservation.
 * @apiSuccess {Date} data.endDate End date of the reservation.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "total": 25,
 *       "page": 1,
 *       "pageSize": 10,
 *       "data": [
 *         {
 *           "_id": "5f50c31f1234567890123456",
 *           "renterUserId": {
 *             "_id": "5f50c31f1234567890123456",
 *             "firstName": "Jean",
 *             "lastName": "Doe",
 *             "userName": "jeando"
 *           },
 *           "vehiculeId": {
 *             "registrationNumber": "AB-123-CD"
 *           },
 *           "startDate": "2023-01-01T00:00:00.000Z",
 *           "endDate": "2023-01-07T00:00:00.000Z"
 *         }
 *         // ... other reservations
 *       ]
 *     }
 *
 * @apiError (Error 404) {Object} error Error object indicating the place was not found.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *         "error": "Place non trouvée"
 *     }
 *
 * @apiError (Error 403) {Object} error Error object indicating unauthorized access.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *         "error": "Accès non autorisé"
 *     }
 *
 * @apiError (Error 500) {Object} error Error object with a message.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Erreur lors de la récupération des réservations"
 *     }
 */

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


export default router;
