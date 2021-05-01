const Discord = require('discord.js')
const { commands } = require('./config.json')
const client = new Discord.Client()
const dotenv = require('dotenv')
const fs = require('fs')
const DATABASE_FILE_NAME = "database/database.json"

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
  console.log('Ready!')
})

dotenv.config()
client.login(process.env.TOKEN)
client.on('message', (message) => {
  const messageContent = message.content
  
  if (isCommandMessage(messageContent)) {
    // DELETE USER MESSAGE
    message.delete()
      .then(msg => msg)
      .catch(console.error)

    // CREATE FILE
    if (messageContent.startsWith(commands.create)) {
      addFile(extractContent(messageContent, commands.create), message)
      
      // ADD NEW LINE
    } else if (messageContent.startsWith(commands.new)) {
      addNewLine(extractContent(messageContent, commands.new), message)

      // EDIT LINE
    } else if (messageContent.startsWith(commands.editLine)) {
      editLine(
        extractCommandArgument(messageContent, commands.editLine), 
        extractContentWithCommandArgument(messageContent, commands.editLine),
        message
      )
    }
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

const editLine = (lineNumber, newValue, messageObj) => fs.readFile(DATABASE_FILE_NAME, (err, data) => {
  const json = JSON.parse(data)
  json.files[json.active].lines[parseInt(lineNumber) - 1] = newValue

  fs.writeFile(DATABASE_FILE_NAME, JSON.stringify(json), (err, data) => {
    if (err) console.log(`Error: ${err}`)
    sendCode(json.active, json.files[json.active].lines, messageObj)
  })
})

// EXTRACT MESSAGE WITHOUT COMMAND
const extractContent = (messageContent, command) => messageContent.slice(command.length + 1)

// EXTRACT COMMAND ARGUMENT 
const extractCommandArgument = (messageContent, command) => messageContent.slice(command.length + 1).split("]")[0]

// EXTRACT MESSAGE WITH COMMAND ARGUMENT
const extractContentWithCommandArgument = (messageContent, command) => messageContent.slice(command.length + 1).split("]")[1].slice(1)

// SEND CODE TO CHANNEL
const sendCode = (fileName, lines, messageObj) => {
  const openingClosing = "```"
  const title = `// ${fileName}`
  let lineString = ""

  lineString += openingClosing
  lineString += title
  lineString += '\n'

  for (let i = 0; i < lines.length; i++) {
    lineString += `${i + 1} ${lines[i]}\n`
  }

  lineString += openingClosing
  messageObj.channel.send(lineString)
}

// Check if message starts with a command
const isCommandMessage = (message) => {
  for (let command in commands) {
    if (message.startsWith(commands[command])) {
      return true
    }
  }
  return false
}

