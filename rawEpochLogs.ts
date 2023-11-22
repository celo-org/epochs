import { decodeEventLog } from "viem";
import {
    BLOCKS_PER_EPOCH,
    getEpochBlockNumber,
    publicClient,
    writeToJsonFile,
} from "./utils";
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

async function getEpochLogs(epochNumber: bigint) {
    try {
        // fetches epoch block hash
        const { hash } = await publicClient.getBlock({
            blockNumber: getEpochBlockNumber(epochNumber),
        });

        // fetches block transactions
        const epochTransactions = await publicClient.getLogs({
            blockHash: hash,
        });

        // filters out transactions that are not epoch logs
        const decodedEvents = epochTransactions
            .filter((tx) => tx.transactionHash == tx.blockHash)
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

        // groups events by contract for better readability
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

        // Prints summary
        console.log(
            `Summary:`,
            {
                "Epoch number": epochNumber,
                "Epoch transactions": epochTransactions.length,
                "Distinct events": groupedEventsArray.length,
            },
            "\n"
        );

        groupedEventsArray.forEach((event) => {
            console.log(
                `Contract: ${event.name} \n`,
                `Event: "${event.eventName}" \n`,
                `Count: ${event.events.length} events \n\n`
            );
        });

        // Writes logs to JSON file
        writeToJsonFile(`epoch${epochNumber}`, groupedEventsArray);
        console.log(
            `For detailed logs, see: ./output/epoch${epochNumber}.json`
        );
    } catch (error) {
        console.log(error);
    }
}

/**
 * MAIN
 */
async function main() {
    await getEpochLogs(1307n);
}

main();
