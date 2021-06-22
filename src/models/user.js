import Joi from 'joi';
import mongoose from 'mongoose';
import { assertionsSchema } from './assertions';

const userPermissionsSchema = new mongoose.Schema({
    sub: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },
    assertions: [assertionsSchema],
}, { collection: 'userPermissions' });

const UserPermissions = mongoose.model('userPermissions', userPermissionsSchema);

function validateQuery(queryObject){
    const schema = Joi.object().keys({
        headerId: Joi.string().min(0).allow(null).default(null),
        paramsId: Joi.string().when('headerId', { is: null, then: Joi.required() }),
        paramsFormat:  Joi.string().allow(null).valid('PLAIN','JWT').optional()
    })
    
    return schema.validate(queryObject);
}

function validateBody(bodyObject){
    const schema = Joi.array().items(
        Joi.object().keys({
            type: Joi.string().valid('ControlledAccessGrants').required(),
            asserted: Joi.number().required(),
            value: Joi.string().regex(/^[-:.\/_+\w]+$/).required(),
            source: Joi.string().regex(/^[-:.\/_+\w]+$/).required(),
            by: Joi.string().valid('dac').required(),
            format: Joi.string().min(0).allow(null).default(null)
        })
    );
    
    return schema.validate(bodyObject);
}

// Extending Joi in order to deal with query params as comma separated values.
const JoiExtended = Joi.extend(joi => ({
    base: joi.array(),
    coerce: (value, helpers) => ({
      value: value.split ? value.split(',') : value,
    }),
    type: 'delimitedArray',
}))

function validateQueryAndFileIds(queryObject){
    const schema = Joi.object().keys({
        headerId: Joi.string().min(0).allow(null).default(null),
        paramsId: Joi.string().when('headerId', { is: null, then: Joi.required() }),
        paramsFileIds:  Joi.alternatives().try(
                            JoiExtended.delimitedArray().items(Joi.string().regex(/^[-:.\/_+\w]+$/)),
                            Joi.string().valid('all')
        ).required()
    })
    
    return schema.validate(queryObject);
}

exports.UserPermissions = UserPermissions;
exports.validateQuery = validateQuery;
exports.validateBody = validateBody;
exports.validateQueryAndFileIds = validateQueryAndFileIds;