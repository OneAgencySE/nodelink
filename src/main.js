const  bodyParser = require('body-parser');
const express = require('express');

const {Block, generateNextBlock, getBlockchain} = require('./chain');
const {connectToPeers, getSockets, initPeerServer, broadcastLatest} = require('./net');

const httpPort = process.env.HTTP_PORT || 4001;
const netPort = process.env.NET_PORT || 5001;

const initHttpServer = ( myHttpPort) => {
    const app = express();
    app.use(bodyParser.json());

    app.get('/blocks', (req, res) => {
        res.send(getBlockchain());
    });
    app.post('/mineBlock', (req, res) => {
        const newBlock = generateNextBlock(req.body.data);
        broadcastLatest(); //Check that this really works. Should work, but node is async and all... I think... G-night!
        res.send(newBlock);
    });
    app.get('/peers', (req, res) => {
        res.send(getSockets().map(( s) => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    app.post('/addPeer', (req, res) => {
        connectToPeers(req.body.peer);
        res.send("Peer added.");
    });

    app.listen(myHttpPort, () => {
        console.log('Listening http on port: ' + myHttpPort);
    });
};

initHttpServer(httpPort);
initPeerServer(netPort);

/*Tests
let b = new Block(1,"khadkjaehd", "kzdhakdh", 0, "heeey!")
//console.log(b.calculateHash())
console.log(calculateHash());
console.log(genesisBlock)
let b2 = generateNextBlock("heey");
console.log(b2);*/