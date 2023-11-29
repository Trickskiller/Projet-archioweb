import { User } from "../model/User";

export const cleanUpDatabase = async function () {
  await Promise.all([User.deleteMany()]);
};
