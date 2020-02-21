const { writeFileSync } = require('fs')
const { renderFile } = require('ejs')
const cors = require('cors')
const path = require('path').resolve()
const express = require('express')
const { Client } = require('discord.js')
const superagent = require('superagent')
const DiscordOAuth2 = require('discord-oauth2')

const authCheck = require('./auth')

const settings = require(path + '/settings.json')
const authData = require(path + '/auth/authData.json')

const authUrl = 'https://discordapp.com/api/oauth2/authorize?client_id=' +
  settings.auth.clientId + '&redirect_uri=' +
  encodeURI(settings.auth.redirectUri) +
  '&response_type=code&scope=' + settings.auth.scope

const app = express()
const bot = new Client()

const discordOAuth = new DiscordOAuth2()

app.use(cors())
app.use('/src', express.static(path + '/src'))

app.get('/', (_req, res) => res.redirect('/login'))
app.get('/login', async (req, res) => {
  let key = req.query.key
  let userData = {}
  try {
    userData = await discordOAuth.getUser(key)
  } catch(err) {
    key = null
  }
  renderFile(path + '/page/login.ejs', { key, authUrl, authData, userData, passedGoogleAuth: req.query.auth }, (err, str) => {
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
        authCheck.discord(settings.auth, code, discordOAuth)
          .then((returnData) => {
            authData[returnData.token] = { discord: returnData.userData, verfied: false }
            res.redirect('/login?key=' + returnData.token)
          })
          .catch((err) => {
            console.error(err)
            res.sendStatus(500)
          })
        break

      case 'google':
        if (!Object.keys(authData).includes(code[0])) res.sendStatus(401)
        else {
          oauth = superagent.get('https://oauth2.googleapis.com/tokeninfo?id_token=' + code[1], (err, data) => {
            if (err) res.sendStatus(401)
            else {
              if (!data.body.email_verified) res.sendStatus(401)
              else {
                authData[code[0]].google = data.body
                authData[code[0]].verfied = true
                bot.channels.get(settings.channelId)
                  .send('<@' + authData[code[0]].discord.id + '>님에 대한 인증이 완료되었습니다.')
                res.redirect(settings.inviteUrl)
              }
            }
          })
        }
    }
  }
})

app.listen(settings.port, () => {
  console.log('Neptune Bot is not running on http://localhost:' + settings.port)
})

bot.login(settings.token)
  .then(() => {
    setInterval(() => bot.guilds.get(settings.guildId).members.forEach((member) => {
      let verfied = false
      Object.keys(authData).forEach((key) => {
        if (member.id === authData[key].discord.id && authData[key].verfied) verfied = true
      })

      if (verfied && !member.roles.has(settings.roleId)) member.addRole(settings.roleId)
      if (!verfied && member.roles.has(settings.roleId)) member.removeRole(settings.roleId)
    }), 1000)

    setInterval(() => {
      let botCount = 0
      bot.guilds.get(settings.guildId).members.forEach((member) => { if (member.user.bot) botCount++ })
      bot.guilds.get(settings.guildId).channels.get(settings.statsChannel.all).setName('All: ' + bot.guilds.get(settings.guildId).members.size)
      bot.guilds.get(settings.guildId).channels.get(settings.statsChannel.humans).setName('Humans: ' + (bot.guilds.get(settings.guildId).members.size - botCount))
      bot.guilds.get(settings.guildId).channels.get(settings.statsChannel.bots).setName('Bots: ' + botCount)
    }, 1000)
  })

setInterval(() => writeFileSync(path + '/auth/authData.json', JSON.stringify(authData)), 1000)
