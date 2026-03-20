const { ethers } = require("ethers");

const contractABI = require("./FakeAccountRegistry.json");

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.CONTRACT_ADDRESS;

const contract = new ethers.Contract(
  contractAddress,
  contractABI.abi,
  wallet
);

module.exports = contract;