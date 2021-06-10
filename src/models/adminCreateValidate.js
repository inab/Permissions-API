import Joi from 'joi';

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

exports.validateBody = validateBody;