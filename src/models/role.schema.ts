import mongoose, { Schema } from "mongoose";

const reqString = {
  type: String,
  required: true,
};

const schema = new Schema({
  _id: reqString, // role.id
  guild_id: reqString,

  name: reqString,
  elevated: {
    type: Boolean,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
});

const name = "role";
export default mongoose.models[name] || mongoose.model(name, schema, name);
