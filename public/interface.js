window.onload = function() {
    var feed = document.getElementById('log');

    console.log("Live")
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;
  
    var connection = new WebSocket('ws://127.0.0.1:6001');

    console.log(connection)
  
    connection.onopen = function () {
        console.log("We are live!")
        connection.send(JSON.stringify({'type': 2, 'data': null}))
    };
  
    connection.onerror = function (error) {
        console.log(error)
    };
  
    connection.onmessage = function (message) {
        console.log("Incomming msg data" + message.data)
        var object = JsonToObject(message.data)
        handleData(object)
    };

    const handleData = function(data) {
      if(JsonToObject(data.data).length > 1) {
        while (feed.firstChild) {
          feed.removeChild(feed.firstChild);
        }
      }
      for(var i = 0; i < JsonToObject(data.data).length; i ++) {
        addToFeed(JsonToObject(data.data)[i].data)
      }
      /*Check if it is contains genesis block
      if(JsonToObject(data.data)[0].index === 0) {
        while (feed.firstChild) {
          feed.removeChild(feed.firstChild);
        }
        console.log(data)
      } else {
        addToFeed(JsonToObject(data.data)[0].data);
      }*/
    }

    const addToFeed = function(parsedData) {
      var ptest = document.createElement("p");
      ptest.innerHTML = parsedData;
      feed.appendChild(ptest);
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
  }