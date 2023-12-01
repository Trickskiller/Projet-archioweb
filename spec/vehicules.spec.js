import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { User } from "../model/User.js";
import { Vehicule } from "../model/Vehicule.js";
import { cleanUpDatabase } from "./utils.js";

import { generateValidJwt } from "./utils.js";

beforeEach(cleanUpDatabase);

///////////////////////// POST /////////////////////////////

// test de la route pour créer un nouveau véhicule
describe("POST /vehicules", function () {
  let user, token;

  beforeEach(async function () {
    // Créer un utilisateur pour le test
    user = await User.create({
      admin: false,
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      password: "123456789",
    });

    // Générer un JWT valide pour cet utilisateur
    token = await generateValidJwt(user);
  });

  it("should create a new vehicle with user's ID", async () => {
    const vehicleData = {
      type: "Voiture",
      registrationNumber: "XYZ123",
      color: "Red",
      brand: "Toyota",
    };

    const res = await supertest(app)
      .post("/vehicules")
      .set("Authorization", `Bearer ${token}`)
      .send(vehicleData)
      .expect(201);

    // Vérifier les données du véhicule créé
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Véhicule enregistré avec succès.");
    expect(res.body.newVehicule).toBeDefined();
    expect(res.body.newVehicule.type).toEqual(vehicleData.type);
    expect(res.body.newVehicule.registrationNumber).toEqual(
      vehicleData.registrationNumber
    );
    expect(res.body.newVehicule.color).toEqual(vehicleData.color);
    expect(res.body.newVehicule.brand).toEqual(vehicleData.brand);
    expect(res.body.newVehicule.userId).toEqual(user._id.toString());
  });
});

// test de la route pour créer un nouveau véhicule avec des données invalides
describe("POST /vehicules with invalid data", function () {
  let token;

  beforeEach(async function () {
    const user = await User.create({
      admin: false,
      firstName: "Invalid",
      lastName: "Data",
      userName: "invalid.data",
      password: "password",
    });

    token = await generateValidJwt(user);
  });

  it("should not create a vehicle with invalid data", async function () {
    const invalidVehicleData = {
      type: "InvalidType", // Type non valide
      registrationNumber: "123", // Numéro d'immatriculation non valide
      color: "", // Couleur manquante
      brand: "", // Marque manquante
    };

    const res = await supertest(app)
      .post("/vehicules")
      .set("Authorization", `Bearer ${token}`)
      .send(invalidVehicleData)
      .expect(500); // Erreur serveur

    expect(res.body.error).toBeDefined();
  });
});

///////////////////////// GET /////////////////////////////

// test de la route pour récupérer tous les véhicules
describe("GET /vehicules", function () {
  it("should retrieve all vehicles", async function () {
    const res = await supertest(app).get("/vehicules").expect(200);

    expect(res.body).toBeArray();
  });
});

