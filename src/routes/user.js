import { version } from '../../package.json';
import { Router } from 'express';
import { getFilePermissions, generateVisaPayload, signVisa } from '../utils/utils';
import jwt_decode from "jwt-decode";

export default ({ config, db, keycloak }) => {
	let api = Router();

	api.get('/permissions', keycloak.protect(), async function(req, res){
		const userInfo = jwt_decode(req.headers.authorization)
		const allowedAccess = await getFilePermissions(userInfo.sub)
		const visaPayload = generateVisaPayload(userInfo.sub, allowedAccess, req.query.format)	
		// FORMAT: PLAIN  
		if(req.query.format === 'PLAIN') return res.send(visaPayload)
		// JTW (DEFAULT)
		res.send(await signVisa(visaPayload));		
	})

	return api;
}
