
import { WETH, toAccount, uniV2PairABI, uniV2RouterAddress, uniV2RouterContract, web3, account, privateKey, tokenABI } from "./config.ts";
import { AbiItem } from 'web3-utils';
import { addNewTrade, updateTradeCollectionActiveStatus } from '../db/dbHandler.ts';
import { parse } from "../helper/parseReceipt.ts";



export async function swapTokenToEth(ercToken: any, quantity: string, gasPrice: number) {
    try {
        const path = [ercToken, WETH];// Minimum amount of output tokens you want to receive (in Wei)
        const amounts = await uniV2RouterContract.methods.getAmountsOut(
            web3.utils.toBN(quantity).toString(),
            path).call()
        // console.log(amounts);
        const amountOutMin = web3.utils.toBN(amounts[1]).mul(web3.utils.toBN(95)).div(web3.utils.toBN(100)).toString();
        // console.log(amountOutMin);
        const deadline = Math.floor(Date.now() / 1000) + 60 * 5; // 5 minutes from now
        const tokenContract = new web3.eth.Contract(tokenABI as AbiItem[], ercToken);
        const allowance = await tokenContract.methods.allowance(account.address, uniV2RouterAddress).call();
        console.log(allowance);

        if (web3.utils.toBN(allowance).gte(web3.utils.toBN(quantity))) {
            console.log("token already approved for trading, now calling sendswapsell");
            sendSwapSell(amountOutMin, quantity, path, deadline, gasPrice);
            return;
        }
        else {
            await approveToken(ercToken);
            console.log("token approved for trading, now calling sendswapsell");
            sendSwapSell(amountOutMin, quantity, path, deadline, gasPrice);
        }


    } catch (error) {
        console.log("catches here replacement transaction");

        console.log(error);

    }
}


async function sendSwapSell(amountOutMin, quantity, path, deadline, gasPrice: number) {
    console.log("received request on swapSell");

    const encodedABI = uniV2RouterContract.methods.swapExactTokensForETH(
        web3.utils.toBN(quantity).toString(),
        amountOutMin,
        path,
        toAccount,
        deadline
    ).encodeABI();

    // Create transaction object
    const txObject = {
        from: account.address,
        to: uniV2RouterAddress,
        gas: 300000, // Gas limit
        // gasPrice: web3.utils.toWei(gasPrice.toString(), 'gwei'),
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
                    console.log('Receipt of sale:');
                    if (receipt.status) {
                        let amounts = await parse(JSON.stringify(receipt));
                        console.log(amounts);
                        if (amounts) {
                            updateTradeCollectionActiveStatus(path[0], "BUY", false);
                            addNewTrade(path[0], "SELL", amounts[1], amounts[2], false, 18, "");
                        }
                    }
                    else {
                        console.log("transaction failed");
                        console.log(receipt);
                    }

                })
                .on('error', function (error) {
                    if (error.message.includes("replacement transaction underpriced")) {
                        // console.log("trying with more gas price: ", 1.2*gasPrice);
                        
                        // sendSwapSell(amountOutMin, quantity, path, deadline, (1.2 * gasPrice));
                    }
                    else {
                        console.error('Error starts here:', error);
                        updateTradeCollectionActiveStatus(path[0], "BUY", false);
                        console.log("end error here");
                    }

                });
        })
        .catch(error => {
            console.error('Error signing transaction:', error);
        });
}

export async function approveToken(ercToken: string) {
    const tokenContract = new web3.eth.Contract(tokenABI as AbiItem[], ercToken);
    
    const encodeTokenABI = tokenContract.methods.approve(uniV2RouterAddress, web3.utils.toBN("115792089237316195423570985008687907853269984665640564039457584007913129639935").toString()).encodeABI();
    const txTokenObject = {
        from: account.address,
        to: ercToken,
        gas: 50000, // Gas limit
        // gasPrice: web3.utils.toWei('1', 'gwei'),
        data: encodeTokenABI,
    };
    web3.eth.accounts.signTransaction(txTokenObject, privateKey)
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
                    console.log('Receipt: token approved for trading');
                })
                .on('error', function (error) {
                    console.error('Error:', error);

                });
        })
        .catch(error => {
            console.error('Error signing transaction:', error);
        });
}

