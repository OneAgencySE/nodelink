const CryptoJS = require('crypto-js');
const {hexToBinary} = require('./util');

const FIXED_DIFFICULTY = 16

class Block {
    constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
        this.index = index; //Number
        this.previousHash = previousHash; //String
        this.timestamp = timestamp; //Number
        this.data = data; //String
        this.hash = hash; //String
        this.difficulty = FIXED_DIFFICULTY;
        this.nonce = nonce;
    }
}

const calculateHash = (index, previousHash, timestamp, data, difficulty, nonce) => CryptoJS.SHA256(index + previousHash + timestamp + data + difficulty + nonce).toString();

const calculateHashForBlock = (block) => calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce)

const genesisBlock = new Block(
    0, '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', null, 1465154705, 'Created by gustav.eiman@oneagency.se', 0, 0
);

let blockchain = [genesisBlock];

const getLatestBlock = () => blockchain[blockchain.length -1];
const getGenesisBlock = () => blockchain[0];
const getBlockchain = () => blockchain;

const generateNextBlock = (blockData) => {
    const previousBlock = getLatestBlock();
    const nextIndex = previousBlock.index +1;
    const timestamp = new Date().getTime() / 1000;
    const previousHash = previousBlock.hash;
    const nextBlock = findBlock(nextIndex, previousHash, timestamp, blockData, FIXED_DIFFICULTY);
    return addBlockToChain(nextBlock);
}

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
    let nonce = 0;
    while (true) {
        const hash = calculateHash(
            index, previousHash, timestamp, data, difficulty, nonce
        );
        if (hashMatchesDifficulty(hash, difficulty)) {
            return new Block(
                index, hash, previousHash, timestamp, data, difficulty, nonce
            );
        }
        nonce++;
    }
};

//The index of the block must be one number larger than the previous
//The previousHash of the block match the hash of the previous block
//The hash of the block itself must be valid
const isValidNewBlock = (newBlock, previousBlock) => {
    return newBlock.index === previousBlock.index +1 && newBlock.previousHash === previousBlock.hash && hasValidHash(newBlock);
}

const isValidBlockStructure = (block) => {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string'
        && typeof block.difficulty === 'number'
        && typeof block.nonce === 'number';
}

const hasValidHash = (block) => {
    console.log("The hash matches block content? " + hashMatchesBlockContent(block))
    console.log("The hash matches difficulty? " + hashMatchesDifficulty(block.hash, block.difficulty))
    return hashMatchesBlockContent(block) && hashMatchesDifficulty(block.hash, block.difficulty)
}

const hashMatchesDifficulty = (hash, difficulty) => {
    return hexToBinary(hash).startsWith('0'.repeat(difficulty))
}

const hashMatchesBlockContent = (block) => {
    return block.hash === calculateHashForBlock(block);
}

const isValidChain = (blockchainToValidate) => {
    const isValidGenesis = (block) => {
        return JSON.stringify(block) === JSON.stringify(getGenesisBlock());
    }
    const isValidRestOfChain = (blockchainToValidate) => {
        for (let i = 1; i < blockchainToValidate.length; i++) {
            if(!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i-1])) {
                return false;
            }
        }
        return true;
    }
    return isValidGenesis(blockchainToValidate[0]) && isValidRestOfChain(blockchainToValidate);    
}

const addBlockToChain = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
        console.log("New block added.")
        return true;
    }
    console.log("The block that was pushed is invalid. Discarding it...")
    return false;
};

const replaceChain = (newChain) => {
    if(isValidChain(newChain) && newChain.length > getBlockchain().length) {
        console.log("The new received chain is valid, replacing old chain.")
        blockchain = newChain;
    } else {
        console.log("Invalid chain received and discarded.")
    }
}

module.exports = {Block, getBlockchain, getLatestBlock, generateNextBlock, isValidBlockStructure, replaceChain, addBlockToChain};