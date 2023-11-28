import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import config from "../../config.js";
import { User } from "../model/User.js";
import authenticate from "../auth.js";

const router = express.Router();
const secretKey = process.env.SECRET_KEY || "changeme"; // Vous devriez utiliser une clé secrète plus complexe et la stocker en sécurité.

// Route pour obtenir tous les utilisateurs "users"
router.get("/", async (req, res) => {
  try {
    const users = await User.find(); // N'exposez pas les mots de passe dans la réponse
    res.send(users);
  } catch (error) {
    res.status(500).json({ error: "43634" });
  }
});

// Route pour obtenir un utilisateur par son ID
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId, "-password"); // N'exposez pas le mot de passe
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "23452" });
  }
});

// Route de mise à jour d'un utilisateur par son ID
router.put("/:userId", async (req, res) => {
  try {
    const { firstName, lastName, userName, password } = req.body;

    //const user = User.findOne({_id:req.params.userId});

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

    res.status(201).send("Utilisateur modifié avec succès.");
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
  }
});

// Route pour supprimer un utilisateur par son ID
router.delete("/:userId", authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    const authUserId = req.currentUserId; // Assurez-vous que l'ID de l'utilisateur authentifié est attaché à la requête

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
    res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
  }
});

export default router;
