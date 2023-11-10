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
        /* 
        Example output `decodedEvents`:

        [{
            "name": "Celo Dollar (cUSD)",
            "eventName": "Transfer",
            "args": {
            "from": "0x5b66c7BebbC7A2c57F95a42D55d8e3F5C7BbE5c9",
            "to": "0x792dd70b5f3AF90B35bF305C5E1908FbbB4011c8",
            "value": "8000000000000000000"
            },
            "address": "0x765de816845861e75a25fca122bb6898b8b1282a",
            "transactionHash": "0xee125fb08de2d16dff50a908acfbaaa57f6e2ca7c6bf2fdc9e48f9f32a3afb9b"
        },
        {
            "name": "Celo Dollar (cUSD)",
            "eventName": "Transfer",
            "args": {
            "from": "0x5b66c7BebbC7A2c57F95a42D55d8e3F5C7BbE5c9",
            "to": "0xcD437749E43A154C07F3553504c68fBfD56B8778",
            "value": "225702748128608"
            },
            "address": "0x765de816845861e75a25fca122bb6898b8b1282a",
            "transactionHash": "0xee125fb08de2d16dff50a908acfbaaa57f6e2ca7c6bf2fdc9e48f9f32a3afb9b"
        },]
        */

        const groupedEvents: { [key: string]: any } = {};
        decodedEvents.forEach(event => {
            const key = `${event.eventName}-${event.address}`;
            if (!groupedEvents[key]) {
                groupedEvents[key] = {
                    name: event.name,
                    eventName: event.eventName,
                    address: event.address,
                    events: []
                };
            }
            groupedEvents[key].events.push({
                ...event.args,
                transactionHash: event.transactionHash
            });
        });
        const groupedEventsArray = Object.values(groupedEvents);
        /* 
        Example output `groupedEventsArray`:

        ```json
        [
            {
                "name": "Celo Dollar (cUSD)",
                "eventName": "Transfer",
                "address": "0x765de816845861e75a25fca122bb6898b8b1282a",
                "events": [
                {
                    "from": "0x5b66c7BebbC7A2c57F95a42D55d8e3F5C7BbE5c9",
                    "to": "0x792dd70b5f3AF90B35bF305C5E1908FbbB4011c8",
                    "value": "8000000000000000000",
                    "transactionHash": "0xee125fb08de2d16dff50a908acfbaaa57f6e2ca7c6bf2fdc9e48f9f32a3afb9b"
                },
                {
                    "from": "0x5b66c7BebbC7A2c57F95a42D55d8e3F5C7BbE5c9",
                    "to": "0xcD437749E43A154C07F3553504c68fBfD56B8778",
                    "value": "225702748128608",
                    "transactionHash": "0xee125fb08de2d16dff50a908acfbaaa57f6e2ca7c6bf2fdc9e48f9f32a3afb9b"
                },
                // ...
            },
        ]
        ```
        */

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

getEpochDistributions();
