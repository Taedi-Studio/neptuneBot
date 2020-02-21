exports.discord = async (authData, code, oauthObj) => {
  let data = await oauthObj.tokenRequest({ ...authData, code: code[0] })
  let userData = await oauthObj.getUser(data.access_token)
  
  return {
    token: data.access_token,
    userData
  }
}
