import { goldTokenABI } from "@celo/abis/types/wagmi";
import { getCoreContractAddress, getEpochBlockNumber, publicClient } from "./utils";
import { formatEther } from "viem";

async function getCommunityFundDistribution(epochNumber: bigint) {
    const COMMUNITY_FUND_ADDRESS = await getCoreContractAddress("Governance");

    const filter = await publicClient.createContractEventFilter({
        address: await getCoreContractAddress("GoldToken"), // CELO ERC20 contract address
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

async function main() {
    await getCommunityFundDistribution(1307n); // Arbitrary epoch number
    // Compare output to Celo explorer: https://explorer.celo.org/mainnet/block/0xdd7a9b02f109f41e3ce710cb10ecca4a0f07e49f0f3d62e8c23d7792d6b1ca30/epoch-transactions
}

main();
