import dotenv from 'dotenv';
dotenv.config();
import Web3 from "web3";
// @ts-ignore
export const uniV2RouterAddress = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";
export const uniV2FactoryAddress = "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6";
// export const universalRouterAddress = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD";
export const factoryABI = require("../abis/IFactory.json");
export const uniV2PairABI = require("../abis/IUniV2Pair.json");
// export const universalRouterABI = require("../abis/IUniversalRouter.json");
export const tokenABI = require("../abis/ITokenContract.json");
export const routerABI = require("../abis/IRouter.json");
import { AbiItem } from 'web3-utils';

let acc, pk;
// Set the account address derived from the private key



const alchemyAPI = 'wss://base-mainnet.g.alchemy.com/v2/t7WzB4AP45qp0mr2bma3NlPMc0iDKpVq';
const chainstackAPI = 'wss://base-mainnet.core.chainstack.com/ws/f94e74ea8cff07bc987cc140d9e0dedf';
// export const provider = new Web3.providers.WebsocketProvider(alchemyAPI);
export const web3 = new Web3(new Web3.providers.WebsocketProvider(chainstackAPI));
export const provider = new Web3.providers.HttpProvider('https://base-mainnet.core.chainstack.com/f94e74ea8cff07bc987cc140d9e0dedf');


if (process.env.PRIVATE_KEY) {
    pk = process.env.PRIVATE_KEY;
    acc = web3.eth.accounts.privateKeyToAccount(pk);
    // console.log(acc.address);
    
} else {
    console.error('KEY not found in environment variables.');
}
export const privateKey = pk;
export const account = acc;
export const uniV2RouterContract = new web3.eth.Contract(routerABI as AbiItem[], uniV2RouterAddress); 
export const uniV2FactoryContract = new web3.eth.Contract(factoryABI as AbiItem[], uniV2FactoryAddress);
// export const universalRouterContract = new web3.eth.Contract(universalRouterABI as AbiItem[], universalRouterAddress);
export const WETH = '0x4200000000000000000000000000000000000006';
export const toAccount = "0x6F771127cfBF96c6E29eb587eEadE967222459F7";
export const permitAccount = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
export const maxTokenForApproval = '1157920892373161954235709850086879078532699846656405';

