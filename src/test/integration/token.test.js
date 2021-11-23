import app from '../../index';
import request from 'supertest';
import jose from 'node-jose';
import fs from 'fs';
import tokenRequester from 'keycloak-request-token';
import jwt from 'jsonwebtoken';
import jwktopem from 'jwk-to-pem';
import { usrSettings } from '../../config';
import { getKeyStore } from '../../utils/utils';
import { UserPermissions } from '../../models/user';

describe('Integration tests: Tokens', () => {

    afterAll(async () => { 
        app.server.close();
    });
    
    describe('Keycloak token generation tests', () => {
        it('Check if user can get an access token from Keycloak', async () => {
            
            let baseUrl = process.env.KEYCLOAK_URL;
            let response;
    
            await tokenRequester(baseUrl, usrSettings).then((token) => {
                    response = token;
                }).catch((err) => {
                    response = err;
            });
            
            expect(response.error).toBe(undefined);
        });
    });

    describe('JWT generation tests', () => {
        it('Check if JWT is generated properly -> Verify with the JWKS endpoint', async () => {
            
            const payload = JSON.stringify({
                username: "testuser",
                email: "testuser11235@liamg.moc(k)"
            })
            const keyStore = await getKeyStore()
            const [key] = keyStore.all({ use: 'sig' })
            const options = { compact: true, jwk: key, fields: { typ: 'jwt', 
                                                                 alg: key.alg,
                                                                 jku: 'https://dev-catalogue.ipc-project.bsc.es/permissions/api/jwks',
                                                                 kid: key.kid } }
                
            let token = await jose.JWS.createSign(options, key).update(payload).final()

            const response = await request(app).get('/jwks')

            expect(response.status).toBe(200);

            const [ testKey ] = response.body.keys
            const publicKey = jwktopem(testKey)
            const decoded = jwt.verify(token, publicKey)

            expect(decoded).toEqual({ username: "testuser", email: "testuser11235@liamg.moc(k)" });
        });
    });
});
