import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";

const EPOCH_SIZE = 17280n;

export const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
});

async function getEpochDistributions() {
    try {
        const currentBlockNumber = await publicClient.getBlockNumber();
        console.log(`Current block number: ${currentBlockNumber}`);

        const lastEpochBlockNumber =
            currentBlockNumber - (currentBlockNumber % EPOCH_SIZE);
        console.log(`Last block of the last epoch: ${lastEpochBlockNumber}`);

        const lastEpochNumber = lastEpochBlockNumber / EPOCH_SIZE;
        console.log(`Last epoch number: ${lastEpochNumber}`);

        const lastEpochBlock = await publicClient.getBlock({
            blockNumber: lastEpochBlockNumber,
        });
        console.log(`Last epoch block:`, lastEpochBlock);

        const epochTransactions = await publicClient.getTransactionReceipt({
            hash: lastEpochBlock.hash,
        });
        console.log(`Last epoch transactions:`, epochTransactions);
    } catch (error) {
        console.log(error);
    }
}

getEpochDistributions();
