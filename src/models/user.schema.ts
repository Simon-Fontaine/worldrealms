import mongoose, { Schema } from 'mongoose';

const reqString = {
	type: String,
	required: true,
};

const schema = new Schema({
	_id: reqString, // user.id

	name: reqString,
	avatar: {
		type: String,
		required: false,
		default: `https://cdn.discordapp.com/embed/avatars/${Math.floor(
			Math.random() * 5
		)}.png`,
	},
	created_at: {
		type: Date,
		required: true,
	},
	role: reqString,
});

const name = 'user';
export default mongoose.models[name] || mongoose.model(name, schema, name);
