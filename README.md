# Epoch distributions on Celo

This repo contains an explainer for Celo-specific epoch transactions and a demo for how to 
fetch them given an epoch.

> **IMPORTANT**
> This repo is for educational purposes only. The information provided here may be inaccurate.
> Please don’t rely on it exclusively to implement low-level client libraries.

### Epochs

On Celo, an "epoch" is a period of time during which a set of validators are elected to produce
blocks.

$1 \text{ epoch} = 17280 \text{ blocks} = 1 \text{ day }$

Every epoch is exactly 17,280 blocks long or ~1 day, because
$17280 \text{ blocks per epoch} \times 5 \text{ seconds per block} = 86400 \text{ seconds per epoch } = 1 \text{ day}$.

### Epoch blocks

Every epoch, has an "epoch block", which is the last block of the epoch and contains:

-   "normal transactions" found in all blocks, and
-   **special** "epoch transactions", which are Celo-specific transactions described
    below.

You can (deterministically) calculate an epoch block number as follows:

```ts
const BLOCKS_PER_EPOCH = 17280; // defined at blockchain-level
const epochNumber = 1296; // <-- your choice
const epochBlockNumber = epochNumber * BLOCKS_PER_EPOCH; // 22,394,880
```

### Epoch transactions

As described, every "epoch block" contains special Celo-specific transactions known as 
"epoch transactions".

You can distinguish epoch transactions from normal transactions because epoch transactions 
set the transaction hash equal to the block hash, whereas normal transactions do not:

- `normalTx.transactionHash != normalTx.blockHash`
- `epochTx.transactionHash == epochTx.blockHash`

> **NOTE**
> An epoch block contains _both_ "normal" transactions _and_ epoch transactions.

You can get epoch logs by fetching the logs of the entire epoch block (using the block hash),
and filtering transactions whose block hash is equal to the transaction hash. 

For an example, see [`rawEpochLogs.ts`](./rawEpochLogs.ts):

```ts
// fetches epoch block hash
const { hash } = await publicClient.getBlock({
    blockNumber: getEpochBlockNumber(epochNumber),
});

// fetches block transactions
const epochTransactions = await publicClient.getLogs({
    blockHash: hash,
});

// filters out transactions that are not epoch logs
const decodedEvents = epochTransactions
    .filter((tx) => tx.transactionHash == tx.blockHash)
    // ...
```

The example output is shown below and in [`./output/epoch1307.json`](./output/epoch1307.json):

```sh
~/Documents/celo-org/epochs main $ yarn ts-node rawEpochLogs.ts
yarn run v1.22.19
$ /Users/arthur/Documents/celo-org/epochs/node_modules/.bin/ts-node rawEpochLogs.ts
Summary: {
  'Epoch number': 1307n,
  'Epoch transactions': 447,
  'Distinct events': 6
} 

Contract: EpochRewards 
 Event: "TargetVotingYieldUpdated" 
 Count: 1 events 


Contract: Validators 
 Event: "ValidatorScoreUpdated" 
 Count: 110 events 


Contract: Celo Dollar (cUSD) 
 Event: "Transfer" 
 Count: 148 events 


Contract: Validators 
 Event: "ValidatorEpochPaymentDistributed" 
 Count: 110 events 


Contract: Celo native asset (CELO) 
 Event: "Transfer" 
 Count: 4 events 


Contract: Election 
 Event: "EpochRewardsDistributedToVoters" 
 Count: 65 events 


For detailed logs, see: ./output/epoch1307.json
✨  Done in 1.80s.
```



### More details on epoch transactions

At a high-level epoch transactions can grouped as follows:

1.  Validator and validator group rewards
1.  Voter rewards
1.  Community fund distributions
1.  Carbon offset distributions
1.  Mento reserve distributions (deprecated, since block `21616000`)

Their purpose and how to fetch their logs is described below.

### Validator and validator group rewards

Validators are rewarded for producing blocks.

> **NOTE**
> This section is incomplete:
>
> -   [ ] Add context and explainer
> -   [ ] Add code example to fetch validator rewards for a given epoch

