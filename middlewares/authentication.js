const jwt = require('jsonwebtoken')
const User = require("../models/User")
module.exports = async (req, res, next) => {
  try {
    let { access_token } = req.headers
    if (!access_token) throw { name: "Token" }
    let { id } = jwt.verify(access_token, process.env.SECRET_JWT)
    let result = await User.findOne({ _id: id })
    if (!result) throw { status: 403, message: "Forbidden" }
    req.user = { id }
    next()
  } catch (error) {
    next(error)
  }
}