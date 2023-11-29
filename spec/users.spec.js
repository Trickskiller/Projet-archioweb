import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { cleanUpDatabase } from "./utils.js";

// Avant de lancer les tests, on nettoie la base de données
beforeEach(cleanUpDatabase);

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

// test de la route pour récupérer la liste des utilisateurs
describe("GET /users", function () {
  test("should retrieve the list of users", async function () {
    const res = await supertest(app)
      .get("/users")
      .expect(200)
      .expect("Content-Type", /json/);
    expect(res.body).toBeArray();
    expect(res.body).toHaveLength(0);
  });
});

// après les tests, on se déconnecte de la base de données
afterAll(async () => {
  await mongoose.disconnect();
});
