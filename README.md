# Epoch distributions on Celo

This repo contains an explainer on epoch distributions made on Celo and a demo to fetch distribution 
data for a given epoch.

> **IMPORTANT**
> This repo is for educational purposes only. The information provided here may be inaccurate. 
> Please don’t rely on it exclusively to implement low-level client libraries.

### Summary

On Celo, an "epoch" is a period of time during which a set of validators are elected to produce 
blocks. Every epoch is exactly 17,280 blocks or ~1 day long since a block is produced every 
5 seconds and there are 86,400 seconds in a day:

$5 \text{ seconds per block} \times 17280 \text{ blocks per epoch} = 86400 \text{ seconds per epoch } (= 1 \text{ day})$

Every epoch, the Celo blockchain makes a distributions knows as "epoch distributions".
These are: 

-   Validator rewards
-   Validator group rewards
-   Voting rewards
-   Community fund distributions
-   Carbon offset distributions
-   Mento reserve distributions (deprecated, since block `21616000`)

### Validator rewards

Validators are rewarded for producing blocks.

Todo: 

- [ ] Add context and explainer
- [ ] Add code example to fetch validator rewards for a given epoch

### Voting rewards ("staking rewards")

Todo: 

- [ ] Add context and explainer
- [ ] Add code example to fetch voting rewards for a given epoch

### Community fund distributions

The Celo blockchain makes distributions to the community fund every epoch.

Todo: 

- [ ] Add context and explainer
- [ ] Add code example to fetch voting rewards for a given epoch


### Carbon offset distributions

Todo: 

- [ ] Add context and explainer
- [ ] Add code example to fetch voting rewards for a given epoch

The Celo blockchain makes distributions to the carbon offset fund every epoch.

### Mento reserve distributions (⚠️ deprecated)

In the past, the Celo blockchain also made _ad-hoc_ distributions to the Mento reserve whenever 
the reserve was "low". This is no longer the case since 
[CIP-54: Community rewards go to reserve if undercollaterized](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0054.md) 
was implemented in the 
[Gingerbread hard fork](https://github.com/celo-org/celo-proposals/blob/8260b49b2ec9a87ded6727fec7d9104586eb0752/CIPs/cip-0062.md#specification) on [Sep 26, 2023](https://forum.celo.org/t/mainnet-alfajores-gingerbread-hard-fork-release-sep-26-17-00-utc/6499), which removed the 


## Usage

> **WARNING**
> The demos are work in progress and may not work as expected at the moment.

### Requirements

- Node.js

### Demo

```sh
yarn
yarn ts-node viem.ts
```