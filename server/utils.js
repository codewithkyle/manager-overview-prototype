function buildSuccessResponse(data = null){
    return {
        success: true,
        data: data,
        error: null,
    };
}

function buildErrorResponse(error, data = null){
    return {
        success: false,
        data: data,
        error: error,
    };
}

function clone(object){
    return JSON.parse(JSON.stringify(object));
}

module.exports = { buildSuccessResponse, buildErrorResponse, clone };