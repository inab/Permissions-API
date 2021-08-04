var session = require('express-session');
var Keycloak = require('keycloak-connect');
require('dotenv').config();

var keycloakConfig = {
	"realm": "IPC",
	"auth-server-url": "https://inb.bsc.es/auth/",
	"ssl-required": "external",
    "resource": "permissions-api",
    "verify-token-audience": true,
	"public-client": true,
    "credentials": {
        "secret": process.env.KEYCLOAK_PERMISSIONS_CLIENT_SECRET
      },
    "use-resource-role-mappings": true,
    "confidential-port": 0,
    "policy-enforcer": {}
}

var memoryStore = new session.MemoryStore();
var keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

var sessionData = session({
    secret: Math.random().toString(36).substring(2, 15),
    resave: false,
    saveUninitialized: true,
    store: memoryStore
});

var keycloakAdminCredentials = {
    grantType: 'client_credentials',
    clientSecret: process.env.KEYCLOAK_ADMINCLI_SECRET,
    clientId: 'admin-cli'  
}


const baseUrl = 'https://inb.bsc.es/auth';

// User: AdminRole
const admSettings = {
    client_id: 'ipc-react-portal',
    username: process.env.PERMISSIONS_ADMIN_NAME,
    password: process.env.PERMISSIONS_ADMIN_PASS,
    grant_type: 'password',
    realmName: 'IPC'
};
// User: UserRole
const usrSettings = {
    client_id: 'ipc-react-portal',
    username: process.env.PERMISSIONS_USER_NAME,
    password: process.env.PERMISSIONS_USER_PASS,
    grant_type: 'password',
    realmName: 'IPC'
};

var serverConf = {
    "port": 8081,
    "bodyLimit": "100kb",
    "corsHeaders": ["Link"]
};

module.exports = {
    keycloak,
    sessionData,
    keycloakAdminCredentials,
    admSettings,
    usrSettings,
    serverConf
};
