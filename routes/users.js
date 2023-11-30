import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import config from "../../config.js";
import { User } from "../model/User.js";
import authenticate from "../auth.js";

const router = express.Router();
const secretKey = process.env.SECRET_KEY || "changeme"; // Vous devriez utiliser une clé secrète plus complexe et la stocker en sécurité.


/**
 * @api {get} /users Get a list of users
 * @apiName GetUsers
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiPermission admin
 * 
 * @apiDescription Retrieve a paginated list of users with the number of places they have posted.
 * 
 * @apiQuery {Number} [page=1] The page number to retrieve.
 * @apiQuery {Number} [limit=10] The number of users to return per page.
 * 
 * @apiSuccess {Number} total Total number of users.
 * @apiSuccess {Number} page Current page number.
 * @apiSuccess {Number} pageSize Number of users in the current page.
 * @apiSuccess {Object[]} users List of users.
 * @apiSuccess {Boolean} users.admin Indicates if the user is an admin.
 * @apiSuccess {String} users.firstName Firstname of the user.
 * @apiSuccess {String} users.lastName Lastname of the user.
 * @apiSuccess {String} users.userName Username of the user.
 * @apiSuccess {String} users.creationDate Creation date of the user.
 * @apiSuccess {String} users._id Unique ID of the user.
 * @apiSuccess {Number} users.placesCount Number of parking spots posted by the user.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "total": 100,
 *       "page": 1,
 *       "pageSize": 10,
 *       "users": [
 *         {
 *             "admin": false,
 *             "firstName": "John",
 *             "lastName": "Doe",
 *             "userName": "johndoe",
 *             "creationDate": "2022-11-20T15:05:20.254Z",
 *             "_id": "637a42301497883f834a5caa",
 *             "placesCount": 2
 *         },
 *       ]
 *     }
 * 
 * @apiError (Error 500) {Object} error Error object with a message.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Erreur lors de la récupération des utilisateurs"
 *     }
 */

// Route pour obtenir tous les utilisateurs "users"
router.get("/", async (req, res) => {
  try {
    // Récupérer les paramètres de pagination de la requête
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const usersWithPlaceCount = await User.aggregate([
      {
        $lookup: {
          from: "places", 
          localField: "_id",
          foreignField: "userId",
          as: "placesPosted",
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          userName: 1,
          placesCount: { $size: "$placesPosted" },
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Compter le nombre total d'utilisateurs (pour l'information de pagination)
    const totalUsers = await User.countDocuments();

    console.log(usersWithPlaceCount); // Afficher les résultats de l'agrégation
    console.log({ total: totalUsers, page, pageSize: usersWithPlaceCount.length, users: usersWithPlaceCount });

    res.status(200).json({
      total: totalUsers,
      page,
      pageSize: usersWithPlaceCount.length,
      users: usersWithPlaceCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des utilisateurs" });
  }
});


/**
 * @api {get} /users/:userId Get a user by ID
 * @apiName GetUserById
 * @apiGroup User
 * 
 * @apiDescription Retrieve a user by their unique ID.
 * 
 * @apiParam {String} userId Unique ID of the user.
 * 
 * @apiSuccess {Boolean} admin Role of the user.
 * @apiSuccess {String} firstName Firstname of the user.
 * @apiSuccess {String} lastName Lastname of the user.
 * @apiSuccess {String} userName Username of the user.
 * @apiSuccess {String} creationDate Creation date of the user.
 * @apiSuccess {String} _id Unique ID of the user.
 * @apiSuccess {Number} parkingSpotsPosted Number of parking spots posted by the user.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "admin": false,
 *         "firstName": "John",
 *         "lastName": "Doe",
 *         "userName": "johndoe",
 *         "creationDate": "2022-11-20T15:05:20.254Z",
 *         "_id": "637a42301497883f834a5caa",
 *         "parkingSpotsPosted": 0
 *     }
 * 
 * @apiError (Error 404) {Object} error Error object indicating the user was not found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *         "error": "Utilisateur non trouvé"
 *     }
 * 
 * @apiError (Error 500) {Object} error Error object with a code.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "23452"
 *     }
 */

// Route pour obtenir un utilisateur par son ID
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId, "-password"); 
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Impossible d'accéder aux utilisateurs" });
  }
});


/**
 * @api {post} /users Create a new user
 * @apiName CreateUser
 * @apiGroup User
 * 
 * @apiDescription Create a new user with the provided information.
 * 
 * @apiParam {String} firstName Firstname of the user.
 * @apiParam {String} lastName Lastname of the user.
 * @apiParam {String} userName Username of the user.
 * @apiParam {String} password Password of the user.
 * 
 * @apiSuccess {Boolean} admin Role of the created user.
 * @apiSuccess {String} firstName Firstname of the created user.
 * @apiSuccess {String} lastName Lastname of the created user.
 * @apiSuccess {String} userName Username of the created user.
 * @apiSuccess {String} creationDate Creation date of the created user.
 * @apiSuccess {String} _id Unique ID of the created user.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *         "admin": false,
 *         "firstName": "John",
 *         "lastName": "Doe",
 *         "userName": "johndoe",
 *         "creationDate": "2022-11-20T15:05:20.254Z",
 *         "_id": "637a42301497883f834a5caa",
 *     }
 * 
 * @apiError (Error 500) {Object} error Error object with a code.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Erreur lors de la création de l'utilisateur"
 *     }
 */

// Route pour créer un nouvel utilisateur
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, userName, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      userName,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la création de l'utilisateur" });
  }
});


