import mongoose from 'mongoose';
import Joi from 'joi';
    
const userFilesSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    }
  }, { collection: 'userPermissions' }
);

const UserFilesObject = mongoose.model('UserFilesObject', userFilesSchema);

exports.userFilesSchema = userFilesSchema;
exports.UserFilesObject = UserFilesObject;  