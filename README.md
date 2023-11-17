# Epoch distributions on Celo

> **WARNING**
> This repo is work in progress and may not work as expected at the moment.

This repo contains an explainer on epoch distributions made on Celo and a demo to fetch distribution
data for a given epoch.

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

Every epoch, has what's known as an "epoch block", which is defined as follows:

-   it's the last block of an epoch,
-   it contains "normal" transactions (as usual in every blocks)
-   it contains "epoch" transactions, which are special Celo-specific transactions described below.

You can calculate the block number of a given epoch block as follows:

```ts
const BLOCKS_PER_EPOCH = 17280; // defined in blockchain parameters
const epochNumber = 1296; // epoch number of your choice
const epochBlockNumber = epochNumber * BLOCKS_PER_EPOCH;
//    ^22,394,880        ^1,296        ^17,280
```

You can fetch the logs of epoch transactions by fetching the logs of an epoch block.
For example, using the `viem` client library:

```ts
// Getting the block hash of an epoch block
const epochBlock = await publicClient.getBlock({
    blockNumber: epochBlockNumber, // 22,394,880n
});

// Getting logs of the epock block using the block hash
const epochTransactions = await publicClient.getLogs({
    blockHash: epochBlock.hash,
});
```

> **NOTE**
> The logs contain _both_ "normal" transactions _and_ epoch transactions.

### Epoch transactions

As described, every epoch block contains Celo-specific transactions known as "epoch transactions".

High-level epoch transactions can grouped as follows:

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

> **NOTE**
> This section is incomplete:
>
> -   [ ] Add context and explainer
> -   [ ] Add code example to fetch voting rewards for a given epoch

### Carbon offset distributions

> **NOTE**
> This section is incomplete:
>
> -   [ ] Add context and explainer
> -   [ ] Add code example to fetch voting rewards for a given epoch

The Celo blockchain makes distributions to the carbon offset fund every epoch.

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

-   Node.js

### Demo

```sh
yarn
yarn ts-node viem.ts
```
