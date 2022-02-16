import { UserPermissions } from '../../models/user';
import app from '../../index';
import request from 'supertest';
import tokenRequester from 'keycloak-request-token';
import { dacAdmSettings } from '../../config';

describe('Integration tests: Routes with Admin role', () => {

    let baseUrl;
    let admToken;
    let validId = "fa111014-1635-4708-b262-e8f6913d4bdb";
    let invalidId = "invalidTestId";

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
        sub: "fa111014-1635-4708-b262-e8f6913d4bdb",
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
        baseUrl = process.env.KEYCLOAK_URL;
        admToken = await tokenRequester(baseUrl, dacAdmSettings);
    });

    afterEach(async () => { 
        app.server.close();
        await UserPermissions.remove({});
    });

    const queryBuilder = async (token, option, format, paramsId, headerId, paramsFileIds) => {
        switch (option) {
            case 0:
                return await request(app).post("/permissions")
                                         .query({ "account-id": paramsId, 'format' : format })
                                         .auth(admToken, { type: 'bearer' })
                                         .send(assertionsDoc)               
            case 1: 
                return await request(app).get("/permissions")
                                         .query({ "account-id": paramsId, 'format' : format })
                                         .auth(admToken, { type: 'bearer' })                     
            case 2:
                return await request(app).get('/permissions')
                                         .query({ 'format' : format })
                                         .set('x-account-id', headerId)
                                         .auth(admToken, { type: 'bearer' })           
            case 3:
                return await request(app).delete('/permissions')
                                         .query({ 'account-id': paramsId, 'format' : format, 'values' : paramsFileIds })
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
            
            let response = await queryBuilder(admToken, 1, 'PLAIN', invalidId)

            expect(response.status).toBe(404);

            response = await queryBuilder(admToken, 2, 'PLAIN', undefined, invalidId)

            expect(response.status).toBe(404);
        })

        it('It should return ALL user assertions if account-id and format params are valid', async () => {
            await UserPermissions.collection.insert(visaDoc)

            const response = await queryBuilder(admToken, 1, 'PLAIN', validId, undefined)

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body.map(JSON.parse)).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({ "sub": validId })
                ])
            );
        })

        it('It should return 200 if header param x-account-id is specified AND valid', async () => {
            await UserPermissions.collection.insert(visaDoc)

            const response = await queryBuilder(admToken, 2, 'PLAIN', undefined, validId)

            expect(response.status).toBe(200);
        })

        it('It should return 200 if format parameter is JWT, PLAIN or null (JWT: default)', async () => {
            await UserPermissions.collection.insert(visaDoc)
            
            let response = await queryBuilder(admToken, 1, undefined, validId)

            expect(response.body).toHaveLength(2);       
            expect(response.status).toBe(200); 

            response = await queryBuilder(admToken, 1, 'JWT', validId)

            expect(response.body).toHaveLength(2);
            expect(response.status).toBe(200);

            response = await queryBuilder(admToken, 1, 'PLAIN', validId)
            
            expect(response.body).toHaveLength(2);
            expect(response.status).toBe(200);
        });

    });
    
    describe('DELETE /permissions', () => {
        it('It should return 400 error if an invalid fileId is supplied: ', async () => {
            await UserPermissions.collection.insert(visaDoc)
 
            const response = await queryBuilder(admToken, 3, 'PLAIN', validId, undefined, "invalidUri")

            expect(response.status).toBe(400);
        });
        
        it('It should return 204 error if the fileId is valid AND NOT assigned to the specified user: ', async () => {
            await UserPermissions.collection.insert(visaDoc)
 
            const response = await queryBuilder(admToken, 3, 'PLAIN', validId, undefined, "https://test-url/TF003")
            
            expect(response.status).toBe(204);
        });
        
        it('It should remove a single assertion', async () => {
            await UserPermissions.collection.insert(visaDoc)

            let response = await queryBuilder(admToken, 3, 'PLAIN', validId, undefined, "https://test-url/TF001")
            
            expect(response.status).toBe(200);
        });

        it('It should remove an assertion array as comma separated values', async () => {
            await UserPermissions.collection.insert(visaDoc)

            let response = await queryBuilder(admToken, 3, 'PLAIN', validId, undefined, "https://test-url/TF001,https://test-url/TF002")

            expect(response.status).toBe(200);
        });

        it('It should remove an assertion array as comma separated values when some valid AND NOT assigned fileIds are specified ', async () => {
            await UserPermissions.collection.insert(visaDoc)

            let response = await queryBuilder(admToken, 3, 'PLAIN', validId, undefined, "https://test-url/TF001,https://test-url/TF0010,https://test-url/TF002,https://test-url/TF050")

            expect(response.status).toBe(200);
        });
    });
    // *** (it should detect if any of the array elements are not assigned to its DAC)
    describe('POST /permissions', () => {
        it('It should insert an array of assertions if format and account-id are valid', async () => {
            const response = await queryBuilder(admToken, 0, 'PLAIN', validId)
            expect(response.status).toBe(207);
            expect(response.body).toHaveLength(2);
            expect(response.body).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({ "sub": validId })
                ])
            );
        });
    });
});

