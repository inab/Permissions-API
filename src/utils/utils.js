// IMPORT MONGOOSE MODELS.
import { UserPermissions } from '../models/user';
import { UserRequests } from '../models/request';
import jose from 'node-jose';
import fs from 'fs';

/* FUNCTIONS */

/* 1. MONGO DB: */

// 1.a. GET FILE PERMISSIONS BY USER ID

const getFilePermissions = async (id) => {
    const response = await UserPermissions.find({ 'sub' : id })
                                          .select({ 'assertions' : 1, '_id' : 0});

    return response
}

// 1.b. CREATE/UPDATE (UPSERT) FILE PERMISSIONS BY USER ID AND VALUE.

const createFilePermissions = async (id, obj) => {

    const user = await UserPermissions.updateOne(  { 'sub' : id },
                                { $setOnInsert: { "assertions" : obj } },
                                { new: true, upsert: true })                                       
    
    let response = await UserPermissions.findOneAndUpdate(
                                    { 'sub' : id, 'assertions.value' : obj.value },
                                    { $set : { "assertions.$" : obj } },
                                    { new: true });  
    if(!response) {
        response = await UserPermissions.findOneAndUpdate(
                    { 'sub' : id },
                    { $addToSet : { "assertions" : obj } },
                    { new: true });
    }

    return response
}

// 1.c. REMOVE FILE PERMISSIONS BY USER ID AND VALUE.

const removeFilePermissions = async (userId, fileId) => {

    let response = await UserPermissions.findOneAndUpdate(
                                    { 'sub' : userId, 'assertions.value' : fileId },
                                    { $pull : { 'assertions' : { 'value': fileId } } },
                                    { new: true }); 

    return response
}

/* 2. GENERATE VISA: */

// 2.a. GENERATE VISA PAYLOAD. 

const generateVisaPayload = (id, allowed, format) => {
    // Parse DB response
    const parsed = JSON.parse(JSON.stringify(allowed))[0].assertions
    // Build the payload
    
    // Dmitry: JSON-Object visas response instead of strings...
    // let payload = parsed.map(item => JSON.parse(JSON.stringify({
    
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
                                                                        //.update(JSON.stringify(item))
                                                                        .update(item)
                                                                        .final() ))
    return token
}

const getKeyStore = async () => {
    const ks = fs.readFileSync(__dirname + '/../keys.json')
    const keyStore = await jose.JWK.asKeyStore(ks.toString())
    return keyStore
}

// 3. GET USER REQUESTS.

const getRequest = async (id) => {
    const response = await UserRequests.find({ 'sub' : id })
                                       .select({ 'comments' : 1, '_id' : 0});

    return response
}

export { 
    getFilePermissions, 
    getRequest, 
    getKeyStore, 
    createFilePermissions, 
    removeFilePermissions, 
    generateVisaPayload, 
    signVisa 
}