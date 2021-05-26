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

const generateVisaPayload = (id, allowed, format) => {
    // Parse DB response
    const parsed = JSON.parse(JSON.stringify(allowed))[0].assertions
    // Build the payload
    let payload = parsed.map(item => JSON.stringify({
        iss: 'https://dev-catalogue.ipc-project.bsc.es/permissions/api/',
        sub: id,
        ga4gh_visa_v1: {
            type : item.type,
            value: item.value,
            source: item.source,
            by: item.by,
            asserted: item.asserted
        },
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 3600000) / 1000),
        format: format
    }))

    return payload
}

// 2.b. SIGN VISA (JTW WITH GA4GH_VISA_V1 CLAIM -> ASSERTIONS). 

const signVisa = async (payload) => {
    // A. Read keystore file (RSA, RS256).
    const keyStore = await getKeyStore()
    // B. Filter keys by use == 'sig'
    const [key] = keyStore.all({ use: 'sig' })
    const options = { compact: true, jwk: key, fields: { typ: 'jwt', 
                                                         alg: key.alg,
                                                         jku: 'https://dev-catalogue.ipc-project.bsc.es/permissions/api/jwks',
                                                         kid: key.kid } }
    

    // C. Generate signed JWT (visas)
    let token = await Promise.all(payload.map(async (item) =>   jose.JWS.createSign(options, key)
                                                                        .update(item)
                                                                        .final() ))
    return token
}

const getKeyStore = async () => {
    const ks = fs.readFileSync(__dirname + '/../keys.json')
    const keyStore = await jose.JWK.asKeyStore(ks.toString())
    return keyStore
}

exports.getFilePermissions = getFilePermissions;
exports.generateVisaPayload = generateVisaPayload;
exports.signVisa = signVisa;
exports.getKeyStore = getKeyStore;