import { goldTokenABI } from "@celo/abis/types/wagmi";
import { getEpochBlockNumber, publicClient } from "./utils";
import { formatEther } from "viem";

async function getCommunityFundDistribution(epochNumber: bigint) {
    const COMMUNITY_FUND_ADDRESS = "0xd533ca259b330c7a88f74e000a3faea2d63b7972";
    const filter = await publicClient.createContractEventFilter({
        address: "0x471ece3750da237f93b8e339c536989b8978a438", // CELO ERC20 contract address
        abi: goldTokenABI,
        eventName: "Transfer",
        args: {
            from: "0x0000000000000000000000000000000000000000",
            to: COMMUNITY_FUND_ADDRESS,
        },
        fromBlock: getEpochBlockNumber(epochNumber),
        toBlock: getEpochBlockNumber(epochNumber),
    });
    const logs = await publicClient.getFilterLogs({ filter });
    console.log(
        `Summary:`,
        {
            epoch: epochNumber,
            name: "Community Fund Distribution",
            value: `${formatEther(logs[0].args.value!)} CELO`,
            to: COMMUNITY_FUND_ADDRESS,
        },
        "\n"
    );
    console.log(`Detail(s):`, logs, "\n");
}

/**
 * MAIN
 */
async function main() {
    await getCommunityFundDistribution(1307n); // Arbitrary epoch number
    // Compare output to Celo explorer: https://explorer.celo.org/mainnet/block/0xdd7a9b02f109f41e3ce710cb10ecca4a0f07e49f0f3d62e8c23d7792d6b1ca30/epoch-transactions
}

main();
