import { version } from '../../package.json';
import { Router } from 'express';
import { getFilePermissions, generateVisaPayload, signVisa } from '../utils/utils';
import { validateQuery } from '../models/adminReadValidate';
import getUsers from '../utils/getUsers';
import createError from 'http-errors';

export default ({ config, db, keycloak }) => {
	let api = Router();

	api.get('/', keycloak.protect(), async function(req, res){
		// Check both x-account-id & account-id. At least one of them must exist.
		let queryObject = {
			headerId : req.header('x-account-id'),
			paramsId : req.param('account-id')
		}
		// Validate with Joi.
		const { error } = validateQuery(queryObject)

		// No account ID present on Header || Parameters.
		if(error) throw createError(400, "Bad request")

		// Select userId for checking if exists on Keycloak.
		let userId = req.header('x-account-id') ? req.header('x-account-id') : req.param('account-id')

		// Getting the user list from Keycloak for the iPC realm.
		const usersList = await getUsers()

		// Filter user list by ID.
		const isValidUser = usersList.find(user => user.id == userId);

		// The current user does not exists on Keycloak.
		if(!isValidUser){
			throw createError(404, "User account invalid")
		}

		// Response: Get Visa array (JWT, PLAIN).
		const allowedAccess = await getFilePermissions(isValidUser.id)	 
		if(req.query.format === 'PLAIN') return res.send(generateVisaPayload(isValidUser.id, allowedAccess, 'PLAIN'));
		res.send(await signVisa(generateVisaPayload(isValidUser.id, allowedAccess, 'JWT')));	
	})

	return api;
}
