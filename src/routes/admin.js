import { version } from '../../package.json';
import { Router } from 'express';

export default ({ config, db, keycloak }) => {
	let api = Router();

	api.put('/user-requests', keycloak.protect('admin'), (req, res) => {
		res.send("Hi there");
		// Apply new permissions for an specific user and files on Permissions API.
		// Apply new permissions for an specific user and files on Nextcloud Data Storage.
	});

	return api;
}
