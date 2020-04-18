const { readFileSync, writeFileSync } = require('fs')
const { renderFile } = require('ejs')
const cors = require('cors')
const path = require('path').resolve()
const https = require('https')
const express = require('express')
const { Client } = require('discord.js')
const DiscordOAuth2 = require('discord-oauth2')

const authCheck = require('./auth')
// const pointModule = require('./modules/point')
const commandModule = require('./modules/command')

const settings = require(path + '/settings.json')
const authData = require(path + '/auth/authData.json')

if (!settings.features) settings.features = {}
if (settings.features.serverStatus == null) settings.features.serverStatus = true
if (settings.features.verifiedCheck == null) settings.features.verifiedCheck = true

const authUrl = 'https://discordapp.com/api/oauth2/authorize?client_id=' +
  settings.auth.clientId + '&redirect_uri=' +
  encodeURI(settings.auth.redirectUri) +
  '&response_type=code&scope=' + settings.auth.scope

const app = express()
const bot = new Client()

bot.settings = settings

let ssl
if (!settings.development) ssl = { cert: readFileSync(path + '/auth/teaddy-cert.pem'), key: readFileSync(path + '/auth/teaddy-key.pem') }

const discordOAuth = new DiscordOAuth2()

app.use(cors())
app.use('/src', express.static(path + '/src'))

app.get('/', (_req, res) => res.redirect('/login'))
app.get('/login', async (req, res) => {
  let key = req.query.key ? req.query.key.split(';') : []
  let discordData = {}
  try {
    discordData = await discordOAuth.getUser(key[0])
  } catch (err) {
    key = []
  }
  renderFile(path + '/page/login.ejs', { key, authUrl, authData, discordData }, (err, str) => {
    if (err) console.log(err)
    else res.send(str)
  })
})

app.get('/solve', (_req, res) => res.send({ items: ['discord', 'google'] }))
app.get('/solve/:item', (req, res) => {
  const { item } = req.params
  let code = req.query.code || ''

  code = code.split(';')

  if (code[0].length <= 0) res.redirect('/login')
  else {
    switch (item) {
      case 'discord':
        authCheck.discord(settings.auth, code, discordOAuth).then((returnData) => {
          authData[returnData.token] = { discord: returnData.userData, verified: false }
          res.redirect('/login?key=' + returnData.token)
        }).catch((err) => {
          console.error(err)
          res.sendStatus(500)
        })
        break

      case 'google':
        if (code.length !== 2) res.redirect('/login')
        if (!Object.keys(authData).includes(code[0])) res.redirect('/login')
        else {
          authCheck.google(code[1]).then((data) => {
            if (!data) res.sendStatus(401)
            else {
              authData[code[0]].google = data.body
              authData[code[0]].verified = false
              res.redirect('/login?key=' + code[0] + ';' + code[1])
            }
          }).catch(() => { res.sendStatus(401) })
        }
        break
      case 'submit':
        if (code.length !== 2) res.sendStatus(400)
        else if (!(authData[code[0]] && authData[code[0]].discord && authData[code[0]].google)) res.sendStatus(401)
        else {
          authData[code[0]].verified = true
          bot.channels.get(settings.channelId)
            .send('<@' + authData[code[0]].discord.id + '>님의 인증이 완료되었습니다.')
          res.redirect(settings.inviteUrl)
        }
        break
    }
  }
})

let server
if (settings.development) server = app
else server = https.createServer(ssl, app)
server.listen(settings.port, () => {
  console.log('Neptune Bot is not running on http://localhost:' + settings.port)
})

bot.login(settings.token)
  .then(() => {
    if (settings.features.verifiedCheck) {
      console.log('Verification Check Enabled.')
      setInterval(() => bot.guilds.get(settings.guildId).members.forEach((member) => {
        let verified = false
        Object.keys(authData).forEach((key) => {
          if (member.id === authData[key].discord.id && authData[key].verified) verified = true
        })

        if (verified && !member.roles.has(settings.roleId)) member.addRole(settings.roleId)
        if (!verified && member.roles.has(settings.roleId)) member.removeRole(settings.roleId)
      }), 1000)
    }

    if (settings.features.serverStatus) {
      console.log('Server Status display enabled.')
      setInterval(() => {
        let botCount = 0
        bot.guilds.get(settings.guildId).members.forEach((member) => { if (member.user.bot) botCount++ })
        bot.guilds.get(settings.guildId).channels.get(settings.statsChannel.all).setName('All: ' + bot.guilds.get(settings.guildId).members.size)
        bot.guilds.get(settings.guildId).channels.get(settings.statsChannel.humans).setName('Humans: ' + (bot.guilds.get(settings.guildId).members.size - botCount))
        bot.guilds.get(settings.guildId).channels.get(settings.statsChannel.bots).setName('Bots: ' + botCount)
      }, 1000)
    }
  })

setInterval(() => { writeFileSync(path + '/auth/authData.json', JSON.stringify(authData)) }, 1000)

// Register Events
bot.once('ready', () => {
  commandModule.init(bot)
})

bot.on('message', (msg) => {
  if (msg.author.bot || !msg.content) return
  if (msg.content.startsWith(settings.prefix || '!')) {
    // Commands
    commandModule.run(msg, bot)
  } else {
    // Chatting Point
  }
})
