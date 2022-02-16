import jwt_decode from "jwt-decode";
import { getAuthZ, getResourcesMask, checkRole, allowedResources } from '../utils/authZ';
import { getFilePermissions } from '../utils/utils';
import createError from 'http-errors';

export default async (req, res, next) => {
	// A. RBAC: Check if the user has a DAC-role.
	// Decode JWT (dacInfo)
	const dacInfo = jwt_decode(req.headers.authorization);
	// Get DAC scopes.
	const dacScopes = getAuthZ(dacInfo);
	// User that does not belong to any DAC.
	if(!dacScopes) throw createError(403, "Forbidden");
	// Check if user has the dac-admin role (delete).
	const isDacAdmin = checkRole(dacScopes.roles, "dac-admin");

	// B. ABAC: Check if the DAC has access to the resources.
	let userPermissions, 
		userResources,
		userAssertions, 
		requestedResources,
		requestedAssertions, 
		controlledResourcesByDAC = [];

	if(req.method === "GET") {
		userPermissions = await getFilePermissions(req.userId);
		if(userPermissions.length > 0) {
			userResources = userPermissions[0].assertions.map(element => element.value);
			userAssertions = userPermissions[0].assertions.map(element => element);
			controlledResourcesByDAC = allowedResources(userAssertions, getResourcesMask(dacScopes.resources, userResources));
			if(controlledResourcesByDAC.length === 0 && userResources.length !== 0) throw createError(403, "Forbidden");
		}
	}
	if(req.method === "POST") {
		requestedResources = req.assertions.map(element => element.value);
		requestedAssertions = req.assertions.map(element => element);
		controlledResourcesByDAC = allowedResources(requestedAssertions, getResourcesMask(dacScopes.resources, requestedResources));
		if(controlledResourcesByDAC.length === 0) throw createError(403, "Forbidden");
	}
	if(req.method === "DELETE") {
		requestedResources = req.param('values').split(',');
		controlledResourcesByDAC = allowedResources(requestedResources, getResourcesMask(dacScopes.resources, requestedResources));
		if(controlledResourcesByDAC.length === 0 || !isDacAdmin) throw createError(403, "Forbidden");
	}

	req.controlledResourcesByDAC = controlledResourcesByDAC;

	next();
}