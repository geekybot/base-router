
import { WETH, toAccount, uniV2PairABI, uniV2RouterAddress, uniV2RouterContract, web3, account, privateKey, tokenABI } from "./config.ts";
import { AbiItem } from 'web3-utils';
import { addNewTrade } from '../db/dbHandler.ts';

import { approveToken, swapTokenToEth } from "./v2SwapSell.ts";
import { parse } from "../helper/parseReceipt.ts";
import { encodeV3Swap, wrapETH } from "../helper/abiEncoder.ts";
// Create a web3 instance




export async function swapETHToToken(poolDetails: any, gasPrice: number) {
    try {
        const path = [WETH, poolDetails.ercToken];// Minimum amount of output tokens you want to receive (in Wei)
        const amounts = await uniV2RouterContract.methods.getAmountsOut(
            web3.utils.toBN(0.0001 * (10 ** 18)).toString(),
            path).call()
        // console.log(amounts);

        const amountOutMin = web3.utils.toBN(amounts[1]).mul(web3.utils.toBN(95)).div(web3.utils.toBN(100)).toString();
        // console.log(amountOutMin);
        const deadline = Math.floor(Date.now() / 1000) + 60 * 5; // 5 minutes from now

        const encodedABI = await uniV2RouterContract.methods.swapExactETHForTokens(amountOutMin, path, toAccount, deadline).encodeABI();

        // Create transaction object
        const txObject = {
            from: account.address,
            to: uniV2RouterAddress,
            value: web3.utils.toWei('0.0001', 'ether'), // Amount of ETH to swap (in Wei)
            gas: 300000, // Gas limit
            // gasPrice: web3.utils.toWei('3', 'gwei'), // Gas price
            data: encodedABI,
        };

        // Sign the transaction
        web3.eth.accounts.signTransaction(txObject, privateKey)
            .then(signedTx => {
                // Send the signed transaction
                if (!signedTx.rawTransaction) {
                    return;
                }
                web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .on('transactionHash', function (hash) {
                        // console.log('Transaction Hash:', hash);
                        console.log("https://basescan.org/tx/" + hash);
                    })
                    .on('receipt', async function (receipt) {
                        console.log('Receipt:');
                        // console.log(JSON.stringify(receipt));
                        const amounts = await parse(JSON.stringify(receipt));
                        if (amounts) {
                            // console.log(amounts);
                            
                            addNewTrade(poolDetails.ercToken, "BUY", amounts[3], amounts[0], true, poolDetails.decimals, poolDetails.pair);
                            // approveToken(poolDetails.ercToken);
                        }

                    })
                    .on('error', function (error) {
                        console.log(error.message);
                        if(error.message.includes("replacement transaction underpriced")){
                            console.log("trying with more gas price: ", 1.2*gasPrice);
                            // swapETHToToken(poolDetails, (1.2 * gasPrice ));
                        }
                        console.error('Error:', error);
                    });
            })
            .catch(error => {
                console.error('Error signing transaction:', error);
            });
    } catch (error) {
        console.log(error);

    }
}



swapETHToToken({
    ethAmount: 0.69,
    tokenAmount: '69000000000000000000000000000',
    ercToken: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
    decimals: '18',
    status: true,
    pair: '0xc9034c3E7F58003E6ae0C8438e7c8f4598d5ACAA'
}, 1)

//   0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000003d3026340f75b450000000000000000000000000000000000000000000008ca51ae99d8174bfe7200000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002b420000000000000000000000000000000000000600271067a693e526e1014382d3a52549ee576c04698374000000000000000000000000000000000000000000
//   0x7ff36ab50000000000000000000000000000000000000000000781d51f9ea4d2e4d9223700000000000000000000000000000000000000000000000000000000000000800000000000000000000000006f771127cfbf96c6e29eb587eeade967222459f700000000000000000000000000000000000000000000000000000000660ad76800000000000000000000000000000000000000000000000000000000000000020000000000000000000000004200000000000000000000000000000000000006000000000000000000000000b982f60d6f600e358a223046b1ea303f7b42a449
//0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000354a6ba7a18000