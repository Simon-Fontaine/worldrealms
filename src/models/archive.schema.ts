import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
	_id: String,
	user_channel: String,
	staff_channel: String,
});

const name = 'archive';
export default mongoose.models[name] || mongoose.model(name, schema, name);
