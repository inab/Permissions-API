import mongoose from 'mongoose';
import winston from 'winston';
require('dotenv').config();

export default callback => {
	let host = process.env.NODE_ENV === 'prod' ? process.env.MONGO_HOST : process.env.MONGO_HOST_TEST;	
	let db = process.env.MONGO_DB_PERMISSIONS;
	let username = process.env.MONGO_USER;
	let password = process.env.MONGO_PASS;
	let authSource = process.env.MONGO_AUTH;
        let uri = process.env.NODE_ENV === 'prod' ? `mongodb://${username}:${password}@${host}/${db}?authSource=${authSource}` :
            `mongodb://${username}:${password}@${host}/${db}?connectTimeoutMS=300000&replicaSet=rs0&authSource=${authSource}`
	const mongo = mongoose.connect(uri)
            .then(() => winston.info(`Connected to ${db}`))
	callback(mongo); 
}
