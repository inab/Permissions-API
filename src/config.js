var session = require('express-session');
var Keycloak = require('keycloak-connect');

var keycloakConfig = {
	"realm": "IPC",
	"auth-server-url": "https://inb.bsc.es/auth/",
	"ssl-required": "external",
    "resource": "permissions-api",
    "verify-token-audience": true,
	"public-client": true,
    "credentials": {
        "secret": "my secret"
      },
    "use-resource-role-mappings": true,
    "confidential-port": 0,
    "policy-enforcer": {}
}

var memoryStore = new session.MemoryStore();
var keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

var sessionData = session({
    secret:'session_secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
});

module.exports = {
    keycloak,
    sessionData
};