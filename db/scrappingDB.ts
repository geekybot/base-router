import { MongoDBConnection } from './index';
import dotenv from 'dotenv';
dotenv.config();
const connectionUri = process.env.MONGO_URI;
if (!connectionUri) {
    throw new Error('MONGO_URI environment variable is not defined');
}
const databaseName = "BasePairs";
const tokenCollection = "Tokens";

async function addNewToken(token: string, pair: string, price: string, decimals: number) {
    try {
        // Connect to the database
        const connection = new MongoDBConnection(connectionUri ?? '');
        await connection.connect();
        const db = connection.getDatabase(databaseName);

        // Create a new document with the provided inputs
        const document = {
            token,
            pair,
            decimals,
            lastUpdated: Math.floor(Date.now() / 1000), // Current timestamp in epoch
            prices : [{
                price,
                timeStamp: Math.floor(Date.now() / 1000)
            }]
        };

        // Write the document to the "Trades" collection
        await db.collection(tokenCollection).insertOne(document);
        // Close the connection
        await connection.close();
    } catch (error) {
        console.error("Error:", error);
    }
}



async function insertNewPrice(token: string, price: string) {
    try {
        // Connect to the database
        const connection = new MongoDBConnection(connectionUri ?? '');
        await connection.connect();
        const db = connection.getDatabase(databaseName);

        // Find the document with the provided token
        const document = await db.collection(tokenCollection).findOne({ token });

        if (document) {
            // Update the prices array with the new price and timestamp
            document.prices.push({
                price,
                timeStamp: Math.floor(Date.now() / 1000)
            });
            document.lastUpdated = Math.floor(Date.now() / 1000);

            // Update the document in the collection
            await db.collection(tokenCollection).updateOne({ token }, { $set: document });
        } else {
            console.error(`Token ${token} not found`);
        }

        // Close the connection
        await connection.close();
    } catch (error) {
        console.error("Error:", error);
    }
}


async function getTokensLastUpdated60SecondsAgo(): Promise<{ token: string, pair: string, decimals: number }[]> {
    try {
        // Connect to the database
        const connection = new MongoDBConnection(connectionUri ?? '');
        await connection.connect();
        const db = connection.getDatabase(databaseName);

        // Calculate the timestamp 60 seconds ago
        const timestamp60SecondsAgo = Math.floor(Date.now() / 1000) - 60;

        // Find the tokens that were last updated 60 seconds ago
        const tokens = await db.collection(tokenCollection).find({ lastUpdated: { $lte: timestamp60SecondsAgo } }).toArray();

        // Extract the required fields from the tokens
        const tokensWithRequiredFields = tokens.map(token => ({
            token: token.token,
            pair: token.pair,
            decimals: token.decimals
        }));

        // Close the connection
        await connection.close();

        return tokensWithRequiredFields;
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

export { addNewToken, insertNewPrice, getTokensLastUpdated60SecondsAgo };