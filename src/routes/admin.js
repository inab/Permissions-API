import { Router } from 'express';
import { createFilePermissions, removeFilePermissions, generateVisaPayload, signVisa } from '../utils/utils';
import resource from '../middleware/authZ';
import request from '../middleware/request';
import createError from 'http-errors';

export default ({ config, db, keycloak }) => {
	let api = Router();

	api.get('/', [keycloak.protect(), request, resource], async function(req, res){
		// FORMAT: PLAIN	 
		if(req.query.format === 'PLAIN' && req.controlledResourcesByDAC.length > 0) return res.send(generateVisaPayload(req.userId, [{ 'assertions' : req.controlledResourcesByDAC }], 'PLAIN'));
		// FORMAT: JWT
		else if(req.controlledResourcesByDAC.length > 0) res.send(await signVisa(generateVisaPayload(req.userId, [{ 'assertions' : req.controlledResourcesByDAC }], 'JWT')));	
		res.send(req.controlledResourcesByDAC)
	})
	api.post('/', [keycloak.protect(), request, resource], async function(req, res){
		const response = await Promise.all(
			req.controlledResourcesByDAC.map(async (item) => await createFilePermissions(req.userId, item))
		)
		res.status(207); 
		res.send(response);	
	})
	api.delete('/', [keycloak.protect(), request, resource], async function(req, res){
		let response = await Promise.all(
			req.controlledResourcesByDAC.map(async (item) => await removeFilePermissions(req.userId, item))
		) 
		if(!response[0] && response.length === 1) throw createError(204, "No record has been deleted")

		const nonEmpty = response.filter(el => el !== null);
		const lastItem = nonEmpty.pop();

		res.status(200);
		res.send(lastItem);	
	})

	return api;
}
