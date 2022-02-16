import jwt_decode from "jwt-decode";
import { validateBody, validateQuery, validateQueryAndFileIds } from '../models/user';
import getUsers from '../utils/getUsers';
import createError from 'http-errors';
import { Console } from "console";

export default async (req, res, next) => {   
    if(req.method === "GET") {
		// Validate with Joi.
		const { error } = validateQuery({ 	
			headerId : req.header('x-account-id'),
			paramsId : req.param('account-id'),
			paramsFormat : req.param('format')
		}) 
        // No account ID present on Header || Parameters.
		if(error) throw createError(400, "Bad request")
    } 
    if(req.method === "POST") {
		// Validate with Joi.
		let { error } = validateQuery({ 	
			headerId : req.header('x-account-id'),
			paramsId : req.param('account-id'),
			paramsFormat : req.param('format')
		}) 
        // No account ID present on Header || Parameters.
		if(error) throw createError(400, "Bad request")
        
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

        req.assertions = assertions;
    }
    if(req.method === "DELETE") {
        // Validate with Joi.
        const { error } = validateQueryAndFileIds({ 	
			headerId : req.header('x-account-id'),
			paramsId : req.param('account-id'),
			paramsFileIds : req.param('values')
		})
        // No account ID present on Header, Parameters OR Invalid File Ids (Error msg: To be improved).
		if(error) throw createError(400, "Bad request: No account-id present on headers or invalid file Ids")
    }
        
    // Select userId for checking if exists on Keycloak.
    let userId = req.header('x-account-id') ? req.header('x-account-id') : req.param('account-id')

    // Does this user exist in the Keycloak realm?
    const isValidUser = await getUsers(userId)

    // The current user does not exists on Keycloak.
    if(!isValidUser) throw createError(404, "User account invalid")

    req.userId = userId;

	next();
}