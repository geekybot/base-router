
import { web3,universalRouterAddress } from "../uniswap/config.ts";
import { AbiItem } from 'web3-utils';


export async function encodePermit(token: string, amount: string) {

    const deadline = Math.floor(Date.now() / 1000) + 60 * 24 * 365; // one year from now
    let encodedP = web3.eth.abi.encodeFunctionCall({
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "address", "name": "spender", "type": "address" },
            { "internalType": "uint160", "name": "amount", "type": "uint160" },
            { "internalType": "uint48", "name": "expiration", "type": "uint48" }
        ],
        "name": "approve",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    } as AbiItem, [token, universalRouterAddress, amount, deadline.toString()]);
    // console.log(encodedP);
    return encodedP;
}



export async function encodeV3Swap(minamountIn: string, toAccount: string, path: any) {
    const deadline = Math.floor(Date.now() / 1000) + 60 * 24 * 365; // one year from now
    let encodedP = web3.eth.abi.encodeFunctionCall({
        "inputs": [
          { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
          { "internalType": "address[]", "name": "path", "type": "address[]" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactETHForTokens",
        "outputs": [
          { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "stateMutability": "payable",
        "type": "function"
      } as AbiItem, [minamountIn, path, toAccount, deadline.toString()]);
    // console.log(encodedP);
    return encodedP;
}
export async function wrapETH(amount: string) {
    let encodedP = web3.eth.abi.encodeFunctionCall({
        "constant": false,
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    } as AbiItem, []);
    // console.log(encodedP);
    return encodedP;
}
async function unWrapETH() {

}
// encodePermit("0x000000000022D473030F116dDEE9F6B43aC78BA3", '12345677812340000000000000000');
wrapETH('15000000000000000')