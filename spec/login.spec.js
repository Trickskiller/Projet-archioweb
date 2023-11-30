import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { cleanUpDatabase } from "./utils.js";
import { User } from "../model/User.js";
import { generateValidJwt } from "./utils.js";
import bcrypt from "bcrypt";

beforeEach(cleanUpDatabase);

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
      .post("/login/signup") // Assurez-vous que ce chemin correspond à votre route d'inscription
      .send(userData)
      .expect(201);

    expect(res.text).toEqual("Utilisateur enregistré avec succès.");
  });
});

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

describe("POST /login/connect with non-existing user", function () {
  it("should not authenticate a non-existing user", async function () {
    const res = await supertest(app)
      .post("/login/connect")
      .send({ userName: "nonexistinguser", password: "password" })
      .expect(401); // Unauthorized pour utilisateur inexistant

    expect(res.text).toEqual("Username incorrect.");
  });
});

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

// après les tests, on se déconnecte de la base de données
afterAll(async () => {
  await mongoose.disconnect();
});
