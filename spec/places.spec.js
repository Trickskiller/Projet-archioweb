import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { User } from "../model/User.js";
import { Place } from "../model/Place.js";
import { cleanUpDatabase } from "./utils.js";
import { generateValidJwt } from "./utils.js";

// Avant de lancer les tests, on nettoie la base de données
beforeEach(cleanUpDatabase);

///////////////////////// POST /////////////////////////////

// test de la route pour créer une nouvelle place
describe("POST /places", function () {
  let user, token;

  beforeEach(async function () {
    user = await User.create({
      admin: false,
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      password: "123456789",
    });

    token = await generateValidJwt(user);
  });

  it("should create a new place with user's ID", async () => {
    const placeData = {
      description: "Parking près du métro",
      type: "Parking ouvert",
      geolocation: [2.3522, 48.8566],
      picture: "https://www.example.com/picture.jpg",
      userId: user._id,
    };

    const res = await supertest(app)
      .post("/places")
      .set("Authorization", `Bearer ${token}`)
      .send(placeData)
      .expect(201);

    // Vérifier les données de la place créée
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Place créée avec succès");
    expect(res.body.newPlace).toBeDefined();
    expect(res.body.newPlace).toBeObject();
    expect(res.body.newPlace._id).toBeString();
    expect(res.body.newPlace.description).toEqual("Parking près du métro");
    expect(res.body.newPlace.type).toEqual("Parking ouvert");
    expect(res.body.newPlace.geolocation).toEqual([2.3522, 48.8566]);
    expect(res.body.newPlace.picture).toEqual(
      "https://www.example.com/picture.jpg"
    );
  });
});

// test de la route pour créer une nouvelle place sans authentification
describe("POST /places without authentication", function () {
  it("should not allow creating a place without authentication", async () => {
    const placeData = {
      description: "Parking près du parc",
      type: "Parking ouvert",
      geolocation: [2.3522, 48.8566],
    };

    const res = await supertest(app)
      .post("/places")
      .send(placeData)
      .expect(401); // Unauthorized

    expect(res.text).toBeDefined();
  });

  // test de la route pour créer une nouvelle place sans un token valide
  describe("POST /places without a valid token", () => {
    it("should not allow creating a place without a valid token", async () => {
      const placeData = {
        description: "Nouveau parking",
        type: "Garage",
        geolocation: [2.3522, 48.8566],
        picture: "https://www.example.com/picture.jpg",
      };

      const res = await supertest(app)
        .post("/places")
        .send(placeData)
        .expect(401); // Unauthorized

      expect(res.text).toEqual("Authorization header is missing");
    });
  });
});

///////////////////////// GET /////////////////////////////

// test de la route pour récupérer toutes les places
describe("GET /places", function () {
  it("should retrieve all places", async function () {
    const res = await supertest(app).get("/places").expect(200);

    expect(res.body).toBeArray();
  });
});

