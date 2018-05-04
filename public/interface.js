function sendCommand(e) {
  e.preventDefault();
  var command = document.getElementById("command").value;
  appendToTerminal("<<< " + command);
  var commands = command.split(" ");
  axios.post('/' + commands[0], {
    data: commands[1]
  })
  .then(function (response) {
    buildResponseMessage(commands, response);
    //appendToTerminal(msg)
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

var currentChainLength = 0;

window.onload = function() {
    var feed = document.getElementById('blocks');
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    address = 'ws://localhost:6001';
  
    var connection = new WebSocket(address);

    console.log(connection)
  
    connection.onopen = function () {
        console.log("We are live!")
        connection.send(JSON.stringify({'type': 2, 'data': null}))
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

    const clearFeed = function() {
      while (feed.firstChild) {
        feed.removeChild(feed.firstChild);
      }
    }

    const newBlockCausesAGap = function(blocksObj) {
      var highestBlockIndex = blocksObj[blocksObj.length -1].index;
      return highestBlockIndex + 1 > currentChainLength;
    }

    const handleData = function(blocks) {
      var blocksObj = JsonToObject(blocks);
      if(blocksObj.length > 1) {
        clearFeed();
      }
      //console.log(blocksObj[blocksObj.length -1].index+1 > currentChainLength)
      if(newBlockCausesAGap(blocksObj)) {
        axios.get("/blocks")
        .then(function (response) {
          clearFeed()
          addMultipleToFeed(response.data)
        }).catch(function (error) {
          alert("Please reload your browser" + error);
        })
      } else {
        console.log("Adding single block")
        addMultipleToFeed(blocksObj);
      }    
    }

    const addMultipleToFeed = function(blocks) {
      for(var i = 0; i < blocks.length; i ++) {
        addToFeed(blocks[i])
      }
      currentChainLength = blocks[blocks.length -1].index
      console.log(currentChainLength)
    }

    const buildBlockDiv = function(block) {
      var blockDiv = document.createElement("div");
      blockDiv.className = "block";

      blockDiv.appendChild(document.createElement('pre')).innerHTML = syntaxHighlight(JSON.stringify(block, null, 4))
      return blockDiv;
    }

    const addToFeed = function(block) {
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
  }