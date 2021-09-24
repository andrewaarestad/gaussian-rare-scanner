const hre = require("hardhat");

const SENDER_ADDRESS = process.argv[2];
const LOWER = process.argv[3];
const UPPER = process.argv[4];
const BLOCK_INDEX = process.argv[5];

async function deploy() {
  const contractFactory = await hre.ethers.getContractFactory("TheGaussianProtocol");
  const [owner, executor, _] = await hre.ethers.getSigners();
  const contract = await contractFactory.deploy(executor.address);
  await contract.deployed();
  return contract;
}

async function run() {
  const contract = await deploy();
  console.log('invoking scanForRares(', SENDER_ADDRESS, LOWER, UPPER, BLOCK_INDEX, ')')
  await contract.scanForRares(SENDER_ADDRESS, LOWER, UPPER, BLOCK_INDEX, {gasLimit: 1000000000});
}

run()
.then(() => process.exit(0))
.catch(err => {
  console.error(err);
  process.exit(999);
})
