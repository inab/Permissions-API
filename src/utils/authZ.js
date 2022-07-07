const getAuthZ = (userInfo) => {
    if(!userInfo["dac:roles"] && !userInfo["dac:members"]){
        return null;
    } else {
        const roles = userInfo["dac:roles"].filter(n => n)[0];
        const resources = [].concat.apply([], userInfo["dac:members"].filter(el => el !== null));
        return { "roles": roles, "resources": resources }
    }
}
const checkRole = (roles, query) => {
    return roles.map(el => el.includes(query)).includes(true)
}
const getResourcesMask = (dacResources, userResources) => {
    return userResources.map(element => dacResources.some(item => item.includes(element) === true));
}
const allowedResources = (assertions, mask) => {
    return assertions.filter((item, i) => mask[i]);
}

export { getAuthZ, getResourcesMask, checkRole, allowedResources }