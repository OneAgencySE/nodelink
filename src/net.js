//const WebSockets = require('ws');
import * as WebSocket from 'ws';
import {addBlockToChain, Block, getBlockchain, getLatestBlock, isValidBlockStructure, replaceChain} from './chain';
import {Enum} from 'enumify';
import { write } from 'fs';

const sockets = Websocket[];
//const getSockets = () => sockets

class MessageType extends Enum {}
MessageType.initEnum(['QUERY_LATEST', 'QUERY_ALL', 'RESPONSE_BLOCKCHAIN']);

class Message {
    constructor(type, data) {
        this.type = typeof type === MessageType ? type : 999;
        this.data = data;
    }
}

const initPeerServer = (peerPort) => {
    const server = WebSocket.Server({port: peerPort});
    server.on('connection', (ws) => {
        initConnection(ws)
    })
    console.log("Listening for network peers on port: " + port)
}

const initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMessage());
}

const JsonToObject = (json) => {
    try {
        return JSON.parse(json);
    } catch (e) {
        console.log("Json could not be parsed... Mesaage: \n" + e)
        return null;
    }
}

const initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        const message = JsonToObject(data);
        if (message === null) {
            return;
        }
        console.log("Message received and parsed to Json: \n" + message);
        switch(message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMessage());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMessage());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
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

const write = (ws, message) => ws.send(JSON.stringify(message));
const broadcast = (message) => sockets.forEach((socket) => write(socket, message));

const queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST, 'data': null});

const queryAllMsg = () => ({'type': MessageType.QUERY_ALL, 'data': null});

const responseChainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 
    'data': JSON.stringify(getBlockchain())
});

const responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
});