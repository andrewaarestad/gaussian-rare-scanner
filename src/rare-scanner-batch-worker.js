const hre = require("hardhat");

const BATCH_SIZE = process.argv[2];
const BLOCKS_TO_SCAN = process.argv[3];
const START_BLOCK = process.argv[4];
const SENDER_ADDRESS = process.argv[5];

async function deploy() {
  const contractFactory = await hre.ethers.getContractFactory("TheGaussianProtocol");
  const [owner, executor, _] = await hre.ethers.getSigners();
  const contract = await contractFactory.deploy(executor.address);
  await contract.deployed();
  return contract;
}

async function run() {
  const contract = await deploy();

  for (let blockIndex=START_BLOCK; blockIndex<START_BLOCK+BLOCKS_TO_SCAN;blockIndex++) {
    for (let ii=0; ii<100; ii++) {
      const lower = ii*BATCH_SIZE;
      let upper = (ii+1)*BATCH_SIZE-1;
      if (upper > 8888) {
        upper = 8888;
      }
      console.log('invoking scanForRares(', SENDER_ADDRESS, lower, upper, blockIndex, ')')
      await contract.scanForRares(SENDER_ADDRESS, lower, upper, blockIndex, {gasLimit: 1000000000});
    }
  }

}

run()
.then(() => process.exit(0))
.catch(err => {
  console.error(err);
  process.exit(999);
})
