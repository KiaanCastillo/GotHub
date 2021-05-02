const Discord = require('discord.js')
const { commands } = require('./config.json')
const client = new Discord.Client()
const dotenv = require('dotenv')
const fs = require('fs')

let history = [];



const DATABASE_FILE_NAME = "database/database.json"
const LINE_SEPARATOR = "--------------------------------------------"
const COMMAND_DEFINITIONS = {
  "create": "[create]: Creates a new file and sets it as the active file",
  "new": "[new]: Adds a new line to the active file",
  "editLine": "[edit `line number`] `value`: Edits an existing line and replaces it with the new value",
  "deleteLine": "[delete] `line number`: Deletes a line number",
  "export": "[export] `extension`: Exports the file into the desired extension (e.g. js, cpp, css, java)",
  "activate": "[activate] `file name`: Sets the activate file",
  "uwu": "[uwuify]: Sets da file into a cute vewsion",
  "insert": "[insert `line number`] `value`: Inserts a new line at the specified line number with the specified value",
  "files": "[files]: Lists the names of the files created",
  "drop": "[drop] `file name`: Drops the specified file",
  "commands": "[commands]: Lists the commands available"
}

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', function () {
  console.log('Ready!')
})

dotenv.config()
client.login(process.env.TOKEN)
client.on('message', function (message) {
  const messageContent = message.content
  
  if (isCommandMessage(messageContent)) {
    // DELETE USER MESSAGE
    message.delete()
      .then(function (msg) { return msg })
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
      
      // DELETE LINE
    } else if (messageContent.startsWith(commands.deleteLine)) {
      deleteLine(extractContent(messageContent, commands.deleteLine), message)
      
      //ACTIVATE
    } else if (messageContent.startsWith(commands.activate)) {
      activate(extractContent(messageContent, commands.activate), message)
      
      // EXPORT 
    } else if (messageContent.startsWith(commands.export)) {
      exportActiveFile(extractContent(messageContent, commands.export), message)
      
      // INSERT
    } else if (messageContent.startsWith(commands.insert)) {
      insert(
        extractCommandArgument(messageContent, commands.insert), 
        extractContentWithCommandArgument(messageContent, commands.insert),
        message
      )

      // UWUIFY
    } else if (messageContent.startsWith(commands.uwu)) {
      uwu(extractContent(messageContent, commands.uwu), message)
      
      // FILES
    } else if (messageContent.startsWith(commands.files)) {
      listFiles(message)

      // DROP
    } else if (messageContent.startsWith(commands.drop)) {
      dropFile(extractContent(messageContent, commands.drop), message)

      // COMMANDS
    } else if (messageContent.startsWith(commands.commands)) {
      listCommands(message)
    } else if (messageContent.startsWith(commands.history)) {
      printHistory(message);
    } 
  }
})
// Handle ADDING OLD DATABASES TO HISTORY
function addToHistory(changes){
  history.push(changes)
}

function printHistory(messageObj){

    let historyList = "";
    for (let i = 0; i < history.length; i++){
      historyList += history[i]
    }
    messageObj.channel.send("History of Project Changes:" + '\n' + historyList + '\n')
  
}

// Handle CREATE FILE
function addFile (fileName, messageObj) {
  fs.readFile(DATABASE_FILE_NAME, function (err, data) {
    const json = JSON.parse(data)
    json.files[fileName] = {
      lines: []
    }
    json.active = fileName

    updateDatabase(json, messageObj)

  })
  let changes = "**" + messageObj.author.username + "**" + " created and changed active file to: " + "`" + fileName + "`" + '\n'
  messageObj.channel.send(LINE_SEPERATOR + 'n' + changes + LINE_SEPARATOR)
  addToHistory(changes);
  messageObj.channel.bulkDelete(100); // clear chat after delete
}

// Handle ADD NEW LINE
function addNewLine (newLine, messageObj) {
  fs.readFile(DATABASE_FILE_NAME, function (err, data) {
    const json = JSON.parse(data)
    json.files[json.active].lines.push(newLine)
    updateDatabase(json, messageObj)
  }) 
  const currentMessage = extractContent(messageObj.content, commands.new)
  let changes = "**" + messageObj.author.username + "**" + " created a new line and changed content to " + "`" + currentMessage + "`" + '\n'
  messageObj.channel.send(LINE_SEPERATOR + 'n' + changes + LINE_SEPARATOR)
  addToHistory(changes)
  messageObj.channel.bulkDelete(100); // clear chat after delete
}

// Handle EDIT LINE
function editLine (lineNumber, newValue, messageObj) {
  fs.readFile(DATABASE_FILE_NAME, function (err, data) {
    const json = JSON.parse(data)
    const oldValue = json.files[json.active].lines[parseInt(lineNumber) - 1]
    json.files[json.active].lines[parseInt(lineNumber) - 1] = newValue

    updateDatabase(json, messageObj)
    let changes = "**" + messageObj.author.username + "**" + " edited Line " + lineNumber  + " from " + "`" + oldValue +  "`" + " to " + "`" + newValue + "`" + '\n'
    messageObj.channel.send(LINE_SEPERATOR + 'n' + changes + LINE_SEPARATOR)
    addToHistory(changes)
    messageObj.channel.bulkDelete(100); // clear chat after delete
  })
}

// Handle DELETE LINE
function deleteLine (lineNumber, messageObj) {
  fs.readFile(DATABASE_FILE_NAME, function (err, data) {
    const json = JSON.parse(data)
    const currentMessage = json.files[json.active].lines[parseInt(lineNumber) - 1]
    json.files[json.active].lines.splice(parseInt(lineNumber) - 1, 1)
    updateDatabase(json, messageObj)
    let changes = "**" + messageObj.author.username + "**" + " deleted Line " + lineNumber +  " " + "`" + currentMessage + "`" + '\n'
    messageObj.channel.send(LINE_SEPERATOR + 'n' + changes + LINE_SEPARATOR)
    addToHistory(changes)
    messageObj.channel.bulkDelete(100); // clear chat after delete
  })
}

