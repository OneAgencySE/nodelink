const WebSocket = require('ws');
const {addBlockToChain, Block, getBlockchain, getLatestBlock, isValidBlockStructure, replaceChain} = require('./chain');
const {Enum} = require('enumify');

const sockets = [];
const getSockets = () => sockets

const MessageType = Object.freeze({"QUERY_LATEST":1, "QUERY_ALL":2, "RESPONSE_BLOCKCHAIN":3})

const initPeerServer = (peerPort) => {
    const server = new WebSocket.Server({port: peerPort});
    server.on('connection', (ws) => {
        initConnection(ws)
    })
    console.log("Listening for network peers on port: " + peerPort)
}

const initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
}

const JsonToObject = (json) => {
    try {
        return JSON.parse(json);
    } catch (e) {
        console.log("Json could not be parsed... Message: \n" + e)
        return null;
    }
}

const initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        const message = JsonToObject(data);
        if (message === null) {
            return;
        }
        console.log("Message received and parsed to Json: \n" + message.type);
        switch(message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                console.log("Recived message type = QUERY_LATEST")
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                console.log("Recived message type = QUERY_ALL")
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                console.log("Recived message type = RESPONSE_BLOCKCHAIN")
                const receivedBlocks = JsonToObject(message.data);
                if (receivedBlocks === null) {
                    console.log("Inavlid blocks received: \n" + message.data)
                    break;
                }
                handleBlockchainResponse(receivedBlocks);
                break;
        }
    })
}

//ws is a WebSocket

const write = (ws, message) => ws.send(JSON.stringify(message));

const broadcast = (message) => sockets.forEach((socket) => write(socket, message));

const queryChainLengthMsg = () => ({
    'type': MessageType.QUERY_LATEST, 
    'data': null
});

const queryAllMsg = () => ({
    'type': MessageType.QUERY_ALL, 
    'data': null
});

const responseChainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 
    'data': JSON.stringify(getBlockchain())
});

const responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
});

const initErrorHandler = (ws) => {
    const closeConnection = (myWs) => {
        console.log('connection failed to peer: ' + myWs.url);
        sockets.splice(sockets.indexOf(myWs), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

const handleBlockchainResponse = (receivedBlocks) => {
    if (receivedBlocks.length === 0) {
        console.log("Got an empty blockchian from peer.");
        return;
    }
    const lastestBlockReceived = receivedBlocks[receivedBlocks.length -1];
    if (!isValidBlockStructure(lastestBlockReceived)){
        console.log(lastestBlockReceived.hash)
        console.log("The final block in the received chain is invalid, discarding...")
        return;
    }
    const lastestBlockHeld = getLatestBlock();
    if (lastestBlockHeld.index < lastestBlockReceived.index) {
        console.log("Found a chain the is longer than ours.")
        if (lastestBlockHeld.hash === lastestBlockReceived.previousHash) {
            console.log("Chain was longer by one block, trying to add block.")
            addBlockToChain(lastestBlockReceived);
            broadcastLatest()
        } else if (receivedBlocks.length === 1) {
            console.log("Only received one block thats seems to be ahead, querying peers for current chain.")
            broadcast(queryAllMsg());
        } else {
            console.log("Replacing our old chain with the new received chain");
            replaceChain(receivedBlocks);
            broadcastLatest();
        }
    } else {
        console.log("Received blockchain is shorter than ours. Discarding it..")
    }
}

const broadcastLatest = () => {
    console.log("Broadcasting new block: " + getLatestBlock())
    broadcast(responseLatestMsg());
};

const connectToPeers = (newPeer) => {
    const ws = new WebSocket("ws://" + newPeer);
    ws.on('open', () => {
        initConnection(ws);
    });
    ws.on('error', (e) => {
        console.log('connection failed', e);
    });
};

module.exports = {connectToPeers, broadcastLatest, initPeerServer, getSockets};