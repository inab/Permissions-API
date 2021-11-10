import { UserPermissions } from '../../models/user';
import app from '../../index';
import request from 'supertest';
import tokenRequester from 'keycloak-request-token';
import { usrSettings, dacAdmSettings, dacMbrSettings } from '../../config';

describe('Integration tests: AuthN/Z', () => {

    let dacAdmToken;
    let dacMbrToken;
    let usrToken;
    let baseUrl;
    let doc = [{ type : "ControlledAccessGrants",
                 asserted: 1564814387,
                 value: "https://test-url/TF008",
                 source: "https://test-url/source_dac_01",
                 by: "dac" }];

    const postRequest = async (token) => {
        return await request(app).post("/permissions")
                                 .query({ "account-id": "693be0a5-c215-480f-8105-3b3a7b16178e", 'format' : 'PLAIN' })
                                 .auth(token, { type: 'bearer' })
                                 .send(doc)
    }

    const getRequest = async (token) => {
        return await request(app).get("/permissions")
                                 .query({ "account-id": "693be0a5-c215-480f-8105-3b3a7b16178e", 'format' : 'PLAIN' })
                                 .auth(token, { type: 'bearer' })
    }

    beforeEach(async() => {
        baseUrl = 'https://inb.bsc.es/auth/';
        dacAdmToken = await tokenRequester(baseUrl, dacAdmSettings);
        dacMbrToken = await tokenRequester(baseUrl, dacMbrSettings);
        usrToken = await tokenRequester(baseUrl, usrSettings);
    });

    afterEach(async () => { 
        app.server.close();
        await UserPermissions.remove({});
    });

    describe('GET /permissions: Test protected endpoint with different user roles', () => {
        it('User not Authenticated -> Keycloak redirect to login page (302 instead of 401) - Tokens comes from a Public client (Catalogue portal)', async () => {
            let token;
            const response = await getRequest(token);
            expect(response.status).toBe(302);
        });
        it('User Authenticated AND NOT Authorized -> 403 error', async () => {
            // First we add a document in the DB with an authorized user (dac-admin).
            let response = await postRequest(dacAdmToken);
            expect(response.status).toBe(207);
            // Then, we try to get that document with unauthorized users (user, dac-member).
            response = await getRequest(usrToken);
            expect(response.status).toBe(403);
            response = await getRequest(dacMbrToken);
            expect(response.status).toBe(403);
        });
        it('User Authenticated AND Authorized -> 200', async () => {
            // First we add a document in the DB with an authorized user (dac-admin).
            let response = await postRequest(dacAdmToken);
            expect(response.status).toBe(207);
            // Then, we try to get that document with unauthorized users (user, dac-member).
            response = await getRequest(usrToken);
            expect(response.status).toBe(403);
            response = await getRequest(dacMbrToken);
            expect(response.status).toBe(403);
            // Finally, we get the document with a valid user (dac-admin role)
            response = await getRequest(dacAdmToken);
            expect(response.status).toBe(200);
        });
    })
    
    describe('POST /permissions: Test protected endpoint with different user roles', () => {
        it('User not Authenticated -> Keycloak redirect to login page (302 instead of 401) - Tokens comes from a Public client (Catalogue portal)', async () => {
            let token;
            const response = await postRequest(token);
            expect(response.status).toBe(302);
        });

        it('User Authenticated AND NOT Authorized -> 403 error', async () => {
            const response = await postRequest(usrToken);
            expect(response.status).toBe(403);
        });

        it('User Authenticated AND Authorized (dac-admin -> is-dac)-> 207 (multistatus -> AuthN/Z it is OK)', async () => {
            const response = await postRequest(dacAdmToken);
            expect(response.status).toBe(207);
        });
        it('User Authenticated AND Authorized (dac-member -> is-dac)-> 207 (multistatus -> AuthN/Z it is OK)', async () => {
            const response = await postRequest(dacMbrToken);
            expect(response.status).toBe(207);
        });
    })
});

