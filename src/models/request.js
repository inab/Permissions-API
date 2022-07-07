import Joi from 'joi';
import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    sub: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },
    comments: [{
        fileId: {
            type: String,
            required: true
        },
        comment: {
            type: String,
            required: true
        }
    }], 
}, { collection: 'userRequests' });

const UserRequests = mongoose.model('userRequests', requestSchema);

export { UserRequests }