const { newKit } = require('@celo/contractkit');

async function getLastBlockOfLastEpoch() {
  const kit = newKit('https://forno.celo.org'); // This is a public node for the Celo network.

  try {
    // Fetch the current block number
    const currentBlockNumber = await kit.web3.eth.getBlockNumber();
    console.log(`Current block number: ${currentBlockNumber}`);

    // Fetch the epoch size
    const validators = await kit._web3Contracts.getValidators();
    const epochSize = await validators.methods.getEpochSize().call();
    console.log(`Epoch size: ${epochSize}`);

    // Calculate the last block of the last epoch
    const lastEpochBlockNumber = currentBlockNumber - (currentBlockNumber % epochSize);
    console.log(`Last block of the last epoch: ${lastEpochBlockNumber}`);

    // Calculate the epoch number
    const epochNumber = lastEpochBlockNumber / epochSize;
    console.log(`Last epoch number: ${epochNumber}`);

    // Fetch the last block of the last epoch
    const lastEpochBlock = await kit.web3.eth.getBlock(lastEpochBlockNumber);
    const blockTransactions = lastEpochBlock.transactions;
    console.log(`Block transactions in the last block of the last epoch:`, blockTransactions);

  } catch (error) {
    console.error(`Error fetching last block of last epoch: ${error}`);
  }

  kit.stop(); // When done, stop the kit to close the connection to the node
}

getLastBlockOfLastEpoch();
