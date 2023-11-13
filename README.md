# Epoch distributions on Celo

This repo contains an explainer on epoch distributions made on Celo and a demo to fetch distribution 
data for a given epoch.

> **IMPORTANT**
> This repo is for educational purposes only. The information provided here may be inaccurate. 
> Please don’t rely on it exclusively to implement low-level client libraries.

On Celo, an "epoch" is a period of time during which a set of validators are elected to produce 
blocks. Every epoch is exactly 17,280 blocks or ~1 day long since a block is produced every 
5 seconds and there are 86,400 seconds in a day:

$5 \text{ seconds per block} \times 17280 \text{ blocks per epoch} = 86400 \text{ seconds per epoch } (= 1 \text{ day})$



## Usage

> **WARNING**
> Currently the prototype doesn't work. 

### Requirements

- Node.js

### Demo

```sh
yarn
yarn ts-node viem.ts
```