### Voter rewards (or "staking rewards")

### Total voter rewards

For a given epoch, total voter rewards can be calculated by summing the rewards distributed to
every validator group. This is because the Celo blockchain distributes rewards to validator groups,
which then distribute rewards to their voters.

The relevant event in the [`Election.sol` smart contract](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/Election.sol#L145) is:

```solidity
event EpochRewardsDistributedToVoters(address indexed group, uint256 value);
```

For an example, see [`totalVoterRewards.ts`](./totalVoterRewards.ts) which is a simple script
that fetches and calculates total voter rewards for a given epoch.

To ensure the script works as expected, you can compare the output with the total voter rewards
displayed on the Celo block explorer, for example in
[epoch 1,302](https://explorer.celo.org/mainnet/block/0xe78f9bd66c087207f36dd5b0ef30704c788e2589827b3e39bb8cfc2cb56613ec/epoch-transactions).

Example output:

```sh
$ yarn ts-node totalVoterRewards.ts
yarn run v1.22.19
$ /Users/arthur/Documents/0xarthurxyz/epochrewards/node_modules/.bin/ts-node totalVoterRewards.ts
Total voter rewards: 27347.542717542173439382
✨  Done in 1.26s.
```

### Individual voter rewards

> **NOTE**
> This section is incomplete:
>
> -   [ ] Add context and explainer
> -   [ ] Add code example to fetch voting rewards for a given epoch

Voting rewards are implemented as follows:

1.  Zero address transfers CELO to the validator group
2.  The stake of every voter for the validator group is increased by their voting weight (double-check this is correct)

For example, voter
[`0xbD5CAC...`](https://explorer.celo.org/mainnet/address/0xbD5CAC2afCC30D2c32e7A1AfdFa85E5F6bB22F98/epoch-transactions) votes for [`0x81383e...`](https://explorer.celo.org/mainnet/address/0x81383e7C8801B102f742f4F5a5faD06867212b05).

```sol
getTotalVotesForGroupByAccount
```

Votes can be fetched given a voter address and a validator group address.
Unfortunately, there is no simple way to fetch all voter addresses for a given validator group.
Instead the set of voters must be constructed by filtering voting events from genesis to today.

The following voting events are emitted:

```solidity
event ValidatorGroupVoteCast(address indexed account, address indexed group, uint256 value);
event ValidatorGroupVoteActivated(
    address indexed account,
    address indexed group,
    uint256 value,
    uint256 units
);
event ValidatorGroupPendingVoteRevoked(
    address indexed account,
    address indexed group,
    uint256 value
);
event ValidatorGroupActiveVoteRevoked(
    address indexed account,
    address indexed group,
    uint256 value,
    uint256 units
);
```

### Community fund distributions

The Celo blockchain makes distributions to the community fund every epoch.

The Celo blockchain makes distributions to the community fund every epoch.

For an example, see [`communityFundDistributions.ts`](./communityFundDistributions.ts) which is a
simple script that fetches and calculates community fund distributions for a given epoch.

To ensure the script works as expected, you can compare the output with the community fund
distributions displayed on the Celo block explorer, for example in 
[epoch 1,307](https://explorer.celo.org/mainnet/block/0xdd7a9b02f109f41e3ce710cb10ecca4a0f07e49f0f3d62e8c23d7792d6b1ca30/epoch-transactions).

```sh
~/Documents/celo-org/epochs main $ yarn ts-node communityFundDistributions.ts 
yarn run v1.22.19
$ /Users/arthur/Documents/celo-org/epochs/node_modules/.bin/ts-node communityFundDistributions.ts
Summary: {
  epoch: 1307n,
  name: 'Community Fund Distribution',
  value: '16918.363034787685412848 CELO',
  to: '0xd533ca259b330c7a88f74e000a3faea2d63b7972'
} 

Detail(s): [
  {
    address: '0x471ece3750da237f93b8e339c536989b8978a438',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x000000000000000000000000d533ca259b330c7a88f74e000a3faea2d63b7972'
    ],
    data: '0x0000000000000000000000000000000000000000000003952573c6cf73b12ff0',
    blockNumber: 22584960n,
    transactionHash: '0xdd7a9b02f109f41e3ce710cb10ecca4a0f07e49f0f3d62e8c23d7792d6b1ca30',
    transactionIndex: 7,
    blockHash: '0xdd7a9b02f109f41e3ce710cb10ecca4a0f07e49f0f3d62e8c23d7792d6b1ca30',
    logIndex: 379,
    removed: false,
    args: {
      from: '0x0000000000000000000000000000000000000000',
      to: '0xD533Ca259b330c7A88f74E000a3FaEa2d63B7972',
      value: 16918363034787685412848n
    },
    eventName: 'Transfer'
  }
] 

✨  Done in 1.60s.
```


### Carbon offset distributions

The Celo blockchain makes distributions to the carbon offset fund every epoch.

For an example, see [`carbonOffsetDistributions.ts`](./carbonOffsetDistributions.ts) which is a
simple script that fetches and calculates carbon offset distributions for a given epoch.

To ensure the script works as expected, you can compare the output with the carbon offset
distributions displayed on the Celo block explorer, for example in
[epoch 1,307](https://explorer.celo.org/mainnet/block/0xdd7a9b02f109f41e3ce710cb10ecca4a0f07e49f0f3d62e8c23d7792d6b1ca30/epoch-transactions).

```sh
~/Documents/celo-org/epochs main $ yarn ts-node carbonOffsetDistributions.ts
yarn run v1.22.19
$ /Users/arthur/Documents/celo-org/epochs/node_modules/.bin/ts-node carbonOffsetDistributions.ts
Summary: {
  epoch: 1307n,
  name: 'Carbon Offset Distribution',
  value: '67.673452139150741651 CELO',
  to: '0xCe10d577295d34782815919843a3a4ef70Dc33ce'
}

Detail(s): [
  {
    address: '0x471ece3750da237f93b8e339c536989b8978a438',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x000000000000000000000000ce10d577295d34782815919843a3a4ef70dc33ce'
    ],
    data: '0x000000000000000000000000000000000000000000000003ab28662bd67a9093',
    blockNumber: 22584960n,
    transactionHash: '0xdd7a9b02f109f41e3ce710cb10ecca4a0f07e49f0f3d62e8c23d7792d6b1ca30',
    transactionIndex: 7,
    blockHash: '0xdd7a9b02f109f41e3ce710cb10ecca4a0f07e49f0f3d62e8c23d7792d6b1ca30',
    logIndex: 446,
    removed: false,
    args: {
      from: '0x0000000000000000000000000000000000000000',
      to: '0xCe10d577295d34782815919843a3a4ef70Dc33ce',
      value: 67673452139150741651n
    },
    eventName: 'Transfer'
  }
]

✨  Done in 1.61s.
```

> **NOTE**
> This section is incomplete:
>
> - [ ] The script is not tested on epochs where reserve bolster distributions were made,
>       it's possible the `logIndex` needs to be used in that case.

### Mento reserve distributions (⚠️ deprecated)

> **NOTE**
> This section is incomplete:
>
> -   [ ] Add context and explainer
> -   [ ] Add code example to fetch reserve bolster distributions for a given epoch

In the past, the Celo blockchain also made _ad-hoc_ distributions to the Mento reserve whenever
the reserve was "low". This is no longer the case since
[CIP-54: Community rewards go to reserve if undercollaterized](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0054.md)
was implemented in the
[Gingerbread hard fork](https://github.com/celo-org/celo-proposals/blob/8260b49b2ec9a87ded6727fec7d9104586eb0752/CIPs/cip-0062.md#specification) on [Sep 26, 2023](https://forum.celo.org/t/mainnet-alfajores-gingerbread-hard-fork-release-sep-26-17-00-utc/6499), which removed the

## Usage

> **WARNING**
> The demos are work in progress and may not work as expected at the moment.

### Requirements

-   Node.js v18.14.2

### Demo

```sh
yarn
yarn ts-node <file_name.ts> # e.g. yarn ts-node totalVoterRewards.ts
```