// test de la route pour récupérer tous les véhicules d'un utilisateur
describe("GET /vehicules/:vehiculeId", function () {
  let vehicle, token;

  beforeEach(async function () {
    const user = await User.create({
      $admin: false,
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      password: "123456789",
    });

    vehicle = await Vehicule.create({
      type: "Voiture",
      registrationNumber: "ABC123",
      color: "Red",
      brand: "Toyota",
      userId: user._id,
    });

    token = await generateValidJwt(user);
  });

  // test de la route pour récupérer un véhicule par son ID
  it("should retrieve a specific vehicle", async function () {
    const res = await supertest(app)
      .get(`/vehicules/${vehicle._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body._id).toEqual(vehicle._id.toString());
  });

  // Test GET /vehicules/:vehiculeId pour un véhicule non existant
  describe("GET /vehicules/:vehiculeId for non-existing vehicle", () => {
    let token;

    beforeEach(async () => {
      const user =
        (await User.create({
          $admin: false,
          firstName: "Ashley",
          lastName: "Williams",
          userName: "terra.firma",
          password: "shootStuff324",
        })) || {};
      token = await generateValidJwt(user);
    });

    it("should return 404 for a non-existing vehicle", async () => {
      const nonExistingVehicleId = new mongoose.Types.ObjectId().toString();
      const res = await supertest(app)
        .get(`/vehicules/${nonExistingVehicleId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });
});

///////////////////////// PUT /////////////////////////////

// Test de mise à jour d'un véhicule existant
describe("PUT /vehicules/:vehiculeId", function () {
  let vehicle, updatedData, token;

  beforeEach(async function () {
    const user = await User.create({
      admin: false,
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      password: "123456789",
    });

    vehicle = await Vehicule.create({
      type: "Voiture",
      registrationNumber: "ABC123",
      color: "Red",
      brand: "Toyota",
      userId: user._id,
    });

    updatedData = {
      type: "Moto",
      registrationNumber: "XYZ789",
      color: "Blue",
      brand: "Honda",
    };

    token = await generateValidJwt(user);
  });

  it("should update an existing vehicle", async function () {
    const res = await supertest(app)
      .put(`/vehicules/${vehicle._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedData)
      .expect(200);

    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Véhicule mis à jour avec succès");
  });
});

// Test de mise à jour d'un véhicule non existant
describe("PUT /vehicules/:vehiculeId for non-existing vehicle", () => {
  let token;

  beforeEach(async () => {
    const user = await User.create({
      admin: false,
      firstName: "Thane",
      lastName: "Krios",
      userName: "drellAssassin",
      password: "hanariSniper33",
    });
    token = await generateValidJwt(user);
  });

  it("should return 404 for a non-existing vehicle", async () => {
    const nonExistingVehicleId = new mongoose.Types.ObjectId().toString();
    const res = await supertest(app)
      .put(`/vehicules/${nonExistingVehicleId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(res.body.error).toBeDefined();
  });
});

// Test de mise à jour d'un véhicule avec un utilisateur non autorisé
describe("PUT /vehicules/:vehiculeId with unauthorized user", () => {
  let vehicle, unauthorizedUserToken;

  beforeEach(async () => {
    // Création d'un utilisateur propriétaire du véhicule
    const ownerUser = await User.create({
      admin: false,
      firstName: "James",
      lastName: "Vega",
      userName: "allianceSoldier",
      password: "FutureN7",
    });

    // Création d'un véhicule appartenant à ownerUser
    vehicle = await Vehicule.create({
      type: "Voiture",
      registrationNumber: "ABC123",
      color: "Red",
      brand: "Toyota",
      userId: ownerUser._id,
    });

    // Création d'un autre utilisateur (non autorisé)
    const unauthorizedUser = await User.create({
      admin: false,
      firstName: "Jack",
      lastName: "Harper",
      userName: "cerberusLeader",
      password: "IllusiveMan",
    });
    unauthorizedUserToken = await generateValidJwt(unauthorizedUser);
  });

  it("should not allow an unauthorized user to update the vehicle", async () => {
    const updatedData = {
      type: "Moto",
      registrationNumber: "XYZ789",
      color: "Blue",
      brand: "Honda",
    };

    const res = await supertest(app)
      .put(`/vehicules/${vehicle._id}`)
      .set("Authorization", `Bearer ${unauthorizedUserToken}`)
      .send(updatedData);

    expect(res.statusCode).toBe(403); // Forbidden
    expect(res.body.error).toBeDefined();
  });
});

///////////////////////// DELETE /////////////////////////////

// test de la route pour supprimer un véhicule par son ID
describe("DELETE /vehicules/:vehiculeId", function () {
  let vehicle, token;

  beforeEach(async function () {
    // Création d'un utilisateur et d'un véhicule pour le test
    const user = await User.create({
      $admin: false,
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      password: "123456789",
    });

    vehicle = await Vehicule.create({
      type: "Voiture",
      registrationNumber: "ABC123",
      color: "Red",
      brand: "Toyota",
      userId: user._id,
    });

    token = await generateValidJwt(user);
  });

  it("should delete an existing vehicle", async function () {
    const res = await supertest(app)
      .delete(`/vehicules/${vehicle._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Véhicule supprimé avec succès");

    // Vérification pour voir si le véhicule a bien été supprimé de la base de données
    const deletedVehicle = await Vehicule.findById(vehicle._id);
    expect(deletedVehicle).toBeNull();
  });
});

// test de la route pour supprimer un véhicule par son ID
describe("DELETE /vehicules/:vehiculeId for non-existing vehicle", function () {
  let token;

  beforeEach(async function () {
    const user = await User.create({
      $admin: false,
      firstName: "Joh",
      lastName: "Amon",
      userName: "joh.amon",
      password: "12349433gfverve",
    });

    token = await generateValidJwt(user);
  });

  it("should not delete a non-existing vehicle", async function () {
    const nonExistingVehicleId = new mongoose.Types.ObjectId();

    const res = await supertest(app)
      .delete(`/vehicules/${nonExistingVehicleId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404); // Not Found

    expect(res.body.error).toBeDefined();
  });

  // Test DELETE /vehicules/:vehiculeId pour un véhicule non existant
  describe("DELETE /vehicules/:vehiculeId for non-existing vehicle", () => {
    let token;

    beforeEach(async () => {
      const user = await User.create({
        $admin: false,
        firstName: "Wrex",
        lastName: "Urdnot",
        userName: "kroganWarlord",
        password: "gruntIsMySon",
      });
      token = await generateValidJwt(user);
    });

    it("should return 404 for a non-existing vehicle", async () => {
      const nonExistingVehicleId = new mongoose.Types.ObjectId().toString();
      const res = await supertest(app)
        .delete(`/vehicules/${nonExistingVehicleId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });
});

// après les tests, on se déconnecte de la base de données
afterAll(async () => {
  await mongoose.disconnect();
});
