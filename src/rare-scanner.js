// const hre = require("hardhat");
const { spawn } = require('child_process');
const {PromiseQueue} = require("hc-utilities");

// Logging hackery
const fs = require('fs');
const util = require('util');
var logFile = fs.createWriteStream('log.txt', { flags: 'w' });
// Or 'w' to truncate the file every time the process starts.
var logStdout = process.stdout;
console.log = function () {
  logFile.write(util.format.apply(null, arguments) + '\n');
  logStdout.write(util.format.apply(null, arguments) + '\n');
}
console.error = console.log;
// end logging hackery

const timingStats = {
  totalChecked: 0,
  start: new Date()
}
const BATCH_MODE = true;

function getDuration(start) {
  const duration = new Date().getTime() - start.getTime();
  if (duration < 1000) {
    return `${duration} ms`;
  } else if (duration < 60 * 1000) {
    return `${(duration / 1000).toFixed(2)} sec`;
  } else if (duration < 3600 * 1000) {
    return `${(duration / 1000 / 60).toFixed(2)} min`;
  } else {
    return `${(duration / 1000 / 3600).toFixed(2)} hrs`;
  }
}

function instrumentThroughput() {
  const elapsedSeconds = (new Date().getTime() - timingStats.start.getTime()) / 1000;
  const rate = timingStats.totalChecked / elapsedSeconds;
  console.log(`Processed ${timingStats.totalChecked} combinations in ${getDuration(timingStats.start)} = ${rate} combinations / sec`)
}

async function spawnWorker(senderAddress, lower, upper, blockIndex) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['src/rare-scanner-worker.js', senderAddress, lower, upper, blockIndex]);
    child.stdout.on('data', (data) => {
      console.log(`${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    child.on('error', (error) => {
      console.error(`error: ${error.message}`);
      reject(error);
    });

    child.on('close', (code) => {
      // console.log(`child process exited with code ${code}`);
      timingStats.totalChecked += (upper - lower + 1);
      resolve();
    });
  })
}

async function spawnBatchWorker(batchSize, blocksToScan, startBlock, senderAddress) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['src/rare-scanner-batch-worker.js', batchSize, blocksToScan, startBlock, senderAddress]);
    child.stdout.on('data', (data) => {
      console.log(`${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    child.on('error', (error) => {
      console.error(`error: ${error.message}`);
      reject(error);
    });

    child.on('close', (code) => {
      // console.log(`child process exited with code ${code}`);
      timingStats.totalChecked += (upper - lower + 1);
      resolve();
    });
  })
}

async function processBlock(batchSize, blocksToScan, startBlock, senderAddress) {
  console.log('processBlock(', batchSize, blocksToScan, startBlock, senderAddress, ')');
  if (BATCH_MODE) {
    await spawnBatchWorker(batchSize, blocksToScan, startBlock, senderAddress);
    instrumentThroughput();
  } else {
    for (let blockIndex=startBlock; blockIndex<startBlock+blocksToScan;blockIndex++) {
      for (let ii=0; ii<100; ii++) {
        const lower = ii*batchSize;
        let upper = (ii+1)*batchSize-1;
        if (upper > 8888) {
          upper = 8888;
        }
        await spawnWorker(senderAddress, lower, upper, blockIndex);
        instrumentThroughput();
      }
    }
  }
}

async function run() {
  const batchSize = 200;
  const blocksToScan = 1000;
  const startBlock = 13260610;
  const senderAddress = '0xd6a984153aCB6c9E2d788f08C2465a1358BB89A7';

  const blocks = [];
  for (let ii=0; ii<blocksToScan; ii++) {
    blocks.push(startBlock + ii);
  }

  await new PromiseQueue(10).runAll(blocks.map(block => async() => {
    await processBlock(batchSize, blocksToScan, block, senderAddress);
  }));
}

run()
.then(() => process.exit(0))
.catch(err => {
  console.error(err);
  process.exit(1);
})
