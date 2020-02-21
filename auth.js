const superagent = require('superagent')

exports.discord = async (authData, code, oauthObj) => {
  let data = await oauthObj.tokenRequest({ ...authData, code: code[0] })
  let userData = await oauthObj.getUser(data.access_token)
  
  return {
    token: data.access_token,
    userData
  }
}

exports.google = (token) => {
  return new Promise((r, j) => {
    superagent.get('https://oauth2.googleapis.com/tokeninfo?id_token=' + token, (err, data) => {
      if (err) j()
      else {
        if (!data.body.email_verified) j()
        else r(data)
      }
    })
  })
}
