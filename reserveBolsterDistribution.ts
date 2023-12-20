import { formatEther } from "viem";
import { getCoreContractAddress, getEpochBlockNumber, publicClient } from "./utils";
import { goldTokenABI } from "@celo/abis/types/wagmi";

async function getReserveBolsterDistribution(epochNumber: bigint) {
    const RESERVE_ADDRESS = await getCoreContractAddress("Reserve");

    const filter = await publicClient.createContractEventFilter({
        address: await getCoreContractAddress("GoldToken"), // CELO ERC20 contract address
        abi: goldTokenABI,
        eventName: "Transfer",
        args: {
            from: "0x0000000000000000000000000000000000000000",
            to: RESERVE_ADDRESS,
        },
        fromBlock: getEpochBlockNumber(epochNumber),
        toBlock: getEpochBlockNumber(epochNumber),
    });
    const logs = await publicClient.getFilterLogs({ filter });

    /* 
    Validator rewards are paid in cUSD, so every epoch has at least one CELO transfer 
    from the zero address to the reserve. This is how cUSD is minted before it is distributed 
    to validators. If there is only one CELO transfer, then there was no Reserve bolster
    distribution for that epoch.

    If there are multiple CELO transfers, then the last one is the Reserve bolster distribution.
    */
    if (logs.length == 1) {
        console.log(`No Reserve bolster distribution for epoch ${epochNumber}`);
    } else {
        console.log(
            `Summary:`,
            {
                epoch: epochNumber,
                name: "Reserve Bolster Distribution",
                value: `${formatEther(logs[logs.length - 1].args.value!)} CELO`,
                to: RESERVE_ADDRESS,
            },
            "\n"
        );
        console.log(`Detail(s):`, logs[logs.length - 1], "\n");
    }
}

/**
 * MAIN
 */
async function main() {
    await getReserveBolsterDistribution(1234n); // Arbitrary epoch number
    // Compare output to Celo explorer: https://explorer.celo.org/mainnet/block/0x11d6b078b68d16b7a5be7bdbb8dd3ca338fc5064fd59856f96a77fdfc03b9ece/epoch-transactions

    // Epoch with no Reserve bolster distribution
    await getReserveBolsterDistribution(1335n); // Arbitrary epoch number
    // Compare output to Celo explorer: https://explorer.celo.org/mainnet/block/0x11d6b078b68d16b7a5be7bdbb8dd3ca338fc5064fd59856f96a77fdfc03b9ece/epoch-transactions

}

main();
