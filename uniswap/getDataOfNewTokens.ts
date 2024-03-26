
import { WETH, toAccount, uniV2PairABI,uniV2FactoryContract,  uniV2RouterAddress, uniV2RouterContract, web3, account, privateKey, tokenABI } from "./config.ts";
import { AbiItem } from 'web3-utils';
import { addNewTrade } from '../db/dbHandler.ts';

import { approveToken, swapTokenToEth } from "./v2SwapSell.ts";
import { parse } from "../helper/parseReceipt.ts";
import { encodeV3Swap, wrapETH } from "../helper/abiEncoder.ts";
import { addNewToken, getTokensLastUpdated60SecondsAgo, insertNewPrice } from "../db/scrappingDB.ts";
// Create a web3 instance

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
    let price = await getPriceData(poolDetails.ercToken, poolDetails.decimals);
    if (!price) {
        console.log("Price not found");
        return;
    }
    addNewToken(poolDetails.ercToken, log.returnValues.pair, price.toString(), poolDetails.decimals);
    if (!poolDetails.status) {
        console.log(poolDetails);
        return;
    }
    if (poolDetails.ethAmount / 10**18 >= 0.5) {
        poolDetails.ethAmount = poolDetails.ethAmount / 10**18;
        console.log(poolDetails);
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


export async function getPriceData(ercToken: any, decimal: number) {
    try {
        const path = [WETH, ercToken];// Minimum amount of output tokens you want to receive (in Wei)
        const amounts = await uniV2RouterContract.methods.getAmountsOut(
            web3.utils.toBN(0.001 * (10 ** 18)).toString(),
            path).call()
        console.log(amounts);
        let price = (amounts[0] * 10**18/ (amounts[1] *10**decimal));
        return price;
    } catch (error) {
        return;
    }
}


async function updatePriceEveryFiveMinutes() {
    console.log("started priceupdater");
    
    let tokens = await getTokensLastUpdated60SecondsAgo();
    // console.log(tokens);
    
    if (tokens.length === 0) {
        return;
    }
    tokens.forEach(async (token: any) => {
        let price = await getPriceData(token.token, token.decimals);
        console.log("price: ",price);
        
        if (price) {
            insertNewPrice(token.token,price.toString());
            return;
        }
    })
}


function main(){
    watchNewPairs();
    setInterval(updatePriceEveryFiveMinutes, 30000);
}
main();