import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { cleanUpDatabase } from "./utils.js";
import { User } from "../model/User.js";
import { Place } from "../model/Place.js";

import { generateValidJwt } from "./utils.js";

// Avant de lancer les tests, on nettoie la base de données
beforeEach(cleanUpDatabase);

// POST ///////////////////////////////////////////////////////////

// test de la route pour créer un nouvel utilisateur
describe("POST /users", function () {
  it("should create a user", async function () {
    const res = await supertest(app)
      .post("/users")
      .send({
        admin: false,
        firstName: "John",
        lastName: "Doe",
        userName: "john.doe",
        password: "123456789",
      })
      .expect(201)
      .expect("Content-Type", /json/);
    expect(res.body).toBeObject();
    expect(res.body._id).toBeString();
    expect(res.body.admin).toBeFalse();
    expect(res.body.firstName).toEqual("John");
    expect(res.body.lastName).toEqual("Doe");
    expect(res.body.userName).toEqual("john.doe");
    expect(res.body).toContainAllKeys([
      "_id",
      "admin",
      "firstName",
      "lastName",
      "userName",
    ]);
  });
});

// test de la route pour créer un nouvel utilisateur avec un userName en double
describe("POST /users with duplicate userName", function () {
  beforeEach(async function () {
    await User.create({
      admin: false,
      firstName: "Duplicate",
      lastName: "User",
      userName: "duplicate.user",
      password: "password123",
    });
  });

  it("should not allow duplicate userName", async function () {
    const res = await supertest(app)
      .post("/users")
      .send({
        admin: false,
        firstName: "Another",
        lastName: "User",
        userName: "duplicate.user", // userName en double
        password: "password456",
      })
      .expect(500);

    expect(res.body.error).toBeDefined();
  });
});

// test de la route pour entrer un utilisateur avec des données invalides
describe("POST /users with invalid data", function () {
  it("should not create a user with invalid data", async function () {
    const res = await supertest(app)
      .post("/users")
      .send({
        admin: false,
        firstName: "", // Donnée invalide
        lastName: "Doe",
        userName: "john.doe",
        password: "123",
      })
      .expect(500);

    expect(res.body).toBeObject();
    expect(res.body.error).toBeDefined();
  });
});

// GET ///////////////////////////////////////////////////////////

// test de la route pour récupérer la liste des utilisateurs
describe("GET /users", function () {
  // on crée un utilisateur dans la base de données
  let johnDoe;
  let janeDoe;
  beforeEach(async function () {
    // on crée deux utilisateurs dans la base de données
    [johnDoe, janeDoe] = await Promise.all([
      User.create({
        admin: false,
        firstName: "John",
        lastName: "Doe",
        userName: "john.doe",
        password: "123456789",
      }),
      User.create({
        admin: false,
        firstName: "Jane",
        lastName: "Doe",
        userName: "jane.doe",
        password: "123456789",
      }),
    ]);
    // on crée deux places dans la base de données
    await Promise.all([
      Place.create({
        description: "Place 1 de John",
        type: "Parking ouvert",
        geolocation: [48.856614, 2.3522219],
        userId: johnDoe._id,
      }),
      Place.create({
        description: "Place 2 de Jane",
        type: "Garage",
        geolocation: [5, 45],
        userId: janeDoe._id,
      }),
    ]);
  });

  // test de la route pour récupérer la liste des utilisateurs avec le nombre de places (pagination)
  test("should retrieve a paginated list of users with places count", async () => {
    const res = await supertest(app)
      .get("/users?page=1&limit=2")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body).toContainKeys(["total", "page", "pageSize", "users"]);
    expect(res.body.users).toBeArray();
    expect(res.body.users).toHaveLength(2);

    res.body.users.forEach((user) => {
      expect(user).toContainAllKeys([
        "_id",
        "firstName",
        "lastName",
        "userName",
        "placesCount",
      ]);
      expect(user.placesCount).toBeNumber();
    });
  });
});

// on vérifie que la route pour récupérer un utilisateur par son ID fonctionne
describe("GET /users/:userId", function () {
  let user;

  beforeEach(async function () {
    user = await User.create({
      admin: false,
      firstName: "Test",
      lastName: "User",
      userName: "test.user",
      password: "testpassword",
    });
  });

  it("should retrieve a specific user", async function () {
    const res = await supertest(app)
      .get(`/users/${user._id}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toBeObject();
    expect(res.body._id).toEqual(user._id.toString());
    expect(res.body.firstName).toEqual("Test");
    expect(res.body.lastName).toEqual("User");
    expect(res.body.userName).toEqual("test.user");
  });
});

// on vérifie si la route pour récupérer un utilisateur par son ID nefonctionne pas pour un utilisateur qui n'existe pas
describe("GET /users/:userId for non-existing user", function () {
  it("should not find a non-existing user", async function () {
    const nonExistingUserId = new mongoose.Types.ObjectId();

    const res = await supertest(app)
      .get(`/users/${nonExistingUserId}`)
      .expect(404);

    expect(res.body.error).toBeDefined();
  });
});

// PUT///////////////////////////////////////////////////////////

// test de la route pour modifier un utilisateur
describe("PUT /users/:userId", function () {
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

  it("should update a user", async function () {
    const updatedData = {
      firstName: "Johnny",
      lastName: "Doey",
      userName: "johnny.doey",
      password: "987654321",
    };

    const res = await supertest(app)
      .put(`/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`) // Inclure le JWT dans l'en-tête Authorization
      .send(updatedData)
      .expect(200);

    // Vérifier que la réponse contient les données mises à jour
    expect(res.body).toBeObject();
    expect(res.body.message).toEqual("Utilisateur mis à jour avec succès");
    expect(res.body.user).toBeObject();
    expect(res.body.user.firstName).toEqual(updatedData.firstName);
    expect(res.body.user.lastName).toEqual(updatedData.lastName);
    expect(res.body.user.userName).toEqual(updatedData.userName);
  });
});

// DELETE///////////////////////////////////////////////////////////

// test de la route pour supprimer un utilisateur par son ID
describe("DELETE /users/:userId", function () {
  let user, token;

  beforeEach(async function () {
    // Créer un utilisateur pour le test
    user = await User.create({
      admin: false,
      firstName: "Jane",
      lastName: "Doe",
      userName: "jane.doe",
      password: "987654321",
    });

    // Générer un JWT valide pour cet utilisateur
    token = await generateValidJwt(user);
  });

  it("should delete a user", async function () {
    const res = await supertest(app)
      .delete(`/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`) // Inclure le JWT dans l'en-tête Authorization
      .expect(200);

    // Vérifier si l'utilisateur a été supprimé
    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });
});

// test de la route pour supprimer un utilisateur non existant par son id
describe("DELETE /users/:userId for non-existing user", function () {
  it("should not delete a non-existing user", async function () {
    const nonExistingUserId = new mongoose.Types.ObjectId();

    const res = await supertest(app)
      .delete(`/users/${nonExistingUserId}`)
      .expect(401);
  });
});

// après les tests, on se déconnecte de la base de données
afterAll(async () => {
  await mongoose.disconnect();
});
