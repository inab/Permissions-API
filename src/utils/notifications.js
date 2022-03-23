const getAddedDatasetsIds = (visas) => {
    return visas.map(el => el.value)
}

const buildMessage = (source, userId, userEmail, method, dataset) => {
    return {
        source: source,
        userId: userId,
        userEmail: userEmail,
        method: method,
        dataset: dataset
    }
}

export { getAddedDatasetsIds, buildMessage };