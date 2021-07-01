import { UserPermissions } from '../../models/user';
import app from '../../index';
import request from 'supertest';
import tokenRequester from 'keycloak-request-token';
import { usrSettings, admSettings } from '../../config';

describe('Integration tests: AuthN/Z', () => {

    let admToken;
    let usrToken;
    let baseUrl;
    let doc = [{ type : "ControlledAccessGrants",
                 asserted: 1564814387,
                 value: "https://test-url/TF008",
                 source: "https://test-url/source_dac_01",
                 by: "dac" }];

    const query = async (token) => {
        return await request(app).post("/permissions")
                                 .query({ "account-id": "693be0a5-c215-480f-8105-3b3a7b16178e", 'format' : 'PLAIN' })
                                 .auth(token, { type: 'bearer' })
                                 .send(doc)
    }

    beforeEach(async() => {
        baseUrl = 'https://inb.bsc.es/auth/';
        admToken = await tokenRequester(baseUrl, admSettings);
        usrToken = await tokenRequester(baseUrl, usrSettings);
    });

    afterEach(async () => { 
        app.server.close();
        await UserPermissions.remove({});
    });
    
    describe('POST /permissions: Test protected endpoint with different user roles', () => {
        it('User not Authenticated -> Keycloak redirect to login page (302 instead of 401) - Tokens comes from a Public client (Catalogue portal)', async () => {
            let token;
            const response = await query(token);
            expect(response.status).toBe(302);
        });

        it('User Authenticated AND NOT Authorized -> 403 error', async () => {
            const response = await query(usrToken);
            expect(response.status).toBe(403);
        });

        it('User Authenticated AND Authorized -> 207 (multistatus -> AuthN/Z it is OK)', async () => {
            const response = await query(admToken);
            expect(response.status).toBe(207);
        });
    })
});

