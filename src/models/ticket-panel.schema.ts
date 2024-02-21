import mongoose, { Schema } from "mongoose";

const reqString = {
  type: String,
  required: true,
};

const schema = new Schema({
  _id: reqString, // message.id (panel id)
  guild_id: reqString,
  channel_id: reqString,

  creator_id: reqString,
  creator_username: reqString,

  paused: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const name = "ticket-panel";
export default mongoose.models[name] || mongoose.model(name, schema, name);
