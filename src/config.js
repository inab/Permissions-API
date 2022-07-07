var session = require('express-session');
var Keycloak = require('keycloak-connect');
require('dotenv').config();

var keycloakConfig = {
	"realm": "IPC",
	"auth-server-url": process.env.KEYCLOAK_URL,
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

// User: dac-admin Role I
const dacAdmSettings = {
    client_id: 'dac-portal',
    username: process.env.DAC_ADMIN_NAME,
    password: process.env.DAC_ADMIN_PASS,
    grant_type: 'password',
    realmName: 'IPC'
};

// User: dac-admin Role II
const dacAdmSettings_II = {
    client_id: 'dac-portal',
    username: process.env.DAC_ADMIN_NAME_II,
    password: process.env.DAC_ADMIN_PASS_II,
    grant_type: 'password',
    realmName: 'IPC'
};

// User: dac-member Role I
const dacMbrSettings = {
    client_id: 'dac-portal',
    username: process.env.DAC_MEMBER_NAME,
    password: process.env.DAC_MEMBER_PASS,
    grant_type: 'password',
    realmName: 'IPC'
};

// User: dac-member Role II
const dacMbrSettings_II = {
    client_id: 'dac-portal',
    username: process.env.DAC_MEMBER_NAME_II,
    password: process.env.DAC_MEMBER_PASS_II,
    grant_type: 'password',
    realmName: 'IPC'
};

// User: user Role
const usrSettings = {
    client_id: 'dac-portal',
    username: process.env.REGULAR_USER_NAME,
    password: process.env.REGULAR_USER_PASS,
    grant_type: 'password',
    realmName: 'IPC'
};

var serverConf = {
    "port": 8081,
    "bodyLimit": "100kb",
    "corsHeaders": ["Link"]
};

export {
    keycloak,
    sessionData,
    keycloakAdminCredentials,
    dacAdmSettings,
    dacAdmSettings_II,
    dacMbrSettings,
    dacMbrSettings_II,
    usrSettings,
    serverConf
};
