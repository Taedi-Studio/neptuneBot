const superagent = require('superagent')

exports.discord = async (authData, code, oauthObj) => {
  const data = await oauthObj.tokenRequest({ ...authData, code: code[0] })
  const userData = await oauthObj.getUser(data.access_token)

  return {
    token: data.access_token,
    userData
  }
}

exports.google = (token) => {
  return new Promise((resolve, reject) => {
    superagent.get('https://oauth2.googleapis.com/tokeninfo?id_token=' + token, (err, data) => {
      if (err) reject(err)
      else {
        if (!data.body.email_verified) reject(new Error('Email Not Verified'))
        else resolve(data)
      }
    })
  })
}
