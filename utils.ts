import fs from "fs";
import { createPublicClient, http, getContract } from "viem";
import { celo } from "viem/chains";
import { registryABI } from "@celo/abis/types/wagmi";

export const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
});

type Address = `0x${string}`;
export async function getCoreContractAddress(
    contractName: string
): Promise<Address> {
    const registryContract = getContract({
        address: "0x000000000000000000000000000000000000ce10",
        abi: registryABI,
        publicClient,
    });
    return await registryContract.read.getAddressForStringOrDie([contractName]);
}

export const BLOCKS_PER_EPOCH = 17280n;
export function getEpochBlockNumber(epochNumber: bigint): bigint {
    return epochNumber * BLOCKS_PER_EPOCH;
}

export async function writeToJsonFile(fileName: string, data: any) {
    fs.writeFileSync(
        `./output/${fileName}.json`,
        JSON.stringify(
            data,
            (key, value) =>
                typeof value === "bigint" ? value.toString() : value,
            2
        )
    );
}

export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
