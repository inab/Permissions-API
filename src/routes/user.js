import { version } from '../../package.json';
import { Router } from 'express';
import { getFilePermissions, generateVisaPayload, signVisa } from '../utils/utils';
import jwt_decode from "jwt-decode";

export default ({ config, db, keycloak }) => {
	let api = Router();

	api.get('/permissions', keycloak.protect(), async function(req, res){
		const userInfo = jwt_decode(req.headers.authorization)
		const allowedAccess = await getFilePermissions(userInfo.sub)
		// FORMAT: PLAIN  
		if(req.query.format === 'PLAIN' && allowedAccess.length > 0) return res.send(generateVisaPayload(userInfo.sub, allowedAccess, 'PLAIN'))
		// JTW (DEFAULT)
		else if(allowedAccess.length > 0) return res.send(await signVisa(generateVisaPayload(userInfo.sub, allowedAccess, 'JWT')));		

		res.send(allowedAccess)
	})

	return api;
}
