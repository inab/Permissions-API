import { UserPermissions } from '../../models/user';
import app from '../../index';
import request from 'supertest';
import tokenRequester from 'keycloak-request-token';
import { admSettings } from '../../config';

describe('Integration tests: Routes with Admin role', () => {

    let baseUrl;
    let admToken;
    let assertionsDoc = [{
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
                by: "dac" }];
    
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
    }

    beforeEach(async() => {
        baseUrl = 'https://inb.bsc.es/auth/';
        admToken = await tokenRequester(baseUrl, admSettings);
    });

    afterEach(async () => { 
        app.server.close();
        await UserPermissions.remove({});
    });

    describe('POST /permissions', () => {
        it('It should insert an array of assertions', async () => {
            const response = await request(app).post('/permissions')
                                               .query({ "account-id": '693be0a5-c215-480f-8105-3b3a7b16178e', 'format' : 'PLAIN' })
                                               .auth(admToken, { type: 'bearer' })
                                               .send(assertionsDoc)
        
            expect(response.status).toBe(207);
            expect(response.body.length).toBe(2);
            expect(response.body).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({ "sub": "693be0a5-c215-480f-8105-3b3a7b16178e"})
                ])
            );
        });
    })
    
    describe('GET /permissions:', () => {
        it('It should return ALL user assertions', async () => {
            await UserPermissions.collection.insert(visaDoc)

            const response = await request(app).get('/permissions')
                                               .query({ "account-id": '693be0a5-c215-480f-8105-3b3a7b16178e', 'format' : 'PLAIN' })
                                               .auth(admToken, { type: 'bearer' })

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
            expect(response.body.map(JSON.parse)).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({ "sub": "693be0a5-c215-480f-8105-3b3a7b16178e"})
                ])
            );
        })
    })

    describe('DELETE /permissions', () => {
        it('It should remove an array of assertions', async () => {
            await UserPermissions.collection.insert(visaDoc)
            const response = await request(app).delete('/permissions')
                                               .query({ 'account-id': '693be0a5-c215-480f-8105-3b3a7b16178e', 
                                                        'format' : 'PLAIN',
                                                        'values' : "https://test-url/TF001,https://test-url/TF002" })
                                               .auth(admToken, { type: 'bearer' })
        
            expect(response.status).toBe(207);
        });
    })
});

