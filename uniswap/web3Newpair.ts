import {
    uniV2PairABI,
    uniV2FactoryContract,
    web3

} from "./config.ts";
import { AbiItem } from 'web3-utils';
import { swapETHToToken } from './v2SwapBuy.ts';

async function watchNewPairs() {
    uniV2FactoryContract.events.PairCreated({}, function (error, result) {
        if (!error) {
            console.log("connected");
        }
    }).on("connected", function (subscriptionId) {
        console.log(subscriptionId);
    }).on('data', function (event) {
        console.log("swap event");
        handleNewPair(event);
    }).on('changed', function (event) {
        console.log("changed");
    })

}
async function handleNewPair(log: any) {
    // console.log(log.returnValues);  //token0, token1, pair
    let pairContract = new web3.eth.Contract(uniV2PairABI as AbiItem[], log.returnValues.pair);
    let poolDetails = await getPoolDetails(pairContract, log.returnValues.token0, log.returnValues.token1);
    poolDetails["pair"] = log.returnValues.pair;
    
    if (!poolDetails.status) {
        console.log(poolDetails);
        console.log("https://dexscreener.com/base/" + poolDetails.ercToken);
        return;
    }
    if (poolDetails.ethAmount / 10**18 >= 0.5) {
        poolDetails.ethAmount = poolDetails.ethAmount / 10**18;
        console.log(poolDetails);
        console.log("https://dexscreener.com/base/" + poolDetails.ercToken);
        swapETHToToken(poolDetails, 1);
    }
}

async function getPoolDetails(pairContract, token0, token1) {
    try {
        const reserves = await pairContract.methods.getReserves().call();
        // console.log(reserves);  // reserv0, reserve1
        let ethAmount = 0;
        let ercToken = "";
        let tokenAmount = 0;
        if (token0 === "0x4200000000000000000000000000000000000006") {
            ethAmount = reserves._reserve0;
            ercToken = token1;
            tokenAmount = reserves._reserve1;
        }
        const tokenContract = new web3.eth.Contract(uniV2PairABI as AbiItem[], ercToken);
        const decimals = await tokenContract.methods.decimals().call();
        return {
            ethAmount,
            tokenAmount,
            ercToken,
            decimals,
            status: true
        }
    } catch (error) {
        console.error(error);
        return {
            ethAmount: 0,
            tokenAmount: 0,
            ercToken: "",
            decimals: 0,
            status: false
        }
    }
}

watchNewPairs();