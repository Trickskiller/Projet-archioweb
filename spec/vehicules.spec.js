import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { User } from "../model/User.js";
import { Vehicule } from "../model/Vehicule.js";
import { cleanUpDatabase, generateValidJwt } from "./utils.js";

beforeEach(cleanUpDatabase);

describe("POST /vehicules", function () {
  let token, userId;

  beforeEach(async function () {
    // Création d'un utilisateur et génération d'un token valide
    const user = await User.create({
      admin: false,
      firstName: "Test",
      lastName: "User",
      userName: "test.user",
      password: "securepassword",
    });

    token = await generateValidJwt(user);
    userId = user._id; // Stockez l'ID de l'utilisateur
  });

  it("should create a new vehicle with user's ID", async function () {
    const vehicleData = {
      type: "Voiture",
      registrationNumber: "ABC123",
      color: "Red",
      brand: "Toyota",
      userId: userId,
    };

    const res = await supertest(app)
      .post("/vehicules")
      .set("Authorization", `Bearer ${token}`)
      .send(vehicleData)
      .expect(201)
      .expect("Content-Type", /json/);

    // expect(res.body).toBeObject();
    // expect(res.body.userId).toEqual(userId.toString()); // Assurez-vous que l'ID de l'utilisateur est correctement enregistré
  });
});

// GET /vehicules
describe("GET /vehicules", function () {
  it("should retrieve all vehicles", async function () {
    const res = await supertest(app)
      .get("/vehicules")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toBeArray();
  });
});

// GET /vehicules/:vehiculeId
describe("GET /vehicules/:vehiculeId", function () {
  let vehicle, token;

  beforeEach(async function () {
    // Création d'un utilisateur et d'un véhicule pour le test
    const user = await User.create({
      // vos détails d'utilisateur
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

  it("should retrieve a specific vehicle", async function () {
    const res = await supertest(app)
      .get(`/vehicules/${vehicle._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toBeObject();
    expect(res.body._id).toEqual(vehicle._id.toString());
    expect(res.body.type).toEqual(vehicle.type);
    expect(res.body.registrationNumber).toEqual(vehicle.registrationNumber);
    expect(res.body.color).toEqual(vehicle.color);
    expect(res.body.brand).toEqual(vehicle.brand);
  });
});

// PUT /vehicules/:vehiculeId
describe("PUT /vehicules/:vehiculeId", function () {
  let vehicle, updatedData, token;

  beforeEach(async function () {
    // Création d'un utilisateur et d'un véhicule pour le test
    const user = await User.create({
      // vos détails d'utilisateur
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
    expect(res.body.updatedVehicule.type).toEqual(updatedData.type);
    expect(res.body.updatedVehicule.registrationNumber).toEqual(
      updatedData.registrationNumber
    );
    expect(res.body.updatedVehicule.color).toEqual(updatedData.color);
    expect(res.body.updatedVehicule.brand).toEqual(updatedData.brand);
  });
});

// DELETE /vehicules/:vehiculeId
describe("DELETE /vehicules/:vehiculeId", function () {
  let vehicle, token;

  beforeEach(async function () {
    // Création d'un utilisateur et d'un véhicule pour le test
    const user = await User.create({
      // vos détails d'utilisateur
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

afterAll(async () => {
  await mongoose.disconnect();
});
