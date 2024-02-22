import { Colors } from "discord.js";
import mongoose, { Schema } from "mongoose";

const reqString = {
  type: String,
  required: true,
};

const optArray = {
  type: [String],
  default: [],
};

const schema = new Schema({
  _id: reqString, // guild.id

  channel_ids: optArray,
  role_ids: optArray,

  ping_user: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: "Bienvenue sur **{server}**, {user.mention} !",
  },
  hex_color: {
    type: Number,
    default: Colors.Green,
  },
});

const name = "welcome-message";
export default mongoose.models[name] || mongoose.model(name, schema, name);
