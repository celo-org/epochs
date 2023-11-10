import fs from "fs";
import { createPublicClient, decodeEventLog, http } from "viem";
import { celo } from "viem/chains";
import {
    validatorsABI,
    epochRewardsABI,
    electionABI,
    goldTokenABI,
    stableTokenABI,
} from "@celo/abis/types/wagmi";

interface CoreContracts {
    [address: string]: {
        name: string;
        abi: any;
    };
}
const CORECONTRACTS: CoreContracts = {
    "0x471ece3750da237f93b8e339c536989b8978a438": {
        name: "Celo native asset (CELO)",
        abi: goldTokenABI,
    },
    "0x765de816845861e75a25fca122bb6898b8b1282a": {
        name: "Celo Dollar (cUSD)",
        abi: stableTokenABI,
    },
    "0x07f007d389883622ef8d4d347b3f78007f28d8b7": {
        name: "EpochRewards",
        abi: epochRewardsABI,
    },
    "0xaeb865bca93ddc8f47b8e29f40c5399ce34d0c58": {
        name: "Validators",
        abi: validatorsABI,
    },
    "0x8d6677192144292870907e3fa8a5527fe55a7ff6": {
        name: "Election",
        abi: electionABI,
    },
};
const EPOCH_SIZE = 17280n;

async function getEpochDistributions() {
    const publicClient = createPublicClient({
        chain: celo,
        transport: http(),
    });
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

        const epochTransactions = await publicClient.getLogs({
            blockHash: lastEpochBlock.hash,
        });
        console.log(`Number of epoch transactions:`, epochTransactions.length);

        const uniqueAddresses = new Set(
            epochTransactions.map((tx) => tx.address)
        );
        console.log(`Unique addresses:`, uniqueAddresses);

        const decodedEvents = epochTransactions
            .filter((tx) => tx.address in CORECONTRACTS)
            .map((tx) => {
                const decodedEvent = decodeEventLog({
                    abi: CORECONTRACTS[tx.address].abi,
                    data: tx.data,
                    topics: tx.topics,
                });

                return {
                    name: CORECONTRACTS[tx.address].name,
                    eventName: decodedEvent.eventName,
                    args: decodedEvent.args,
                    address: tx.address,
                    transactionHash: tx.transactionHash,
                };
            });

        fs.writeFileSync(
            `./output/epoch${lastEpochNumber}.json`,
            JSON.stringify(
                decodedEvents,
                (key, value) =>
                    typeof value === "bigint" ? value.toString() : value,
                2
            )
        );

    } catch (error) {
        console.log(error);
    }
}



getEpochDistributions();
