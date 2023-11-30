# Epoch distributions on Celo

This repo contains an explainer for Celo-specific epoch transactions and a demo for how to fetch
them given an epoch.

> **IMPORTANT** This repo is for educational purposes only. The information provided here may be
> inaccurate. Please don’t rely on it exclusively to implement low-level client libraries.

### Epochs

On Celo, an "epoch" is a period of time during which a set of validators are elected to produce
blocks.

$1 \text{ epoch} = 17280 \text{ blocks} = 1 \text{ day }$

Every epoch is exactly 17,280 blocks long or ~1 day, because
$17280 \text{ blocks per epoch} \times 5 \text{ seconds per block} = 86400 \text{ seconds per epoch } = 1 \text{ day}$.

### Epoch blocks

Every epoch, has an "epoch block", which is the last block of the epoch and contains:

-   "normal transactions" found in all blocks, and
-   **special** "epoch transactions", which are Celo-specific transactions described below.

You can (predictably) calculate an epoch block number as follows:

```ts
const BLOCKS_PER_EPOCH = 17280; // defined at blockchain-level
const epochNumber = 1296; // <-- your choice
const epochBlockNumber = epochNumber * BLOCKS_PER_EPOCH; // 22,394,880
```

### Epoch transactions

As described, every "epoch block" contains special Celo-specific transactions known as "epoch
transactions".

You can distinguish epoch transactions from normal transactions because epoch transactions set the
transaction hash equal to the block hash, whereas normal transactions do not:

-   `normalTx.transactionHash != normalTx.blockHash`
-   `epochTx.transactionHash == epochTx.blockHash`

> **NOTE** An epoch block contains _both_ "normal" transactions _and_ epoch transactions.

You can get epoch logs by fetching the logs of the entire epoch block (using the block hash or block
number), and filtering transactions whose block hash is equal to the transaction hash.

For example, epoch 1,307 will be included in block 22,584,960 ($= 1307 \times 17280$) and can be
fetched using the block number:

```sh
 $ curl https://forno.celo.org \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_getLogs","params":[{"fromBlock": "0x1589e80", "toBlock": "0x1589e80"}],"id":1,"jsonrpc":"2.0"}'
```

where "0x1589e80" is "22584960" in decimal, or using the block hash:

```sh
$ curl https://forno.celo.org \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_getLogs","params":[{"blockHash": "0xdd7a9b02f109f41e3ce710cb10ecca4a0f07e49f0f3d62e8c23d7792d6b1ca30"}],"id":1,"jsonrpc":"2.0"}'
```

For a TypeScript example, see [`rawEpochLogs.ts`](./rawEpochLogs.ts):

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
const decodedEvents = epochTransactions.filter((tx) => tx.transactionHash == tx.blockHash);
// ...
```

The example output is shown below and in [`./output/epoch1307.json`](./output/epoch1307.json):

```sh
$ yarn ts-node rawEpochLogs.ts

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

### Validator rewards

Validators are rewarded for producing blocks and, every epoch, the Celo blockchain distributes these
rewards to them in cUSD. Of those rewards, a part goes to the group they are part of in the form of
a "[commission][2]". You can learn more about [validator groups and why they exist][1].

The relevant event in the [`Validators.sol` smart contract][3] is:

```solidity
event ValidatorEpochPaymentDistributed(
  address indexed validator,
  uint256 validatorPayment,
  address indexed group,
  uint256 groupPayment
);
```

It shows the validator and group addresses, and the amount of cUSD distributed to each.

For an example, see [`validatorRewards.ts`](./validatorRewards.ts) which is a simple script that
fetches and calculates total validator and validator group rewards for a given epoch.

Example output:

```sh
$ yarn ts-node validatorRewards.ts

Total validator rewards: 4271.18813692596407949
Total validator group rewards: 6426.74597902813248148
For detailed logs, see: evt_ValidatorEpochPaymentDistributed.json
✨  Done in 1.70s.
```

[1]: https://docs.celo.org/protocol/pos/validator-groups#what-is-a-validator-group
[2]: https://docs.celo.org/protocol/pos/validator-groups#group-share
[3]:
    https://github.com/celo-org/celo-monorepo/blob/bfbec5720a5bf4f62b6eb1a6051dce8d0355b4a9/packages/protocol/contracts/governance/Validators.sol#L149

### Voter rewards (or "staking rewards")

### Total voter rewards

For a given epoch, total voter rewards can be calculated by summing the rewards distributed to every
validator group. This is because the Celo blockchain distributes rewards to validator groups, which
then distribute rewards to their voters.

