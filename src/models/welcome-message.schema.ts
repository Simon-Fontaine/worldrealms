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

  message: {
    type: String,
    default:
      "Bienvenue sur **{server.name}** {user.mention} nous sommes maintenant `{server.member_count}` membres!",
  },
  hex_color: {
    type: String,
    default: Colors.Green,
  },
});

const name = "welcome-message";
export default mongoose.models[name] || mongoose.model(name, schema, name);
