import fs from "fs";
import {
    createPublicClient,
    decodeEventLog,
    http,
    parseAbiItem,
    getAddress,
} from "viem";
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
const BLOCKS_PER_EPOCH = 17280n;
const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
});

async function getEpochDistributions() {
    try {
        const currentBlockNumber = await publicClient.getBlockNumber();
        console.log(`Current block number: ${currentBlockNumber}`);

        const lastEpochBlockNumber =
            currentBlockNumber - (currentBlockNumber % BLOCKS_PER_EPOCH);
        console.log(`Last block of the last epoch: ${lastEpochBlockNumber}`);

        const lastEpochNumber = lastEpochBlockNumber / BLOCKS_PER_EPOCH;
        console.log(`Last epoch number: ${lastEpochNumber}`);

        const lastEpochBlock = await publicClient.getBlock({
            blockNumber: lastEpochBlockNumber,
        });

        const epochTransactions = await publicClient.getLogs({
            blockHash: lastEpochBlock.hash,
        });
        console.log(`Number of epoch transactions:`, epochTransactions.length);

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

        const groupedEvents: { [key: string]: any } = {};
        decodedEvents.forEach((event) => {
            const key = `${event.eventName}-${event.address}`;
            if (!groupedEvents[key]) {
                groupedEvents[key] = {
                    name: event.name,
                    eventName: event.eventName,
                    address: event.address,
                    events: [],
                };
            }
            groupedEvents[key].events.push({
                ...event.args,
                transactionHash: event.transactionHash,
            });
        });
        const groupedEventsArray = Object.values(groupedEvents);

        console.log(`${groupedEventsArray.length} distinct events:`);

        // print the keys and number of event per key
        groupedEventsArray.forEach((event) => {
            console.log(
                `${event.eventName} (${event.name}) - ${event.events.length} events`
            );
        });

        fs.writeFileSync(
            `./output/epoch${lastEpochNumber}.json`,
            JSON.stringify(
                groupedEventsArray,
                (key, value) =>
                    typeof value === "bigint" ? value.toString() : value,
                2
            )
        );
    } catch (error) {
        console.log(error);
    }
}

async function getVoterRewards(epochNumber: bigint) {
    // TODO
}

async function playground() {
    try {
        const filter = await publicClient.createContractEventFilter({
            address: "0x471ece3750da237f93b8e339c536989b8978a438", // CELO ERC20 contract address
            abi: goldTokenABI,
            eventName: "Transfer",
            args: {
                from: "0x0000000000000000000000000000000000000000",
            },
            fromBlock: 16330000n,
            toBlock: 16330050n,
        });
        const logs = await publicClient.getFilterLogs({ filter });

        // const logs = await publicClient.getLogs({
        //     address: getAddress("0x471ece3750da237f93b8e339c536989b8978a438"),
        //     event: parseAbiItem(
        //         "event Transfer(address indexed from, address indexed to, uint256 value)"
        //     ),
        //     args: {
        //         from: "0x0000000000000000000000000000000000000000",
        //     },
        // });
        console.log(logs);
    } catch (error) {
        console.log(error);
    }
}

playground();
