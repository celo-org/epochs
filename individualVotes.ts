import { publicClient, sleep, writeToJsonFile } from "./utils";
import { electionABI } from "@celo/abis/types/wagmi";

async function fetchValidatorGroupVoteCast(
    fromBlock: bigint,
    toBlock: bigint
): Promise<any> {
    console.log(
        `Fetching ValidatorGroupVoteCast from ${fromBlock} to ${toBlock}...`
    );

    // loop until RPC is successful
    while (true) {
        try {
            // defines filter
            const voteActivatedFilter =
                await publicClient.createContractEventFilter({
                    address: "0x8d6677192144292870907e3fa8a5527fe55a7ff6", // Election Proxy contract
                    abi: electionABI,
                    eventName: "ValidatorGroupVoteCast",
                    fromBlock: fromBlock,
                    toBlock: toBlock,
                });
            // fetches logs
            const voteActivatedLogs = await publicClient.getFilterLogs({
                filter: voteActivatedFilter,
            });
            console.log(`Finished ${fromBlock} to ${toBlock}. \n`);
            return voteActivatedLogs;
        } catch (error) {
            console.log("RPC error, trying again...");
            await sleep(1000);
            continue;
        }
    }
}

async function fetchLogsInInterval(fromBlock: bigint, toBlock: bigint) {
    const logs = [];
    const interval = 100000n;
    for (
        let lowerLimit = fromBlock;
        lowerLimit < toBlock;
        lowerLimit += interval
    ) {
        const upperLimit: bigint =
            lowerLimit + interval > toBlock ? toBlock : lowerLimit + interval;
        const interimResults = await fetchValidatorGroupVoteCast(
            lowerLimit,
            lowerLimit + interval
        );
        logs.push(...interimResults);
    }
    writeToJsonFile(
        `events_ValidatorGroupVoteCast_${fromBlock}_${toBlock}`,
        logs
    );
}

/**
 * MAIN
 */
async function main() {
    await fetchLogsInInterval(1n, 1000000n);
}

main();
