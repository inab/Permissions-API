import { version } from '../../package.json';
import { Router } from 'express';
import { getFilePermissions, createFilePermissions, generateVisaPayload, signVisa } from '../utils/utils';
import { validateBody, validateQuery } from '../models/user';
import getUsers from '../utils/getUsers';
import createError from 'http-errors';

export default ({ config, db, keycloak }) => {
	let api = Router();

	api.get('/', keycloak.protect('admin'), async function(req, res){
		// Check both x-account-id & account-id. At least one of them must exist.

		// Validate with Joi.
		const { error } = validateQuery({ 	
			headerId : req.header('x-account-id'),
			paramsId : req.param('account-id'),
			paramsFormat : req.param('format')
		})

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

	
	api.post('/', keycloak.protect('admin'), async function(req, res){
		// Check both x-account-id & account-id. At least one of them must exist.

		// Validate with Joi.
		const { error } = validateQuery({ 	
			headerId : req.header('x-account-id'),
			paramsId : req.param('account-id'),
			paramsFormat : req.param('format')
		})

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

		if(!req.query.format === 'PLAIN') {
			// Decode tokens and build an assertions array. Then validate assertions.
		} else {
			// Validate the assertions array (PLAIN: req.body)
			const { error } = validateBody(req.body)

			if(error) throw createError(400, "Bad request")
			
		}

		const response = await Promise.all(
			req.body.map(async (item) => await createFilePermissions(isValidUser.id, item))
		)

		res.status(207);
		res.send(response);	
	})

	return api;
}
