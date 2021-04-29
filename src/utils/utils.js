// IMPORT MONGOOSE MODELS.
import { UserFilesObject } from '../models/getFilesByUserId';

// FUNCTIONS: GET FILE PERMISSIONS BY USER ID

const getFilePermissions = async (id, status) => {
    const response = await UserFilesObject
                    .find({ 'userId' : id })
                    .and({ 'permissions.status' : status })
                    .select({ 'permissions.fileId.$' : 1, '_id' : 0});
    return response
} 

exports.getFilePermissions = getFilePermissions;