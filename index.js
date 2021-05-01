const Discord = require('discord.js')
const { commands } = require('./config.json')
const client = new Discord.Client()
const dotenv = require('dotenv')
const fs = require('fs')
const DATABASE_FILE_NAME = "database.json"

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
  console.log('Ready!')
})

dotenv.config()
client.login(process.env.TOKEN)
client.on('message', (message) => {
  const messageContent = message.content

  // CREATE FILE
  if (messageContent.startsWith(commands.create)) {
    addFile(extractContent(messageContent, commands.create), message)
  
  // ADD NEW LINE
  } else if (messageContent.startsWith(commands.new)) {
    addNewLine(extractContent(messageContent, commands.new), message)
  }
})

// HANDLE CREATE FILE
const addFile = (fileName, messageObj) => fs.readFile(DATABASE_FILE_NAME, (err, data) => {
  const json = JSON.parse(data)
  json.files[fileName] = {
    lines: []
  }
  json.active = fileName

  fs.writeFile(DATABASE_FILE_NAME, JSON.stringify(json), (err, data) => {
    if (err) console.log(`Error: ${err}`)
    sendCode(json.active, json.files[json.active].lines, messageObj)
  })
})

// HANDLE ADD NEW LINE
const addNewLine = (newLine, messageObj) => fs.readFile(DATABASE_FILE_NAME, (err, data) => {
  const json = JSON.parse(data)
  json.files[json.active].lines.push(newLine)

  fs.writeFile(DATABASE_FILE_NAME, JSON.stringify(json), (err, data) => {
    if (err) console.log(`Error: ${err}`)
    sendCode(json.active, json.files[json.active].lines, messageObj)
  })
})

// EXTRACT MESSAGE WITHOUT COMMAND
const extractContent = (messageContent, command) => messageContent.slice(command.length + 1)

// SEND CODE TO CHANNEL
const sendCode = (fileName, lines, messageObj) => {
  const openingClosing = "```"
  const title = `// ${fileName}`
  let lineString = ""

  lineString += openingClosing
  lineString += title
  lineString += '\n'

  for (let i = 0; i < lines.length; i++) {
    lineString += `${i + 1} ${lines[0]}\n`
  }

  lineString += openingClosing
  messageObj.channel.send(lineString)
}