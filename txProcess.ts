import { getActiveTrades } from "./db/dbHandler";
import { swapTokenToEth } from "./uniswap/v2SwapSell";

async function sellProcess() {
    let pendingTrades = await getActiveTrades(120);
    console.log(pendingTrades);
    // pendingTrades = pendingTrades.slice(0,1)
    if (pendingTrades.length > 0) {
        pendingTrades.forEach(async (trade: any) => {
            // swapTokenToEth(trade.token, trade.quantity);
        });
    }
}


setInterval(sellProcess, 15000);