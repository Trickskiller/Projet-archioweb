import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";

describe("App Routes", () => {
  // Test de la route racine
  test("GET / should return welcome message", async () => {
    const response = await supertest(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain(
      "Bienvenue sur notre application de gestion de parking !"
    );
  });

  // Test de la route /users
  test("GET /users should return a response", async () => {
    const response = await supertest(app).get("/users");
    expect(response.statusCode).toBe(200); // Ou tout autre statut attendu
  });

  // Test de la route /vehicules
  test("GET /vehicules should return a response", async () => {
    const response = await supertest(app).get("/vehicules");
    expect(response.statusCode).toBe(200); // Ou tout autre statut attendu
  });

  // Test de la route /places
  test("GET /places should return a response", async () => {
    const response = await supertest(app).get("/places");
    expect(response.statusCode).toBe(200); // Ou tout autre statut attendu
  });

  // Test de la route /reservations
  test("GET /reservations should return a response", async () => {
    const response = await supertest(app).get("/reservations");
    expect(response.statusCode).toBe(200); // Ou tout autre statut attendu
  });

  // Test de la route /login/signup
  test("POST /login/signup should register a user", async () => {
    const userData = {
      firstName: "Kaidan",
      lastName: "Alenko",
      userName: "allianceHero",
      password: "bioticGod",
    };
    const response = await supertest(app).post("/login/signup").send(userData);
    expect(response.statusCode).toBe(201); // Le statut attendu pour un succès
  });
});

// après les tests, on se déconnecte de la base de données
afterAll(async () => {
  await mongoose.disconnect();
});
