/* eslint-disable no-unused-vars */
function onSignIn (googleUser) {
  window.location.replace('/solve/google?code=' + [getParameterByName('key'), googleUser.getAuthResponse().id_token].join(';'))
}

function getParameterByName(name, url) {
  if (!url) url = window.location.href
  name = name.replace(/[\[\]]/g, '\\$&')
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
  const results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}
