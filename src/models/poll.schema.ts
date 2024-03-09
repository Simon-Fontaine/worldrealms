import mongoose, { Schema } from "mongoose";

const reqString = {
  type: String,
  required: true,
};

const schema = new Schema({
  _id: reqString, // message.id
  guild_id: reqString,
  channel_id: reqString,
  result_message_id: String,

  creator_id: reqString,
  creator_username: reqString,

  question: reqString,

  choices: {
    type: [Object],
    required: true,
  },

  allowed_roles: [String],
  max_choices: Number,

  created_at: {
    type: Date,
    required: true,
  },
  closed_at: Date,
  expires_at: Date,
});

const name = "poll";
export default mongoose.models[name] || mongoose.model(name, schema, name);
