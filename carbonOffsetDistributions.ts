import { formatEther } from "viem";
import { getCoreContractAddress, getEpochBlockNumber, publicClient } from "./utils";
import { goldTokenABI } from "@celo/abis";

const CARBON_OFFSET_ADDRESS = "0xCe10d577295d34782815919843a3a4ef70Dc33ce";

async function getCarbonOffsetDistribution(epochNumber: bigint) {
    const filter = await publicClient.createContractEventFilter({
        address: await getCoreContractAddress("GoldToken"), // CELO ERC20 contract address
        abi: goldTokenABI,
        eventName: "Transfer",
        args: {
            from: "0x0000000000000000000000000000000000000000",
            to: CARBON_OFFSET_ADDRESS,
        },
        fromBlock: getEpochBlockNumber(epochNumber),
        toBlock: getEpochBlockNumber(epochNumber),
    });
    const logs = await publicClient.getFilterLogs({ filter });
    console.log(
        `Summary:`,
        {
            epoch: epochNumber,
            name: "Carbon Offset Distribution",
            value: `${formatEther(logs[0].args.value!)} CELO`,
            to: CARBON_OFFSET_ADDRESS,
        },
        "\n"
    );
    console.log(`Detail(s):`, logs, "\n");
}

async function main() {
    await getCarbonOffsetDistribution(1307n); // Arbitrary epoch number
    // Compare output to Celo explorer: https://explorer.celo.org/mainnet/block/0xdd7a9b02f109f41e3ce710cb10ecca4a0f07e49f0f3d62e8c23d7792d6b1ca30/epoch-transactions
}

main();
