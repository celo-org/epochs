import { formatEther, getContract } from "viem";
import { getCoreContractAddress, getEpochBlockNumber, publicClient } from "./utils";
import {
    validatorsABI,
    epochRewardsABI,
    electionABI,
    goldTokenABI,
    stableTokenABI,
} from "@celo/abis/types/wagmi";

/**
 * Incomplete (WIP)
 * */
async function getIndividualVoterRewards(epochNumber: bigint) {
    // Test: Get active votes of an account
    const electionContract = getContract({
        address: await getCoreContractAddress("Election"),
        abi: electionABI,
        publicClient: publicClient,
    });
    const RANDOM_VOTER = "0xbd5cac2afcc30d2c32e7a1afdfa85e5f6bb22f98";
    const RANDOM_VALIDATOR_GROUP = "0x81383e7C8801B102f742f4F5a5faD06867212b05";

    const result = await electionContract.read.getActiveVotesForGroupByAccount([
        RANDOM_VALIDATOR_GROUP,
        RANDOM_VOTER,
    ]);
    console.log(
        `${RANDOM_VOTER.substring(0, 8)}... is voting with ${formatEther(
            result
        )} CELO for ${RANDOM_VALIDATOR_GROUP.substring(0, 8)}...`
    );

    console.log(
        `${RANDOM_VOTER.substring(
            0,
            8
        )}... is voting with a total of ${formatEther(
            await electionContract.read.getTotalVotesByAccount([
                `0xbd5cac2afcc30d2c32e7a1afdfa85e5f6bb22f98`,
            ])
        )} CELO`
    );

    // Test: Get epoch rewards distributed to a group
    const epochBlock = getEpochBlockNumber(epochNumber);
    // const filter = await publicClient.createContractEventFilter({
    //     address: "0x8d6677192144292870907e3fa8a5527fe55a7ff6", // Election Proxy contract
    //     abi: electionABI,
    //     eventName: "EpochRewardsDistributedToVoters",
    //     args: {
    //         group: RANDOM_VALIDATOR_GROUP,
    //     },
    //     fromBlock: epochBlock,
    //     toBlock: epochBlock,
    // });
    // const logs = await publicClient.getFilterLogs({ filter });
    // console.log(
    //     `Summary:`,
    //     {
    //         epoch: epochNumber,
    //         name: "Epoch rewards distribution to group",
    //         value: `${formatEther(logs[0].args.value!)} CELO`,
    //         to: RANDOM_VALIDATOR_GROUP,
    //     },
    //     "\n"
    // );
    // console.log(`Detail(s):`, logs, "\n");

    // Test: Get pro-rata rewards distributed to an account
}
