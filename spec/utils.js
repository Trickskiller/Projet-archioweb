import { User } from "../model/User";
import { Vehicule } from "../model/Vehicule";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import { jwtSecret } from "../config.js";
import { Place } from "../model/Place";

const signJwt = promisify(jwt.sign);

export const cleanUpDatabase = async function () {
  await Promise.all([User.deleteMany()]);
  await Vehicule.deleteMany({});
  await Place.deleteMany({});
};

export function generateValidJwt(user) {
  // Generate a valid JWT which expires in 7 days.
  const exp = (new Date().getTime() + 7 * 24 * 3600 * 1000) / 1000;
  const claims = { sub: user._id.toString(), exp: exp };
  return signJwt(claims, jwtSecret);
}