The relevant event in the
[`Election.sol` smart contract](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/Election.sol#L145)
is:

```solidity
event EpochRewardsDistributedToVoters(address indexed group, uint256 value);
```

For an example, see [`totalVoterRewards.ts`](./totalVoterRewards.ts) which is a simple script that
fetches and calculates total voter rewards for a given epoch.

To ensure the script works as expected, you can compare the output with the total voter rewards
displayed on the Celo block explorer, for example in
[epoch 1,302](https://explorer.celo.org/mainnet/block/0xe78f9bd66c087207f36dd5b0ef30704c788e2589827b3e39bb8cfc2cb56613ec/epoch-transactions).

Example output:

```sh
$ yarn ts-node totalVoterRewards.ts

Total voter rewards: 27347.542717542173439382
✨  Done in 1.26s.
```

### Individual voter rewards

Unfortunately, there is no simple way to fetch individual voter rewards using event logs alone.
That's because voter rewards are distributed to individuals _implicitly_ (without logs), and instead
distributed to the group they vote for _explicitly_ (with `EpochRewardsDistributedToVoters` event).

The mental model is that:

-   individual voters vote for a validator group
-   if elected, the validator group produces blocks
-   all voter rewards are distributed at the validator group level (with _explicit_
    `EpochRewardsDistributedToVoters` events)
-   voters _implicitly_ receive voter rewards, because the number of voting CELO at the group level
    increased (by the rewards), but their voting share of the group hasn't changed
-   when voters decide to withdraw their CELO, they receive a number of CELO equal to their voting
    share of the group, which includes the rewards distributed to the group.

**Advantage**: voting CELO automatically compound without user intervention.

**Disadvantage**: individual voter rewards cannot be fetched using event logs alone (in the current
implementation)

Instead, individual voter rewards can be calculated by multiplying the voter's voting share of the
group by the rewards distributed to the group. That means, given an epoch, individual voter rewards
can only be calculated with knowledge of the voter's voting share of the group.

The voter's voting share of the group can be calculated as $ \text{voting share} =
\frac{\text{individual's votes}}{\text{total group votes}} $. That means a voter's voting share can
change _both_ because the individual's votes changed _and_ because the total group votes changed.

We can use the following events to calculate a voter's votes and the total group votes over time:

```solidity
event ValidatorGroupVoteActivated(
  address indexed account,
  address indexed group,
  uint256 value,
  uint256 units
);
event ValidatorGroupActiveVoteRevoked(
  address indexed account,
  address indexed group,
  uint256 value,
  uint256 units
);
```

Given an epoch, [all activate votes (that were not revoked during the epoch) are eligible for
rewards][4]. The simplest way to identify eligible voters is to count active votes at the end of an
epoch, that means at the epoch block.

> **NOTE** This section is incomplete:
> TODO:
> -   [ ] Check: Is that at the epoch block or epoch block - 1?

Using logs alone, active votes can only be calculated by fetching activation
(`ValidatorGroupVoteActivated`) and revocation (`ValidatorGroupActiveVoteRevoked`) events from
genesis (block 0) to the epoch of interest.

> **NOTE**:
> Writing a script to calculate active votes is non-trivial. As a first step, this explainer uses 
> an indexed data providers like dune.com to calculate active votes.

[4]: https://docs.celo.org/protocol/pos/locked-gold

### Community fund distributions

The Celo blockchain makes distributions to the community fund every epoch.

The Celo blockchain makes distributions to the community fund every epoch.

For an example, see [`communityFundDistributions.ts`](./communityFundDistributions.ts) which is a
simple script that fetches and calculates community fund distributions for a given epoch.

To ensure the script works as expected, you can compare the output with the community fund
distributions displayed on the Celo block explorer, for example in
[epoch 1,307](https://explorer.celo.org/mainnet/block/0xdd7a9b02f109f41e3ce710cb10ecca4a0f07e49f0f3d62e8c23d7792d6b1ca30/epoch-transactions).

```sh
$ yarn ts-node communityFundDistributions.ts

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
$ yarn ts-node carbonOffsetDistributions.ts

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

> **NOTE** This section is incomplete:
>
> -   [ ] The script is not tested on epochs where reserve bolster distributions were made, it's
>         possible the `logIndex` needs to be used in that case.

### Mento reserve distributions (⚠️ deprecated)

> **NOTE** This section is incomplete:
>
> -   [ ] Add context and explainer
> -   [ ] Add code example to fetch reserve bolster distributions for a given epoch

In the past, the Celo blockchain also made _ad-hoc_ distributions to the Mento reserve whenever the
reserve was "low". This is no longer the case since
[CIP-54: Community rewards go to reserve if undercollaterized](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0054.md)
was implemented in the
[Gingerbread hard fork](https://github.com/celo-org/celo-proposals/blob/8260b49b2ec9a87ded6727fec7d9104586eb0752/CIPs/cip-0062.md#specification) on [Sep 26, 2023](https://forum.celo.org/t/mainnet-alfajores-gingerbread-hard-fork-release-sep-26-17-00-utc/6499),
which removed the

## Usage

> **WARNING** The demos are work in progress and may not work as expected at the moment.

### Requirements

-   Node.js v18.14.2

### Demo

```sh
yarn
yarn ts-node <file_name.ts> # e.g. yarn ts-node totalVoterRewards.ts
```