// Handle ACTIVATE
function activate (fileName, messageObj) {
  fs.readFile(DATABASE_FILE_NAME, function (err, data) {
    const json = JSON.parse(data)
    json.active = fileName

    updateDatabase(json, messageObj)
})
  let changes = "Changed active file to: " + "`" + fileName + "`" + '\n'
  messageObj.channel.send(LINE_SEPERATOR + 'n' + changes + LINE_SEPARATOR)
  addToHistory(changes)
  messageObj.channel.bulkDelete(100); // clear chat after delete
}

// Handle EXPORT 
function exportActiveFile (extension, messageObj) {
  fs.readFile(DATABASE_FILE_NAME, function (err, data) {
    const json = JSON.parse(data)
    const fileName = `${json.active}.${extension}`
    const newFile = fs.writeFileSync(fileName, json.files[json.active].lines.join("\n"))
    messageObj.channel.send(`--------------------------------------------\nExporting: ${fileName}\n--------------------------------------------
    `, {
      files: [fileName]
    })
  })
}

// Handle INSERT
function insert (lineNumber, newValue, messageObj) {
  fs.readFile(DATABASE_FILE_NAME, function (err, data) {
    const json = JSON.parse(data)
    const lines = json.files[json.active].lines
    lineNumber = parseInt(lineNumber)

    json.files[json.active].lines = [...lines.slice(0, lineNumber - 1), newValue, ...lines.slice(lineNumber - 1)]

    updateDatabase(json, messageObj)
    messageObj.channel.send("--------------------------------------------" + '\n' + "**" + messageObj.author.username + "**" + " inserted into line " + lineNumber + " `" + newValue +  "`" + '\n' + "--------------------------------------------" + '\n')
    messageObj.channel.bulkDelete(100); // clear chat after delete
  })
}

// Handle UWU
function uwu (extension, messageObj) {
  fs.readFile(DATABASE_FILE_NAME, function (err, data) {
    const json = JSON.parse(data)
    
    for (var i = 0; i < json.files[json.active].lines.length; i++) {
      json.files[json.active].lines[i] = json.files[json.active].lines[i].replace(/l/g,'w');
      json.files[json.active].lines[i] = json.files[json.active].lines[i].replace(/r/g,'w');
      json.files[json.active].lines[i] = json.files[json.active].lines[i].replace(/the/g,'da');
    }

    updateDatabase(json, messageObj)
  })
  messageObj.channel.send("someone uwuified")
  messageObj.channel.bulkDelete(100); // clear chat after delete
}
  
// Handle LIST FILES
function listFiles (messageObj) {
  fs.readFile(DATABASE_FILE_NAME, function (err, data) {
    const json = JSON.parse(data)
    const fileNames = Object.keys(json.files)
    const numFiles = fileNames.length
    const suffix = numFiles === 1 ? "file" : "files"
    const label = `**There ${numFiles === 1 ? "is" : "are"} ${numFiles} ${suffix} available:**`
    let filesListString = ""

    for (let file of fileNames) {
      filesListString += `- ${file}\n`
    }

    messageObj.channel.send(`${LINE_SEPARATOR}\n${label}\n${filesListString}${LINE_SEPARATOR}`)
  })
}

function dropFile (fileName, messageObj) {
  fs.readFile(DATABASE_FILE_NAME, function (err, data) {
    const json = JSON.parse(data)
    const label = `**${messageObj.author.username}** dropped file \`${fileName}\``
    delete json.files[fileName]

    fs.writeFile(DATABASE_FILE_NAME, JSON.stringify(json), function (err, data) {
      if (err) console.log(`Error: ${err}`)
    })

    messageObj.channel.send(`${LINE_SEPARATOR}\n${label}\n${LINE_SEPARATOR}`)
  })
}

function listCommands (messageObj) {
  const label = "**GotHub Command List**"
  let commandsListString = ""

  for (let command of Object.values(COMMAND_DEFINITIONS)) {
    commandsListString += `- ${command}\n`
  }

  messageObj.channel.send(`${LINE_SEPARATOR}\n${label}\n${commandsListString}${LINE_SEPARATOR}`)
}

// Extract message content
function extractContent (messageContent, command) { return messageContent.slice(command.length + 1) }

// Extract command argument
function extractCommandArgument (messageContent, command) { return messageContent.slice(command.length + 1).split("]")[0] }

// Extract message content with command argument
function extractContentWithCommandArgument (messageContent, command) { 
  return messageContent.slice(command.length + 1).split("]")[1].slice(1) 
}

// Send code to channel
function sendCode (fileName, lines, messageObj) {
  const openingClosing = "```"
  const title = `// ${fileName}`
  let lineString = ""

  lineString += openingClosing
  lineString += title
  lineString += '\n'

  for (let i = 0; i < lines.length; i++) {
    lineString += `${(i + 1)}| ${lines[i]}\n`
  }

  lineString += openingClosing
  messageObj.channel.send(lineString)
}

// Check if message starts with a command
function isCommandMessage (message) {
  for (let command in commands) {
    if (message.startsWith(commands[command])) {
      return true
    }
  }
  return false
}

// Update database with new JSON
function updateDatabase (json, messageObj) {
  fs.writeFile(DATABASE_FILE_NAME, JSON.stringify(json), function (err, data) {
    if (err) console.log(`Error: ${err}`)
    sendCode(json.active, json.files[json.active].lines, messageObj)
  })
}
