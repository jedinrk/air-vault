const airdropHandler = require('./handler'); // Ensure this path matches where your airdrop handler script is located

const INTERVAL_MS = 1 * 60 * 1000; // Interval in milliseconds (e.g., 1 minutes)

async function runAirdrop() {
  try {
    const response = await airdropHandler.handler({});
    console.log(response);
  } catch (error) {
    console.error('Error running airdrop handler:', error);
  }
}

async function startAirdropLoop() {
  while (true) {
    await runAirdrop();
    console.log(`Waiting for ${INTERVAL_MS / 1000 / 60} minutes before next run...`);
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
  }
}

startAirdropLoop();
