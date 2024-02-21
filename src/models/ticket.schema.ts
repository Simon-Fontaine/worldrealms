import mongoose, { Schema } from "mongoose";

const reqString = {
  type: String,
  required: true,
};

const notReqBoolean = {
  type: Boolean,
  required: false,
  default: false,
};

const schema = new Schema(
  {
    _id: reqString, // channel.id (ticket id)
    guild_id: reqString,

    type: reqString,
    label: reqString,

    creator_id: reqString,
    creator_username: reqString,

    claimed_id: String,
    claimed_username: String,

    closed_id: String,
    closed_username: String,

    added_members: {
      type: Array<String>,
      required: false,
      default: [],
    },

    locked: notReqBoolean,
    claimed: notReqBoolean,
    closed: notReqBoolean,
  },
  {
    timestamps: true,
  },
);

const name = "ticket";
export default mongoose.models[name] || mongoose.model(name, schema, name);
