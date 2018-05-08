var currentChainLength = 0;
var queryFullChain = JSON.stringify({'type': 2, 'data': null})
var connection;

window.onload = function() {
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    address = 'ws://localhost:6001';
  
    connection = new WebSocket(address);

    console.log(connection)
  
    connection.onopen = function () {
        console.log("We are live!")
        connection.send(queryFullChain)
    };
  
    connection.onerror = function (error) {
        console.log(error)
    };
  
    connection.onmessage = function (message) {
        var blocks = JsonToObject(message.data)
        if (blocks.data !== null) {
          handleData(blocks.data)
        }
    };
  }

  function mailSwitch() {
    var input = document.getElementById("command")
    if(input.type === "email") {
      input.type = "text";
      console.log("Off")
    } else {
      input.type = "email";
      console.log("On")
    }
  }

function sendCommand(e) {
  e.preventDefault();
  var command = document.getElementById("command").value;
  var fullName = document.getElementById("name").value;
  var commands = command.split(": ");
  appendToTerminal("<<< " + command);
  if (commands.length === 1) {
    commands.unshift("mineblock");
    commands[1] += " | " + fullName; 
  }
  axios.post('/' + commands[0], {
    data: commands[1]
  })
  .then(function (response) {
    buildResponseMessage(commands, response);
  })
  .catch(function (error) {
    appendToTerminal(">>> an error occurred: " + error)
  });
}

function buildResponseMessage(commands, response){
  
  if(commands[0].toLowerCase() === "mineblock") {
    appendToTerminal(">>> " + response.data.hash);
  } else if(commands[0].toLowerCase() === "addpeer") {
    setTimeout( function() {
    axios.get("/peers")
    .then(function (response) {
      var msg = response.data.includes(commands[1]) ? "Node was added" : "Node was NOT added";
      appendToTerminal(">>> " + msg);
    }).catch(function (error) {
      appendToTerminal(">>> an error occurred when getting a list of connected nodes " + error);
    })
  },1000);
  }
}

function appendToTerminal(text) {
  var terminal = document.getElementById("terminal-out")
  var line = document.createElement("p")
  line.innerHTML = text;
  terminal.appendChild(line);
}

  const clearFeed = function() {
    var feed = document.getElementById('blocks')
    while (feed.firstChild) {
      feed.removeChild(feed.firstChild);
    }
  }
  const newBlockCausesAGap = function(blocksObj) {
    var highestBlockIndex = blocksObj[0].index;
    return highestBlockIndex > currentChainLength + 1;
  }

  const isSingleBlock = function(blocks) {
    return blocks.length === 1;
  }

  const handleData = function(blocks) {
    var blocksObj = JsonToObject(blocks);
    if(newBlockCausesAGap(blocksObj)) {
      connection.send(queryFullChain)
    }
    else if(isSingleBlock(blocksObj)) {
      addMultipleToFeed(blocksObj)
    } else {
      clearFeed();
      addMultipleToFeed(blocksObj);
    }
  }

  const addMultipleToFeed = function(blocks) {
    for(var i = 0; i < blocks.length; i ++) {
      addToFeed(blocks[i])
    }
    currentChainLength = blocks[blocks.length -1].index
  }

  const buildBlockDiv = function(block) {
    var blockDiv = document.createElement("div");
    blockDiv.className = "block";

    blockDiv.appendChild(document.createElement('pre')).innerHTML = syntaxHighlight(JSON.stringify(block, null, 4))
    return blockDiv;
  }

  const addToFeed = function(block) {
    var feed = document.getElementById('blocks');
    var blockDiv = buildBlockDiv(block);
    feed.insertBefore(blockDiv, feed.firstChild);
  }

  const JsonToObject = function(json) {
    try {
      var object = JSON.parse(json);
      return object;
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ',
          json);
      return;
    }
  }

  function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
  }