/**
 * @api {put} /users/:userId Update a user by ID
 * @apiName UpdateUserById
 * @apiGroup User
 * 
 * @apiDescription Update the information of a user identified by their unique ID.
 * 
 * @apiParam {String} userId Unique ID of the user.
 * @apiParam {String} [firstName] Updated firstname of the user.
 * @apiParam {String} [lastName] Updated lastname of the user.
 * @apiParam {String} [userName] Updated username of the user.
 * @apiParam {String} [password] Updated password of the user.
 * 
 * @apiSuccess {Boolean} admin Role of the updated user.
 * @apiSuccess {String} firstName Updated firstname of the user.
 * @apiSuccess {String} lastName Updated lastname of the user.
 * @apiSuccess {String} userName Updated username of the user.
 * @apiSuccess {String} creationDate Updated creation date of the user.
 * @apiSuccess {String} _id Unique ID of the user.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *         "admin": false,
 *         "firstName": "John",
 *         "lastName": "Doe",
 *         "userName": "johndoe",
 *         "creationDate": "2022-11-20T15:05:20.254Z",
 *         "_id": "637a42301497883f834a5caa",
 *     }
 * 
 * @apiError (Error 404) {Object} error Error object indicating the user was not found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *         "error": "Utilisateur non trouvé"
 *     }
 * 
 * @apiError (Error 500) {Object} error Error object with a code.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Erreur lors de la mise à jour de l'utilisateur"
 *     }
 */

// Route de mise à jour d'un utilisateur par son ID
router.put("/:userId", async (req, res) => {
  try {
    const { firstName, lastName, userName, password } = req.body;


    const updatedUser = await User.findByIdAndUpdate(
      { _id: req.params.userId },
      {
        firstName: req.body.firstName,

        lastName: req.body.lastName,

        userName: req.body.userName,

        password: req.body.password,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Envoi de la réponse avec le message personnalisé et l'utilisateur mis à jour
    res.status(200).json({
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
  }
});


/**
 * @api {delete} /users/:userId Delete a user by ID
 * @apiName DeleteUserById
 * @apiGroup User
 * 
 * @apiDescription Delete a user identified by their unique ID.
 * 
 * @apiParam {String} userId Unique ID of the user to delete.
 * 
 * @apiSuccess {String} message Success message indicating the user was deleted.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "message": "Utilisateur supprimé avec succès"
 *     }
 * 
 * @apiError (Error 403) {Object} error Error object indicating the action is not authorized.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *         "error": "Action non autorisée"
 *     }
 * 
 * @apiError (Error 404) {Object} error Error object indicating the user was not found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *         "error": "Utilisateur non trouvé"
 *     }
 * 
 * @apiError (Error 500) {Object} error Error object with a code.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Erreur lors de la suppression de l'utilisateur"
 *     }
 */

// Route pour supprimer un utilisateur par son ID
router.delete("/:userId", authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    const authUserId = req.currentUserId; 

    // Vérifier si l'utilisateur authentifié tente de supprimer son propre compte
    if (userId !== authUserId) {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    // Rechercher et supprimer l'utilisateur
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de l'utilisateur" });
  }
});

export default router;
