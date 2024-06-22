module.exports = function errorHandler(err, req, res, next) {
  let error = err.message || 'Error Internal Server'
  let status = err.status || 500
  if (err.name && err.name.includes('Token')) {
    status = 401
    error = 'Unauthorized'
  }
  else if (err.name && err.name.includes("Validation")) {
    let temp = []
    let cekErr = err.errors
    for (let k in cekErr) {
      temp.push(cekErr[k].message)
    }
    status = 400
    error = temp
  }
  res.status(status).json({
    errMsg: error
  })
}
