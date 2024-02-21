import mongoose, { Schema } from "mongoose";

const reqString = {
  type: String,
  required: true,
};

const schema = new Schema({
  _id: reqString, // guild.id

  user_channel: String,
  staff_channel: String,
});

const name = "archive";
export default mongoose.models[name] || mongoose.model(name, schema, name);
