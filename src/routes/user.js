import { version } from '../../package.json';
import { Router } from 'express';
import { getFilePermissions } from '../utils/utils';
import jwt_decode from "jwt-decode";

export default ({ config, db, keycloak }) => {
	let api = Router();

	api.get('/requests', keycloak.protect(), async function(req, res){
		const userInfo = jwt_decode(req.headers.authorization)
		const pendingAccess = await getFilePermissions(userInfo.sub, "Pending")
		res.send(pendingAccess);
	});

	api.get('/documents', keycloak.protect(), async function(req, res){
		const userInfo = jwt_decode(req.headers.authorization)
		const allowedAccess = await getFilePermissions(userInfo.sub, "Accepted")
		res.send(allowedAccess);
	});

	return api;
}