// test de la route pour récupérer une place par son ID
describe("GET /places/:placeId", function () {
  let place, token;

  beforeEach(async function () {
    const user = await User.create({
      admin: false,
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      password: "123456789",
    });

    place = await Place.create({
      description: "Parking près du métro",
      type: "Parking ouvert",
      geolocation: [2.3522, 48.8566],
      picture: "https://www.example.com/picture.jpg",
      userId: user._id,
    });

    token = await generateValidJwt(user);
  });

  it("should retrieve a specific place", async function () {
    const res = await supertest(app)
      .get(`/places/${place._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body._id).toEqual(place._id.toString());
  });
});

// test de la route pour récupérer une place qui n'existe pas
describe("GET /places/:placeId for non-existing place", function () {
  let token;

  beforeEach(async function () {
    const user = await User.create({
      admin: false,
      firstName: "Test",
      lastName: "User",
      userName: "test.user",
      password: "password",
    });

    token = await generateValidJwt(user);
  });

  it("should not find a non-existing place", async function () {
    const nonExistingPlaceId = new mongoose.Types.ObjectId();

    const res = await supertest(app)
      .get(`/places/${nonExistingPlaceId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(res.body.error).toBeDefined();
  });

  // test de la route pour récupérer une place avec des filtres non existants
  describe("GET /places with non-existing filters", () => {
    it("should return an empty array for non-existing type filter", async () => {
      const res = await supertest(app)
        .get("/places?type=TypeInexistant")
        .expect(200);

      expect(res.body).toBeArray();
      expect(res.body.length).toBe(0);
    });
  });

  // test de la route pour récupérer une place avec des un id non valide
  describe("GET /places/0/reservations", () => {
    it("should return an error for invalid place ID", async () => {
      const res = await supertest(app)
        .get("/places/0/reservations")
        .expect(401);
    });
  });
});

///////////////////////// PUT /////////////////////////////

// test de la route pour modifier une place
describe("PUT /places/:placeId", () => {
  let place, token;

  beforeEach(async () => {
    // Création d'un utilisateur et d'une place pour le test
    const user = await User.create({
      admin: false,
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      password: "123456789",
    });

    place = await Place.create({
      description: "Parking Test",
      type: "Parking ouvert",
      geolocation: [2.3522, 48.8566],
      picture: "https://www.example.com/picture.jpg",
      userId: user._id,
    });

    token = await generateValidJwt(user);
  });

  it("should update an existing place", async () => {
    const updatedData = {
      description: "Parking modifié",
      type: "Garage",
    };

    const res = await supertest(app)
      .put(`/places/${place._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedData)
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.message).toEqual("Place mise à jour avec succès");
    expect(res.body.updatedPlace).toBeDefined();
    expect(res.body.updatedPlace.description).toEqual(updatedData.description);
    expect(res.body.updatedPlace.type).toEqual(updatedData.type);
  });
});

// test de la route pour modifier une place pour un utilisateur non autorisé
describe("PUT /places/:placeId unauthorized user", () => {
  let place, token, otherUserToken;

  beforeEach(async () => {
    const user = await User.create({
      admin: false,
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      password: "password",
    });

    const otherUser = await User.create({
      admin: false,
      firstName: "Other",
      lastName: "User",
      userName: "other.user",
      password: "password",
    });

    place = await Place.create({
      description: "Parking",
      type: "Parking ouvert",
      geolocation: [2.3522, 48.8566],
      picture: "https://www.example.com/picture.jpg",
      userId: user._id,
    });

    token = await generateValidJwt(user);
    otherUserToken = await generateValidJwt(otherUser);
  });

  it("should not allow unauthorized user to update the place", async () => {
    const updatedData = {
      description: "Parking modifié",
      type: "Garage",
    };

    const res = await supertest(app)
      .put(`/places/${place._id}`)
      .set("Authorization", `Bearer ${otherUserToken}`)
      .send(updatedData)
      .expect(403);

    expect(res.body.error).toBeDefined();
  });
});

// test de la route pour modifier une place pa une personne qui n'est pas propriétaire de la place
describe("PUT /places/:placeId update by non-owner user", function () {
  let place, token, otherToken;

  beforeEach(async () => {
    const user = await User.create({
      admin: false,
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      password: "password",
    });

    const otherUser = await User.create({
      admin: false,
      firstName: "Other",
      lastName: "User",
      userName: "other.user",
      password: "password",
    });

    place = await Place.create({
      description: "Parking",
      type: "Parking ouvert",
      geolocation: [2.3522, 48.8566],
      userId: user._id,
    });

    token = await generateValidJwt(user);
    otherToken = await generateValidJwt(otherUser);
  });

  it("should not allow updating a place by a non-owner user", async () => {
    const updatedData = {
      description: "Parking près de la gare",
    };

    const res = await supertest(app)
      .put(`/places/${place._id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send(updatedData)
      .expect(403); // Forbidden

    expect(res.body.error).toBeDefined();
  });
});

///////////////////////// DELETE /////////////////////////////

// test de la route pour supprimer une place par son ID
describe("DELETE /places/:placeId", () => {
  let place, token;

  beforeEach(async () => {
    // Création d'un utilisateur et d'une place pour le test
    const user = await User.create({
      admin: false,
      firstName: "Jane",
      lastName: "Doe",
      userName: "jane.doe",
      password: "987654321",
    });

    place = await Place.create({
      description: "Parking à supprimer",
      type: "Parking ouvert",
      geolocation: [2.3522, 48.8566],
      userId: user._id,
    });

    token = await generateValidJwt(user);
  });

  it("should delete an existing place", async () => {
    const res = await supertest(app)
      .delete(`/places/${place._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.message).toEqual("Place supprimée avec succès");

    // Vérifier si la place a été effectivement supprimée de la base de données
    const deletedPlace = await Place.findById(place._id);
    expect(deletedPlace).toBeNull();
  });
});

// test de la route pour supprimer une place par son ID pour un utilisateur non autorisé
describe("DELETE /places/:placeId unauthorized user", () => {
  let place, token, otherUserToken;

  beforeEach(async () => {
    const user = await User.create({
      admin: false,
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      password: "password",
    });

    const otherUser = await User.create({
      admin: false,
      firstName: "Other",
      lastName: "User",
      userName: "other.user",
      password: "password",
    });

    place = await Place.create({
      description: "Parking",
      type: "Parking ouvert",
      geolocation: [2.3522, 48.8566],
      userId: user._id,
    });

    token = await generateValidJwt(user);
    otherUserToken = await generateValidJwt(otherUser);
  });

  it("should not allow unauthorized user to delete the place", async () => {
    const res = await supertest(app)
      .delete(`/places/${place._id}`)
      .set("Authorization", `Bearer ${otherUserToken}`)
      .expect(403); // Forbidden

    expect(res.body.error).toBeDefined();
  });
});

// test de la route pour supprimer une place par son ID par une personne qui n'est pas propriétaire de la place
describe("DELETE /places/:placeId by non-owner user", function () {
  let place, token, otherToken;

  beforeEach(async () => {
    const user = await User.create({
      admin: false,
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      password: "password",
    });

    const otherUser = await User.create({
      admin: false,
      firstName: "Other",
      lastName: "User",
      userName: "other.user",
      password: "password",
    });

    place = await Place.create({
      description: "Parking",
      type: "Parking ouvert",
      geolocation: [2.3522, 48.8566],
      userId: user._id,
    });

    token = await generateValidJwt(user);
    otherToken = await generateValidJwt(otherUser);
  });

  it("should not allow deleting a place by a non-owner user", async () => {
    const res = await supertest(app)
      .delete(`/places/${place._id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .expect(403); // Forbidden

    expect(res.body.error).toBeDefined();
  });
});

// après les tests, on se déconnecte de la base de données
afterAll(async () => {
  await mongoose.disconnect();
});
