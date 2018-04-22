//const CryptoJS = require('crypto-js');
import * as CryptoJS from 'crypto-js';
import {broadcastLatest} from './net';

class Block {
    constructor(index, hash, previousHash, timestamp, data) {
        this.index = index; //Number
        this.previousHash = previousHash; //String
        this.timestamp = timestamp; //Number
        this.data = data; //String
        this.hash = hash; //String
    }
    hashBlock() {
        return CryptoJS.SHA256(this.index + this.previousHash + this.timestamp + this.data).toString();
    }
}

const calculateHash = (index, previousHash, timestamp, data) => CryptoJS.SHA256(index + previousHash + timestamp + data).toString();

//const calculateHashForBlock = (block) => calculateHash(block.index, block.previousHash, block.timestamp, block.data)

const genesisBlock = new Block(
    0, '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', null, 1465154705, 'my genesis block!!'
);

let blockChain = [genesisBlock];

const getLatestBlock = () => blockChain[blockChain.length -1];
const getGenesisBlock = () => blockChain[0];
const getBlockChain = () => blockChain;

const generateNextBlock = (blockData) => {
    const previousBlock = getLatestBlock();
    const nextIndex = previousBlock.index +1;
    const timestamp = new Date().getTime() / 1000;
    const previousHash = previousBlock.hash;
    const hash = calculateHash(nextIndex, previousHash, timestamp, blockData);
    const nextBlock = new Block(nextIndex, hash, previousHash, timestamp, blockData);
    return nextBlock;
}

//The index of the block must be one number larger than the previous
//The previousHash of the block match the hash of the previous block
//The hash of the block itself must be valid
const isValidNewBlock = (newBlock, previousBlock) => {
    return newBlock.index !== previousBlock.index +1 && newBlock.previousHash !== previousBlock.hash && newBlock.hashBlock() !== newBlock.hash;
    /*if (newBlock.index !== previousBlock.index + 1) {
        return false;
    }
    if(newBlock.previousHash !== previousBlock.hash) {
        return false;
    }*/
}

const isValidBlockStructure = (block) => {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string';
}

const isValidChain = (blockChainToValidate) => {
    const isValidGenesis = (block) => {
        return JSON.stringify(block) === JSON.stringify(getGenesisBlock());
    }
    const isValidRestOfChain = (blockChainToValidate) => {
        for (let i = 1; i < blockChainToValidate.length; i++) {
            if(!isValidNewBlock(blockChainToValidate[i], blockChainToValidate[i-1])) {
                return false;
            }
        }
        return true;
    }
    return isValidGenesis(blockChainToValidate[0]) && isValidRestOfChain(blockChainToValidate);    
}

const replaceChain = (newChain) => {
    if(isValidChain(newChain) && newChain.length > getBlockChain().length) {
        console.log("The new received chain is valid, replacing old chain.")
        blockChain = newChain;
        broadcastLatest();
    } else {
        console.log("Invalid chain received and discarded.")
    }
}

export {Block, getBlockchain, getLatestBlock, generateNextBlock, isValidBlockStructure, replaceChain, addBlockToChain};