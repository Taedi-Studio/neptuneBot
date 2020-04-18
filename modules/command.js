const fs = require('fs')
const path = require('path')

exports.init = (client) => {
  const commandPath = path.join(path.resolve(), 'commands')
  if (!fs.existsSync(commandPath) || !fs.lstatSync(commandPath).isDirectory()) throw new Error('commands folder not found')

  const commands = new Map()
  const aliases = new Map()

  const files = fs.readdirSync(commandPath)
  files.forEach((file) => {
    if (!file.endsWith('.js')) return
    const cmd = require(path.join(commandPath, file))
    commands.set(cmd.name, cmd)
    aliases.set(cmd.name, cmd.name)
    cmd.aliases.forEach((alias) => { aliases.set(alias, cmd.name) })
  })

  client.commands = { commands, aliases }
}

exports.run = (msg, client) => {
  const query = msg.content.split(client.settings.prefix || '!')[1]
  const args = query.split(' ')
  const cmd = args[0]
  args.shift()

  if (!client.commands.aliases.has(cmd)) return
  try {
    client.commands.commands.get(client.commands.aliases.get(cmd)).run(msg)
  } catch (err) {
    console.error(err)
  }
}
