const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

const NETWORK = process.env.NETWORK;
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const AIRVAULT_CONTRACT_ADDRESS = process.env.AIRVAULT_CONTRACT_ADDRESS;
const WIN_TOKEN_ADDRESS = process.env.WIN_TOKEN_ADDRESS;
const AIRDROP_INTERVAL = parseInt(process.env.AIRDROP_INTERVAL, 100);

const provider = new ethers.providers.InfuraProvider(
  NETWORK,
  INFURA_PROJECT_ID
);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const AIRVAULT_ABI = require("./AirVaultABI.json"); // ABI of the AirVault contract
const WIN_TOKEN_ABI = require("./WinTokenABI.json"); // ABI of the WINToken contract

const airVaultContract = new ethers.Contract(
  AIRVAULT_CONTRACT_ADDRESS,
  AIRVAULT_ABI,
  provider
);
const winTokenContract = new ethers.Contract(
  WIN_TOKEN_ADDRESS,
  WIN_TOKEN_ABI,
  wallet
);

/**
 * State Management for storing last block which we monitored so far.
 * Since this is a prototype we are storing it inside a JSON file.
 * Ideally we should make use of a Database like AWS DynamoDB (since we are using AWS LAMBDA, a service under the AWS ecosystem is suggested).
 * */
const STATE_FILE = "state.json";

function readState() {
  if (fs.existsSync(STATE_FILE)) {
    const state = fs.readFileSync(STATE_FILE);
    return JSON.parse(state);
  }
  return { lastProcessedBlock: 0 };
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}

/** Function to calculate the Airdrop
 * for the user respective of their Deposit corresponding to the blocks
 * its is kept
 *
 * */
async function calculateAirdrop(
  user,
  userEvents,
  startBlock,
  endBlock,
  airdropInterval,
  airVaultContract
) {
  let totalFudBlocks = ethers.BigNumber.from(0);

  let userEventInfo = userEvents[user];
  let userTotalFudBlocks = ethers.BigNumber.from(0);
  let prevBlockNumber = startBlock;

  let prevAmount = ethers.BigNumber.from(0);
  if(airVaultContract){
    prevAmount = await airVaultContract.lockedBalanceOf(user);
  }

  /**Calculate the total FUDtoken against the blocks deposited for the interval*/
  for (let event of userEventInfo) {
    let { blockNumber, amount, isDeposit } = event;
    if (blockNumber > endBlock) break; // This is to ensure we don't calculate deposit outside the block range. Just in case

    let duration = ethers.BigNumber.from(blockNumber - prevBlockNumber);
    prevAmount = isDeposit ? prevAmount.add(amount) : prevAmount.sub(amount); // The withdrawn token amount is subtracted from rewarding
    userTotalFudBlocks = userTotalFudBlocks.add(prevAmount.mul(duration));
    prevBlockNumber = blockNumber;
  }

  /**Calculate the total FUDtoken against the remaining blocks for the interval*/
  let duration = ethers.BigNumber.from(endBlock - prevBlockNumber + 1);
  totalFudBlocks = totalFudBlocks.add(userTotalFudBlocks);
  userTotalFudBlocks = userTotalFudBlocks.add(prevAmount.mul(duration));

  /** Calculate the average FUD token per block and percentage of the rewards */
  let averageFudPerBlock = totalFudBlocks.div(airdropInterval);
  let reward = averageFudPerBlock.mul(5).div(100);

  return reward;
}

/** Handler function the AWS lambda will trigger*/
exports.monitorDeposits = async (event) => {
  const currentBlock = await provider.getBlockNumber();
  const { lastProcessedBlock } = readState();

  /** First we need to check if the condition for the airdrop interval is met
   * The num of blocks from the last looked block (lastProcessedBlock) to the current block should be greater than AirDrop Interval
   */
  if (currentBlock - lastProcessedBlock < AIRDROP_INTERVAL) {
    return {
      statusCode: 200,
      body: JSON.stringify("Not yet time for next airdrop"),
    };
  }

  /** We set the start block and end block for monitoring the events*/
  const startBlock = lastProcessedBlock + 1;
  const endBlock = lastProcessedBlock + AIRDROP_INTERVAL;
  if (endBlock > currentBlock) {
    endBlock = currentBlock;
  }

  /** Monitor the Deposited and Withdrawn events from the AirVault contract*/
  const depositFilter = airVaultContract.filters.Deposited();
  const withdrawFilter = airVaultContract.filters.Withdrawn();
  const depositEvents = await airVaultContract.queryFilter(
    depositFilter,
    startBlock,
    endBlock
  );
  const withdrawEvents = await airVaultContract.queryFilter(
    withdrawFilter,
    startBlock,
    endBlock
  );

  let userEvents = {};

  for (let event of depositEvents) {
    const { user, amount, blockNumber } = event.args;
    
    if (!userEvents[user]) {
      userEvents[user] = [];
    }
    userEvents[user].push({ amount, blockNumber, isDeposit: true });
  }

  for (let event of withdrawEvents) {
    const { user, amount, blockNumber } = event.args;
    if (!userEvents[user]) {
      userEvents[user] = [];
    }
    userEvents[user].push({ amount, blockNumber, isDeposit: false });
  }

  /** Calculate the Airdrop events and distribute it to users */
  for (let user of Object.keys(userEvents)) {
    let reward = await calculateAirdrop(
      user,
      userEvents,
      startBlock,
      endBlock,
      AIRDROP_INTERVAL,
      airVaultContract
    );
    if (reward.gt(0)) {
      await winTokenContract.mint(user, reward);
    }
  }

  /** Update the last processed block number to state storage*/
  writeState({ lastProcessedBlock: endBlock });

  return {
    statusCode: 200,
    body: JSON.stringify("Airdrop complete"),
  };
};
