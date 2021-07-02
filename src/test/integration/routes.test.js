import { UserPermissions } from '../../models/user';
import app from '../../index';
import request from 'supertest';
import tokenRequester from 'keycloak-request-token';
import { admSettings } from '../../config';

describe('Integration tests: Routes with Admin role', () => {

    let baseUrl;
    let admToken;
    let validAdminId = "693be0a5-c215-480f-8105-3b3a7b16178e";
    let invalidAdminId = "invalidTestId";

    let assertionsDoc = [
        {
            type : "ControlledAccessGrants",
            asserted: 1564814387,
            value: "https://test-url/TF001",
            source: "https://test-url/source_dac_01",
            by: "dac"
        },
        {
            type : "ControlledAccessGrants",
            asserted: 1564810000,
            value: "https://test-url/TF002",
            source: "https://test-url/source_dac_02",
            by: "dac" 
        }
    ];
    
    let visaDoc = {
        sub: "693be0a5-c215-480f-8105-3b3a7b16178e",
        assertions: [
            {
                type : "ControlledAccessGrants",
                asserted: 1564814387,
                value: "https://test-url/TF001",
                source: "https://test-url/source_dac_01",
                by: "dac"
            },
            {
                type : "ControlledAccessGrants",
                asserted: 1564810000,
                value: "https://test-url/TF002",
                source: "https://test-url/source_dac_02",
                by: "dac"
            }
        ]
    };

    beforeEach(async() => {
        baseUrl = 'https://inb.bsc.es/auth/';
        admToken = await tokenRequester(baseUrl, admSettings);
    });

    afterEach(async () => { 
        app.server.close();
        await UserPermissions.remove({});
    });

    const queryBuilder = async (token, option, format, paramsAdmId, headerAdmId, paramsFileIds) => {
        switch (option) {
            case 0:
                return await request(app).post("/permissions")
                                         .query({ "account-id": paramsAdmId, 'format' : format })
                                         .auth(admToken, { type: 'bearer' })
                                         .send(assertionsDoc)               
            case 1: 
                return await request(app).get("/permissions")
                                         .query({ "account-id": paramsAdmId, 'format' : format })
                                         .auth(admToken, { type: 'bearer' })                     
            case 2:
                return await request(app).get('/permissions')
                                         .query({ 'format' : format })
                                         .set('x-account-id', headerAdmId)
                                         .auth(admToken, { type: 'bearer' })           
            case 3:
                return await request(app).delete('/permissions')
                                         .query({ 'account-id': paramsAdmId, 'format' : format, 'values' : paramsFileIds })
                                         .auth(admToken, { type: 'bearer' })                           
        }
    }

    describe('GET /permissions:', () => {
        it('It should return 400 error if format parameter is different from JWT, PLAIN, null (JWT: default)', async () => {
            await UserPermissions.collection.insert(visaDoc)

            const response = await queryBuilder(admToken, 1, 'invalidformat')
            
            expect(response.status).toBe(400);
        });

        it('It should return 400 error if account-id or x-account-id is not specified', async () => {
            await UserPermissions.collection.insert(visaDoc)

            const response = await queryBuilder(admToken, 1, 'PLAIN')

            expect(response.status).toBe(400);
        })

        it('It should return 404 error if account-id OR x-account-id is specified AND invalid', async () => {
            await UserPermissions.collection.insert(visaDoc)
            
            let response = await queryBuilder(admToken, 1, 'PLAIN', invalidAdminId)

            expect(response.status).toBe(404);

            response = await queryBuilder(admToken, 2, 'PLAIN', undefined, invalidAdminId)

            expect(response.status).toBe(404);
        })

        it('It should return ALL user assertions if account-id and format params are valid', async () => {
            await UserPermissions.collection.insert(visaDoc)

            const response = await queryBuilder(admToken, 1, 'PLAIN', validAdminId, undefined)

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body.map(JSON.parse)).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({ "sub": validAdminId})
                ])
            );
        })

        it('It should return 200 if header param x-account-id is specified AND valid', async () => {
            await UserPermissions.collection.insert(visaDoc)

            const response = await queryBuilder(admToken, 2, 'PLAIN', undefined, validAdminId)

            expect(response.status).toBe(200);
        })

        it('It should return 200 if format parameter is JWT, PLAIN or null (JWT: default)', async () => {
            await UserPermissions.collection.insert(visaDoc)
            
            let response = await queryBuilder(admToken, 1, undefined, validAdminId)

            expect(response.body).toHaveLength(2);       
            expect(response.status).toBe(200); 

            response = await queryBuilder(admToken, 1, 'JWT', validAdminId)

            expect(response.body).toHaveLength(2);
            expect(response.status).toBe(200);

            response = await queryBuilder(admToken, 1, 'PLAIN', validAdminId)
            
            expect(response.body).toHaveLength(2);
            expect(response.status).toBe(200);
        });

    });

    describe('DELETE /permissions', () => {
        it('It should return 400 error if an invalid fileId is supplied: ', async () => {
            await UserPermissions.collection.insert(visaDoc)
 
            const response = await queryBuilder(admToken, 3, 'PLAIN', validAdminId, undefined, "invalidUri")

            expect(response.status).toBe(400);
        });
        
        it('It should return 204 error if the fileId is valid AND NOT assigned to the specified user: ', async () => {
            await UserPermissions.collection.insert(visaDoc)
 
            const response = await queryBuilder(admToken, 3, 'PLAIN', validAdminId, undefined, "https://test-url/TF099")
            
            expect(response.status).toBe(204);
        });
        
        it('It should remove a single assertion', async () => {
            await UserPermissions.collection.insert(visaDoc)

            let response = await queryBuilder(admToken, 3, 'PLAIN', validAdminId, undefined, "https://test-url/TF001")
            
            expect(response.status).toBe(200);
        });

        it('It should remove an assertion array as comma separated values', async () => {
            await UserPermissions.collection.insert(visaDoc)

            let response = await queryBuilder(admToken, 3, 'PLAIN', validAdminId, undefined, "https://test-url/TF001,https://test-url/TF002")

            expect(response.status).toBe(200);
        });

        it('It should remove an assertion array as comma separated values when some valid AND NOT assigned fileIds are specified ', async () => {
            await UserPermissions.collection.insert(visaDoc)

            let response = await queryBuilder(admToken, 3, 'PLAIN', validAdminId, undefined, "https://test-url/TF001,https://test-url/TF0010,https://test-url/TF002,https://test-url/TF050")

            expect(response.status).toBe(200);
        });
    });

    describe('POST /permissions', () => {
        it('It should insert an array of assertions if format and account-id are valid', async () => {
            const response = await queryBuilder(admToken, 0, 'PLAIN', validAdminId)
            expect(response.status).toBe(207);
            expect(response.body).toHaveLength(2);
            expect(response.body).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({ "sub": validAdminId})
                ])
            );
        });
    });
});

