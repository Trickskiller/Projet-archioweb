import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { User } from "../model/User.js";
import { Reservation } from "../model/Reservation.js";
import { Place } from "../model/Place.js";
import { Vehicule } from "../model/Vehicule.js";
import { cleanUpDatabase } from "./utils.js";
import { generateValidJwt } from "./utils.js";

// Avant de lancer les tests, on nettoie la base de données
beforeEach(cleanUpDatabase);

///////////////////////// POST /////////////////////////////

// test de la route pour créer une nouvelle réservation
describe("POST /reservations", function () {
  let user, token, place, vehicule;

  beforeEach(async function () {
    user = await User.create({
      admin: false,
      firstName: "John",
      lastName: "Shepard",
      userName: "john.shepard",
      password: "normandysr2",
    });

    place = await Place.create({
      description: "Parking près du métro",
      type: "Parking ouvert",
      geolocation: [2.3522, 48.8566],
      picture: "https://www.example.com/picture.jpg",
      userId: user._id,
    });

    vehicule = await Vehicule.create({
      type: "Voiture",
      registrationNumber: "ABC123",
      color: "Red",
      brand: "Toyota",
      userId: user._id,
    });

    token = await generateValidJwt(user);
  });

  it("should create a new reservation", async () => {
    const reservationData = {
      parkingId: place._id,
      startDate: new Date(),
      endDate: new Date(),
      vehiculeId: vehicule._id,
    };

    const res = await supertest(app)
      .post("/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send(reservationData)
      .expect(201);

    expect(res.body.message).toEqual("Réservation faite avec succès.");
    expect(res.body.reservation).toBeDefined();
  });

  // POST /reservations avec des données invalides
  describe("POST /reservations with invalid data", () => {
    it("should not create a reservation with invalid data", async () => {
      const invalidData = {
        parkingId: place._id,
        startDate: new Date(),
        endDate: "",
        vehiculeId: vehicule._id,
      };

      const res = await supertest(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(res.text).toEqual("Paramètres de réservation invalides.");
    });
  });
});

///////////////////////// GET /////////////////////////////

// test de la route pour récupérer toutes les réservations
describe("GET /reservations", function () {
  it("should retrieve all reservations", async function () {
    const res = await supertest(app).get("/reservations").expect(200);
    expect(res.body).toBeArray();
  });
});

// test de la route pour récupérer une réservation par son ID
describe("GET /reservations/:reservationId", function () {
  let reservation, user, token;

  beforeEach(async function () {
    user = await User.create({
      admin: false,
      firstName: "Tali",
      lastName: "Zorah vas Normandy",
      userName: "quarian_engineer",
      password: "keelahse'lai45",
    });

    token = await generateValidJwt(user);

    reservation = await Reservation.create({
      parkingId: "5f9c6d3f0f8b6f1e2c9e6b0f",
      startDate: new Date(),
      endDate: new Date(),
      vehiculeId: "5f9c6d3f0f8b6f1e2c9e6b0f",
      userId: user._id,
      ownerUserId: user._id,
      renterUserId: user._id,
    });
  });

  it("should retrieve a specific reservation", async function () {
    const res = await supertest(app)
      .get(`/reservations/${reservation._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body._id).toEqual(reservation._id.toString());
  });
});

///////////////////////// PUT /////////////////////////////

// test de la route pour modifier une réservation
describe("PUT /reservations/:reservationId", () => {
  let reservation, user, token;

  beforeEach(async () => {
    user = await User.create({
      admin: false,
      firstName: "Garrus",
      lastName: "Vakarian",
      userName: "sniper_turian",
      password: "6465743",
    });

    reservation = await Reservation.create({
      parkingId: "5f9c6d3f0f8b6f1e2c9e6b0f",
      startDate: new Date(),
      endDate: new Date(),
      vehiculeId: "5f9c6d3f0f8b6f1e2c9e6b0f",
      userId: user._id,
      ownerUserId: user._id,
      renterUserId: user._id,
    });

    token = await generateValidJwt(user);
  });

  it("should update an existing reservation", async () => {
    const updatedData = {
      parkingId: "5f9c6d3f0f8b6f1e2c9e6b0f",
      startDate: new Date(),
      endDate: new Date(),
      vehiculeId: "5f9c6d3f0f8b6f1e2c9e6b0f",
      userId: user._id,
      ownerUserId: user._id,
      renterUserId: user._id,
    };

    const res = await supertest(app)
      .put(`/reservations/${reservation._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedData)
      .expect(200);

    expect(res.body.message).toEqual("Réservation mise à jour avec succès");
  });

  // test de la route pour modifier une réservation pour une réservation non existante
  describe("PUT /reservations/:reservationId unauthorized user", () => {
    it("should not allow unauthorized user to update the reservation", async () => {
      // Créer un autre utilisateur et générer son token
      const otherUser = await User.create({
        admin: false,
        firstName: "Miranda",
        lastName: "Lawson",
        userName: "icequeen",
        password: "cerberus445",
      });

      const otherUserToken = await generateValidJwt(otherUser);

      const res = await supertest(app)
        .put(`/reservations/${reservation._id}`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({
          /* Données de mise à jour */
        })
        .expect(403);

      expect(res.body.error).toBeDefined();
    });
  });
});

///////////////////////// DELETE /////////////////////////////

// test de la route pour supprimer une réservation par son ID
describe("DELETE /reservations/:reservationId", () => {
  let reservation, user, token;

  beforeEach(async () => {
    user = await User.create({
      admin: false,
      firstName: "Liara",
      lastName: "T'Soni",
      userName: "prothean_lover",
      password: "shadowbroker23",
    });

    reservation = await Reservation.create({
      parkingId: "5f9c6d3f0f8b6f1e2c9e6b0f",
      startDate: new Date(),
      endDate: new Date(),
      vehiculeId: "5f9c6d3f0f8b6f1e2c9e6b0f",
      userId: user._id,
      ownerUserId: user._id,
      renterUserId: user._id,
    });

    token = await generateValidJwt(user);
  });

  it("should delete an existing reservation", async () => {
    const res = await supertest(app)
      .delete(`/reservations/${reservation._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.message).toEqual("Réservation supprimée avec succès");
  });

  // test de la route pour supprimer une réservation par son ID pour une réservation non existante
  describe("DELETE /reservations/:reservationId for non-existing reservation", () => {
    it("should not delete a non-existing reservation", async () => {
      const nonExistingId = new mongoose.Types.ObjectId();

      const res = await supertest(app)
        .delete(`/reservations/${nonExistingId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body.error).toBeDefined();
    });
  });
});

// après les tests, on se déconnecte de la base de données
afterAll(async () => {
  await mongoose.disconnect();
});
