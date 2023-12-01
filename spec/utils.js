import { User } from "../model/User";
import { Vehicule } from "../model/Vehicule";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import { jwtSecret } from "../config.js";
import { Place } from "../model/Place";
import { Reservation } from "../model/Reservation.js";

const signJwt = promisify(jwt.sign);

// fonction pour vider la base de données avant chaque test
export const cleanUpDatabase = async function () {
  await Promise.all([User.deleteMany()]);
  await Vehicule.deleteMany({});
  await Place.deleteMany({});
  await Reservation.deleteMany({});
};
// fonction pour générer un token valide
export function generateValidJwt(user) {
  // Generate a valid JWT which expires in 7 days.
  const exp = (new Date().getTime() + 7 * 24 * 3600 * 1000) / 1000;
  const claims = { sub: user._id.toString(), exp: exp };
  return signJwt(claims, jwtSecret);
}
