import mongoose from 'mongoose';

export default callback => {
	// connect to MongoDB, then pass it to the callback fn:
	const mongo = mongoose.connect('mongodb://user:pwd@localhost:27017/permissions_api?authSource=authdb')
		.then(() => console.log("Connected to MongoDB"))
		.catch((err) => console.log("Could not connect to MongoDB", err));
	callback(mongo); 
}
