import { createPublicClient, http, formatEther, getContract } from "viem";
import { celo } from "viem/chains";
import { electionABI, registryABI } from "@celo/abis/types/wagmi";
import { writeToJsonFile } from "./utils";

const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
});

async function getTotalVoterRewards(epochNumber: bigint) {
    try {
        // configures contract
        const electionContract = getContract({
            address: await getCoreContractAddress("Election"),
            abi: electionABI,
            publicClient,
        });

        // configures log filter
        const filter = await publicClient.createContractEventFilter({
            address: "0x8d6677192144292870907e3fa8a5527fe55a7ff6", // Election Proxy contract
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
        const total = formatEther(
            logs.reduce((sum, log) => sum + log.args.value!, 0n)
        );
        console.log(`Total voter rewards:`, total);
    } catch (error) {
        console.log(error);
    }
}

type Address = `0x${string}`;

async function getCoreContractAddress(contractName: string): Promise<Address> {
    const registryContract = getContract({
        address: "0x000000000000000000000000000000000000ce10",
        abi: registryABI,
        publicClient,
    });
    return await registryContract.read.getAddressForStringOrDie([contractName]);
}

function getEpochBlockNumber(epochNumber: bigint): bigint {
    const BLOCKS_PER_EPOCH = 17280n;
    return epochNumber * BLOCKS_PER_EPOCH;
}

async function main() {
    getTotalVoterRewards(1302n); // Arbitrary epoch number: 1,302 (16/11/2023)
    // Compare to on explorer: https://explorer.celo.org/mainnet/block/0xe78f9bd66c087207f36dd5b0ef30704c788e2589827b3e39bb8cfc2cb56613ec/epoch-transactions
}

main();
