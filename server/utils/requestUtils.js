function resultRequest(res, isSuccess, message, result, code) {
  const body = { isSuccess: isSuccess, message: message, result: result };
  if (code) body.code = code;
  return res.status(200).json(body);
}

module.exports = {
  resultRequest,
};
