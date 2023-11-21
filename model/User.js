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
// Hook pre-save pour hacher le mot de passe avant d'enregistrer l'utilisateur
userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) return next();
  bcrypt.hash(user.password, 10, (err, hash) => {
    if (err) return next(err);
    user.password = hash;
    next();
  });
}); // Exportation du modèle User pour l'utiliser ailleurs dans l'application
// const User = mongoose.model("User", userSchema);

export const User = model("User", userSchema);
