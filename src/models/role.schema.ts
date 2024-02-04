import mongoose, { Schema } from 'mongoose';

const reqString = {
	type: String,
	required: true,
};

const schema = new Schema({
	_id: reqString, // role.id
	role_id: reqString,
	elevated: {
		type: Boolean,
		required: true,
	},
	weight: {
		type: Number,
		required: true,
	},
});

const name = 'role';
export default mongoose.models[name] || mongoose.model(name, schema, name);
