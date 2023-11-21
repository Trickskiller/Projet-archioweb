import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import config from "../../config.js";
import { Place } from "../model/Place.js";
import authenticate from "../auth.js";
import { broadcastMessage } from "../ws.js";
import { User } from "../model/User.js";

const router = express.Router();

// Route pour récupérer tous les vehicules

router.get("/", async (req, res) => {
  try {
    const places = await Place.find({});
    res.send(places);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des places" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const newPlace = new Place(req.body)

    console.log(newPlace)
    await newPlace.save()
    res.status(201).send("Place enregistré avec succès.");
const user = await User.findOne ({_id: req.currentUserId})
    broadcastMessage({Update : `New reservation made by ${user.userName}`, newPlace})
  } catch (error) {
    res
    .status(403)
    .send("Erreur de création de place")
  }
})
// module.exports = router;

export default router;
