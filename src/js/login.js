/* global gapi */
/* eslint-disable no-unused-vars */

function onSignIn (googleUser) {
  if (getParameterByName('key')) window.location.replace('/solve/google?code=' + [getParameterByName('key'), googleUser.getAuthResponse().id_token].join(';'))
}

function getParameterByName (name, url) {
  if (!url) url = window.location.href
  name = name.replace(/[[\]]/g, '\\$&')
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
  const results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

function googleSignOut () {
  gapi.auth2.getAuthInstance().signOut()
  window.location.replace('/login?key=' + getParameterByName('key').split(';')[0])
}

function onGoogleLoad () {
  gapi.load('auth2', () => {
    gapi.auth2.init()
  })
}

function submit () {
  window.location.replace('/solve/submit?code=' + getParameterByName('key'))
}
