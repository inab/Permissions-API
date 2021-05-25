// IMPORT MONGOOSE MODELS.
import { UserFilesObject } from '../models/getFilesByUserId';
import jose from 'node-jose';
import fs from 'fs';

/* FUNCTIONS */

/* 1. MONGO DB: */

// 1.a. GET FILE PERMISSIONS BY USER ID

const getFilePermissions = async (id, status) => {
    const response = await UserFilesObject
                    .find({ 'sub' : id })
                    .select({ 'assertions' : 1, '_id' : 0});
    return response
}

/* 2. GENERATE VISA: */

// 2.a. GENERATE VISA PAYLOAD. 

const generateVisaPayload = (id, allowed) => {

    const parsed = JSON.parse(JSON.stringify(allowed))[0].assertions

    // A. Build a JWT payload.
    const payload = JSON.stringify({
        iss: 'https://dev-catalogue.ipc-project.bsc.es/permissions/api/',
        sub: id,
        ga4gh_visa_v1: [ {
            type : parsed[0].type,
            value: parsed[0].value,
            source: parsed[0].source,
            by: parsed[0].by,
            asserted: parsed[0].asserted
        } ],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 3600000) / 1000)
    })

    return payload
}

// 2.b. SIGN VISA (JTW WITH GA4GH_VISA_V1 CLAIM -> ASSERTIONS). 

const signVisa = async (payload) => {
    // A. Read keystore file (RSA, RS256).
    const keys = fs.readFileSync(__dirname + '/../keys.json')
    const keyStore = await jose.JWK.asKeyStore(keys.toString())
    // B. Filter keys by use == 'sig'
    const [key] = keyStore.all({ use: 'sig' })
    const options = { compact: true, jwk: key, fields: { typ: 'jwt', 
                                                         alg: key.alg,
                                                         jku: 'https://dev-catalogue.ipc-project.bsc.es/permissions/api/jwks',
                                                         kid: key.kid } }
    // C. Generate a signed JWT (visas)
    const token = await jose.JWS.createSign(options, key)
        .update(payload)
        .final()

    return token
}

exports.getFilePermissions = getFilePermissions;
exports.generateVisaPayload = generateVisaPayload;
exports.signVisa = signVisa;