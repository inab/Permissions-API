import { version } from '../../package.json';
import { Router } from 'express';
import { getFilePermissions, createFilePermissions, removeFilePermissions, generateVisaPayload, signVisa } from '../utils/utils';
import { validateBody, validateQuery, validateQueryAndFileIds } from '../models/user';
import getUsers from '../utils/getUsers';
import createError from 'http-errors';
import jwt_decode from 'jwt-decode';

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
		if(!isValidUser) throw createError(404, "User account invalid")

		// Response: Get Visa array (JWT, PLAIN).
		const allowedAccess = await getFilePermissions(isValidUser.id)	 
		if(req.query.format === 'PLAIN') return res.send(generateVisaPayload(isValidUser.id, allowedAccess, 'PLAIN'));
		res.send(await signVisa(generateVisaPayload(isValidUser.id, allowedAccess, 'JWT')));	
	})

	api.post('/', keycloak.protect('admin'), async function(req, res){
		// Check both x-account-id & account-id. At least one of them must exist.

		// Validate with Joi.
		let { error } = validateQuery({ 	
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
		if(!isValidUser) throw createError(404, "User account invalid")

		let assertions = req.body;

		// FORMAT JWT: Decode tokens and build an assertions array. 
		if(req.query.format !== 'PLAIN') {
			assertions = req.body.map(item => {
				const { type, asserted, value, source, by } = jwt_decode(item.jwt)
				const subset = { type, asserted, value, source, by }
				return subset
			})
		}

		// Validate the assertions array.
		({ error } = validateBody(assertions))
		if(error) throw createError(400, "Bad request")

		const response = await Promise.all(
			assertions.map(async (item) => await createFilePermissions(isValidUser.id, item))
		)

		res.status(207);
		res.send(response);	
	})

	api.delete('/', keycloak.protect('admin'), async function(req, res){
		// Check both x-account-id & account-id. At least one of them must exist.

		const { error } = validateQueryAndFileIds({ 	
			headerId : req.header('x-account-id'),
			paramsId : req.param('account-id'),
			paramsFileIds : req.param('values')
		})

		// No account ID present on Header, Parameters OR Invalid File Ids (Error msg: To be improved).
		if(error) throw createError(400, "Bad request: No account-id present on headers or invalid file Ids")

		// Select userId for checking if exists on Keycloak.
		let userId = req.header('x-account-id') ? req.header('x-account-id') : req.param('account-id')

		// Getting the user list from Keycloak for the iPC realm.
		const usersList = await getUsers()

		// Filter user list by ID.
		const isValidUser = usersList.find(user => user.id == userId);

		// The current user does not exists on Keycloak.
		if(!isValidUser) throw createError(404, "User account invalid")

		let response = await Promise.all(
			req.param('values').split(',').map(async (item) => await removeFilePermissions(isValidUser.id, item))
		)

		if(!response[0] && response.length === 1) throw createError(204, "No record has been deleted")

		const nonEmpty = response.filter(el => el !== null);
		const lastItem = nonEmpty.pop();

		res.status(200);
		res.send(lastItem);	
	})

	return api;
}
