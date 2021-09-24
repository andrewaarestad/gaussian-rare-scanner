# gaussian-rare-scanner

Scans for rare NFTs from [The Gaussian Protocol](https://opensea.io/collection/the-gaussian-protocol).

The Gaussian Protocol is a collection of 8888 NFTs that generated 8 random numbers at mint time, distributed on ~N(10,4).  In other words, NFTs with 1, 2, 18, 19 would be very rare.

The seed for each NFT was constructed from three pieces of information:
* the NFT ID being minted (1-8888)
* the minter's address
* the current block number.  

As all of these can be simulated ahead of time, we can scan the space of possible combinations to find rares.

## Usage

1. Edit rare-scanner.js and change the address and target block number to your desired setting
2. `yarn`
3. `yarn start`

## Notes

This script runs by firing up a configurable number of worker processes, each of which uses hardhat to deploy the contract to hardhat network and invoke the test function on it.  You can dial the concurrency up or down in rare-scanner.js.  This is probably horribly inefficient but I'm new to Solidity...

The script will output to console and to a log.txt file so you can go back and check your results.
