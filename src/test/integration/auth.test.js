import { UserPermissions } from '../../models/user';
import app from '../../index';
import request from 'supertest';
import tokenRequester from 'keycloak-request-token';
import { usrSettings, dacAdmSettings, dacAdmSettings_II, dacMbrSettings } from '../../config';

describe('Integration tests: AuthN/Z', () => {

    let dacAdmToken;
    let dacAdmToken_II;
    let dacMbrToken;
    let usrToken;
    let baseUrl;
    let doc = [{ type : "ControlledAccessGrants",
                 asserted: 1564814387,
                 value: "https://test-url/TF003",
                 source: "https://test-url/source_dac_03",
                 by: "dac" }];

    const postRequest = async (token) => {
        return await request(app).post("/permissions")
                                 .query({ "account-id": "42a55fa0-18e9-482b-8619-3d7caa757ac9", 'format' : 'PLAIN' })
                                 .auth(token, { type: 'bearer' })
                                 .send(doc)
    }

    const getRequest = async (token) => {
        return await request(app).get("/permissions")
                                 .query({ "account-id": "42a55fa0-18e9-482b-8619-3d7caa757ac9", 'format' : 'PLAIN' })
                                 .auth(token, { type: 'bearer' })
    }

    const deleteRequest = async (token) => {
        return await request(app).delete('/permissions')
                                 .query({ 'account-id': "42a55fa0-18e9-482b-8619-3d7caa757ac9", 'format' : 'PLAIN', 'values' : 'https://test-url/TF003' })
                                 .auth(token, { type: 'bearer' }) 
    }        

    beforeEach(async() => {
        baseUrl = process.env.KEYCLOAK_URL;
        dacAdmToken = await tokenRequester(baseUrl, dacAdmSettings);
        dacAdmToken_II = await tokenRequester(baseUrl, dacAdmSettings_II);
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
            // Then, we try to get that document with unauthorized users (user).
            response = await getRequest(usrToken);
            expect(response.status).toBe(403);
        });
        it('User Authenticated AND NOT Authorized - DAC-ADMIN (RBAC) not controlling this resource (ABAC) -> 403 error', async () => {
            // First we add a document in the DB with an authorized user (dac-admin).
            let response = await postRequest(dacAdmToken);
            expect(response.status).toBe(207);
            // Then, we try to get that document with unauthorized users (user).
            response = await getRequest(dacAdmToken_II);
            expect(response.status).toBe(403);
        });
        it('User Authenticated AND Authorized - DAC-ADMIN & DAC-MEMBER (RBAC) controlling this resource (ABAC) -> 200', async () => {
            // First we add a document in the DB with an authorized user (dac-admin).
            let response = await postRequest(dacAdmToken);
            expect(response.status).toBe(207);
            // Then, we try to get that document with unauthorized users (user).
            response = await getRequest(usrToken);
            expect(response.status).toBe(403);
            // Finally, we get the document with a valid user (dac-admin || dac-member role)
            response = await getRequest(dacAdmToken);
            expect(response.status).toBe(200);
            response = await getRequest(dacMbrToken);
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

        it('User Authenticated AND Authorized - DAC-ADMIN (RBAC) controlling this resource (ABAC) -> 207 (multistatus -> AuthN/Z it is OK)', async () => {
            const response = await postRequest(dacAdmToken);
            expect(response.status).toBe(207);
        });
        it('User Authenticated AND Authorized - DAC-MEMBER (RBAC) controlling this resource (ABAC) -> 207 (multistatus -> AuthN/Z it is OK)', async () => {
            const response = await postRequest(dacMbrToken);
            expect(response.status).toBe(207);
        });
    })

    describe('DELETE /permissions: Test protected endpoint with different user roles', () => {
        it('User Authenticated AND NOT Authorized - DAC-MEMBER (RBAC) role controlling this resource (ABAC) NOT allowed to delete permissions  -> 403 error', async () => {
            let response = await postRequest(dacAdmToken);
            expect(response.status).toBe(207);
            response = await deleteRequest(dacMbrToken);
            expect(response.status).toBe(403);
        });

        it('User Authenticated AND NOT Authorized - DAC-ADMIN (RBAC) NOT controlling this resource (ABAC) NOT allowed to delete permissions -> 207 (multistatus -> AuthN/Z it is OK)', async () => {
            let response = await postRequest(dacAdmToken);
            expect(response.status).toBe(207);
            response = await deleteRequest(dacAdmToken_II);
            expect(response.status).toBe(403);
        });
        it('User Authenticated AND Authorized - DAC-ADMIN (RBAC) controlling this resource (ABAC) IS allowed to delete this permission -> 207 (multistatus -> AuthN/Z it is OK)', async () => {
            let response = await postRequest(dacAdmToken);
            expect(response.status).toBe(207);
            response = await deleteRequest(dacAdmToken);
            expect(response.status).toBe(200);
        });
    })
});

