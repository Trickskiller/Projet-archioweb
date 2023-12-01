import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { cleanUpDatabase } from "./utils.js";
import { User } from "../model/User.js";
import { generateValidJwt } from "./utils.js";
import bcrypt from "bcrypt";

beforeEach(cleanUpDatabase);

// test de la route de création d'un nouvel utilisateur
describe("POST /login/signup", function () {
  it("should create a new user", async function () {
    const userData = {
      firstName: "John",
      lastName: "Doe",
      userName: "newuser",
      password: "password123",
      admin: false,
    };

    const res = await supertest(app)
      .post("/login/signup")
      .send(userData) // Envoi des données utilisateur
      .expect(201); // S'attendre à un statut 201 pour la création réussie

    // Vérifier la réponse du serveur
    expect(res.text).toEqual("Utilisateur enregistré avec succès.");
  });
});

// test de la route de connexion d'un utilisateur avec les données manquantes
describe("POST /login/signup with missing data", function () {
  it("should not create a user with missing data", async function () {
    const userData = {
      // firstName manquant
      lastName: "Doe",
      userName: "userwithoutfirstname",
      password: "password123",
      admin: false,
    };

    const res = await supertest(app)
      .post("/login/signup")
      .send(userData)
      .expect(500);
  });
});

// test de la route de connexion d'un utilisateur avec un nom d'utilisateur incorrect
describe("POST /login/connect with incorrect userName", function () {
  beforeEach(async function () {
    // Créer un utilisateur pour le test
    await User.create({
      firstName: "Valid",
      lastName: "User",
      userName: "validuser",
      password: await bcrypt.hash("password", 10),
      admin: false,
    });
  });

  it("should not authenticate with incorrect userName", async function () {
    const res = await supertest(app)
      .post("/login/connect")
      .send({ userName: "wrongusername", password: "password" })
      .expect(401); // Unauthorized pour userName incorrect

    expect(res.text).toEqual("Username incorrect.");
  });
});

// test de la route de connexion d'un utilisateur inexistant
describe("POST /login/connect with non-existing user", function () {
  it("should not authenticate a non-existing user", async function () {
    const res = await supertest(app)
      .post("/login/connect")
      .send({ userName: "nonexistinguser", password: "password" })
      .expect(401); // Unauthorized pour utilisateur inexistant

    expect(res.text).toEqual("Username incorrect.");
  });
});

// test de la route de connexion d'un utilisateur avec un format d'utilisateur incorrect
describe("POST /login/signup with invalid userName format", function () {
  it("should not create a user with an invalid userName format", async function () {
    const userData = {
      firstName: "John",
      lastName: "Doe",
      userName: "a", // Format invalide
      password: "password123",
      admin: false,
    };

    const res = await supertest(app)
      .post("/login/signup")
      .send(userData)
      .expect(500);
  });
});

// test de la route de connexion d'un utilisateur avec un mot de passe incorrect
describe("POST /login/connect with incorrect password", function () {
  beforeEach(async function () {
    // Créer un utilisateur pour le test
    await User.create({
      firstName: "Valid",
      lastName: "User",
      userName: "validuser",
      password: await bcrypt.hash("password", 10),
      admin: false,
    });
  });

  it("should not authenticate with incorrect password", async function () {
    const res = await supertest(app)
      .post("/login/connect")
      .send({ userName: "validuser", password: "wrongpassword" })
      .expect(401); // Unauthorized pour mot de passe incorrect

    expect(res.text).toEqual("mot de passe incorrect.");
  });
});

// test de la route de connexion d'un utilisateur avec des informations valides
describe("POST /login/connect with correct credentials", function () {
  beforeEach(async function () {
    // Créer un utilisateur pour le test
    await User.create({
      firstName: "Valid",
      lastName: "User",
      userName: "validuser",
      password: await bcrypt.hash("password", 10),
      admin: false,
    });
  });

  it("should authenticate with correct credentials", async function () {
    const res = await supertest(app)
      .post("/login/connect")
      .send({ userName: "validuser", password: "password" })
      .expect(200); // OK pour authentification réussie

    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
  });
});

// Test pour une route qui nécessite une authentification
test("GET /someProtectedRoute should require authentication", async () => {
  const response = await supertest(app).get("/someProtectedRoute");
  expect(response.statusCode).toBe(404); // Statut pour non autorisé
});

// Test pour une entrée invalide sur une route POST
test("POST /login/signup with invalid data should return error", async () => {
  const invalidUserData = { userName: "test" }; // Données incomplètes
  const response = await supertest(app)
    .post("/login/signup")
    .send(invalidUserData);
  expect(response.statusCode).toBe(500); // Bad request ou autre statut approprié
});

// Test pour une route qui n'existe pas
test("GET /nonExistentRoute should return 404", async () => {
  const response = await supertest(app).get("/nonExistentRoute");
  expect(response.statusCode).toBe(404); // Not Found
});

// après les tests, on se déconnecte de la base de données
afterAll(async () => {
  await mongoose.disconnect();
});
