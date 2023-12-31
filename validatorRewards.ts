import { createPublicClient, http, formatEther, getContract } from "viem";
import { celo } from "viem/chains";
import { validatorsABI, registryABI } from "@celo/abis";
import { writeToJsonFile } from "./utils";

const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
});

async function getValidatorRewards(epochNumber: bigint) {
    try {
        // configures log filter
        const filter = await publicClient.createContractEventFilter({
            address: await getCoreContractAddress("Validators"),
            abi: validatorsABI,
            eventName: "ValidatorEpochPaymentDistributed",
            fromBlock: getEpochBlockNumber(epochNumber),
            toBlock: getEpochBlockNumber(epochNumber),
        });

        // fetches logs
        const logs = await publicClient.getFilterLogs({ filter });

        // writes logs to JSON file
        writeToJsonFile("evt_ValidatorEpochPaymentDistributed", logs);

        // calculates total
        const totalValidatorRewards = formatEther(
            logs.reduce((sum, log) => sum + log.args.validatorPayment!, 0n)
        );
        const totalValidatorGroupRewards = formatEther(
            logs.reduce((sum, log) => sum + log.args.groupPayment!, 0n)
        );
        console.log(`Total validator rewards:`, totalValidatorRewards);
        console.log(`Total validator group rewards:`, totalValidatorGroupRewards);
        console.log(`For detailed logs, see: evt_ValidatorEpochPaymentDistributed.json`);
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
    getValidatorRewards(1302n); // Arbitrary epoch number: 1,302 (16/11/2023)
    // Compare to on explorer: https://explorer.celo.org/mainnet/block/0xe78f9bd66c087207f36dd5b0ef30704c788e2589827b3e39bb8cfc2cb56613ec/epoch-transactions
}

main();
