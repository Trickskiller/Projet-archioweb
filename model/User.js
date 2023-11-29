import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

// create userSchema
const userSchema = new Schema({
  id: {
    type: mongoose.ObjectId,
  },
  admin: {
    type: Boolean,

    default: false,
  },
  firstName: {
    type: String,
    required: [true, "You must provide a name!"],

    maxLength: 20,

    minLength: 3,
  },
  lastName: {
    type: String,

    required: [true, "You must provide a lastname!"],

    maxLength: 20,

    minLength: 3,
  },

  userName: {
    type: String,

    required: [true, "You must provide a username!"],

    maxLength: 20,

    minLength: 3,

    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

userSchema.set("toJSON", {
  transform: transformJsonUser,
});
function transformJsonUser(doc, json, options) {
  // Remove the hashed password and _v from the generated JSON.
  delete json.password;
  delete json.__v;
  return json;
}

// Exportation du modèle User pour l'utiliser ailleurs dans l'application

export const User = model("User", userSchema);
