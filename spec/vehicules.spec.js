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
    expect(res.text).toEqual("Véhicule enregistré avec succès.");
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
});

///////////////////////// PUT /////////////////////////////

// test de la route pour mettre à jour un véhicule
describe("PUT /vehicules/:vehiculeId", function () {
  let vehicle, updatedData, token;

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

    // Vérifiez si le véhicule a bien été supprimé de la base de données
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
});

afterAll(async () => {
  await mongoose.disconnect();
});
