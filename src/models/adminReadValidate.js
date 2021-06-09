import Joi from 'joi';

function validateQuery(queryObject){
    const schema = Joi.object().keys({
        headerId: Joi.string().min(0).allow(null).default(null),
        paramsId: Joi.string().when('headerId', { is: null, then: Joi.required() }),
        paramsFormat: Joi.string().allow(null).valid('PLAIN','JWT').optional()
    })
    
    return schema.validate(queryObject);
}

exports.validateQuery = validateQuery;
