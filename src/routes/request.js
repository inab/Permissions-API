import { version } from '../../package.json';
import { Router } from 'express';
import { getRequest } from '../utils/utils';
import jwt_decode from "jwt-decode";

export default ({ config, db, keycloak }) => {
	let api = Router();

	api.get('/', keycloak.protect(), async function(req, res){
        const userInfo = jwt_decode(req.headers.authorization)
        const response = await getRequest(userInfo.sub);
		res.send(response)
	})

	return api;
}
