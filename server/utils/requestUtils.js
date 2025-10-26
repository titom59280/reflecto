function resultRequest(res, isSuccess, message, result) {
    return res.status(200).json({ isSuccess: isSuccess, message: message, result: result });
}

module.exports = {
    resultRequest
};