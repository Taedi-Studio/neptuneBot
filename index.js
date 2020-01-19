const PORT = process.env.neptPort || 8080
const TOKEN = process.env.neptToken

const { writeFileSync } = require('fs')
const { renderFile } = require('ejs')
const cors = require('cors')
const path = require('path').resolve()
const express = require('express')
const { Client } = require('discord.js')
const superagent = require('superagent')
const DiscordOAuth2 = require('discord-oauth2')

const settings = require(path + '/settings.json')
const authData = require(path + '/auth/authData.json')

const authUrl = 'https://discordapp.com/api/oauth2/authorize?client_id=' + settings.clientId + '&redirect_uri=' + encodeURI(settings.redirectUri) + '&response_type=code&scope=' + settings.scope

const app = express()
const bot = new Client()

app.use(cors())
app.use('/src', express.static(path + '/src'))

app.get('/', (_req, res) => res.redirect('/login'))
app.get('/login', (req, res) => {
  renderFile(path + '/page/login.ejs', { key: req.query.key, authUrl, authData }, (err, str) => {
    if (err) console.log(err)
    else res.send(str)
  })
})

app.get('/solve', (_req, res) => res.send({ items: ['discord', 'google'] }))
app.get('/solve/:item', (req, res) => {
  const { item } = req.params
  let { code } = req.query
  code = code.split(';')

  if (!code) res.sendStatus(401)
  else {
    let oauth
    switch (item) {
      case 'discord':
        oauth = new DiscordOAuth2()
        oauth.tokenRequest({ ...settings, code: code[0] }).then((data) => {
          oauth.getUser(data.access_token).then((userData) => {
            authData[data.access_token] = { discord: userData, verfied: false }
            res.redirect('/login?key=' + data.access_token)
          })
        })
        break

      case 'google':
        oauth = superagent.get('https://oauth2.googleapis.com/tokeninfo?id_token=' + code[1], (err, data) => {
          if (err) res.sendStatus(401)
          else {
            if (!data.body.email_verified) res.sendStatus(401)
            else { authData[code[0]].google = data.body; authData[code[0]].verfied = true; res.redirect('https://discord.gg/mpAJ3wS') }
          }
        })
    }
  }
})

app.listen(PORT, () => {
  console.log('Neptune Bot is not running on http://localhost:' + PORT)
})

bot.login(TOKEN)
  .then(() => {
    setInterval(() => bot.guilds.get('667356618941530134').members.forEach((member) => {
      let verfied = false
      Object.keys(authData).forEach((key) => {
        if (member.id === authData[key].discord.id && authData[key].verfied) verfied = true
      })

      if (verfied && !member.roles.has('668384405643067422')) member.addRole('668384405643067422')
      if (!verfied && member.roles.has('668384405643067422')) member.removeRole('668384405643067422')
    }), 1000)
  })

setInterval(() => writeFileSync(path + '/auth/authData.json', JSON.stringify(authData)), 1000)
