import { createPublicClient, http, formatEther } from "viem";
import { celo } from "viem/chains";
import { electionABI } from "@celo/abis";
import { getCoreContractAddress, getEpochBlockNumber, writeToJsonFile } from "./utils";

const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
});

async function getTotalVoterRewards(epochNumber: bigint) {
    try {
        // configures log filter
        const filter = await publicClient.createContractEventFilter({
            address: await getCoreContractAddress("Election"), // Election Proxy contract
            abi: electionABI,
            eventName: "EpochRewardsDistributedToVoters",
            fromBlock: getEpochBlockNumber(epochNumber),
            toBlock: getEpochBlockNumber(epochNumber),
        });

        // fetches logs
        const logs = await publicClient.getFilterLogs({ filter });

        // writes logs to JSON file
        writeToJsonFile("evt_epochRewardsDistributedToVoters", logs);

        // calculates total
        const total = formatEther(logs.reduce((sum, log) => sum + log.args.value!, 0n));
        console.log(`Total voter rewards:`, total);
    } catch (error) {
        console.log(error);
    }
}

async function main() {
    getTotalVoterRewards(1302n); // Arbitrary epoch number: 1,302 (16/11/2023)
    // Compare to on explorer: https://explorer.celo.org/mainnet/block/0xe78f9bd66c087207f36dd5b0ef30704c788e2589827b3e39bb8cfc2cb56613ec/epoch-transactions
}

main();
