import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {getCryptoRates, getAssetPrices} from "./api_queries";
import {
  AssetType,
  AssetTable,
  PriceTable,
} from "../types";
import {error} from "firebase-functions/logger";

/**
 * Triggers a scheduled function to update server asset prices.
 *
 * @return {Promise<void>} A Promise that resolves when asset prices
 *   are successfully updated.
 */
export const createPriceTable = functions
    .region("europe-west1")
    .pubsub.schedule("55 5,11,17,23 * * *") // run at 05.55, 11.55, 17.55, 23.55
    .timeZone("UTC")
    .onRun(async (_context) => {
      // Get today's date in UTC and format it -> YYYY-MM-DD-HH
      const today = new Date();
      // add 5 minutes to make it 06.00, 12.00, 18.00, 00.00
      today.setMinutes(today.getMinutes() + 5);

      const formattedDate = `${today.getUTCFullYear()}-${(today.getUTCMonth() +
        1).toString().padStart(2, "0")}-${today.getUTCDate()
          .toString().padStart(2, "0")}-${today.getUTCHours()
          .toString().padStart(2, "0")}`;

      // Query the APIs and get the asset prices
      let assetPrices;
      try {
        assetPrices = await queryApis();
      } catch {
        functions.logger.error(
            `couldn't fetch prices on server side for date: ${formattedDate}`
        );
        return;
      }

      // Create a new snapshot document with the updated data
      await admin
          .firestore()
          .collection("price-tables")
          .doc(formattedDate)
          .set(assetPrices);

      functions.logger.log("Server asset prices updated successfully!");
    });


/**
 * Queries APIs for asset prices, and maps them according to their types.
 *
 * @return {Promise<PriceTable>} A Promise resolving with an object
 *   where each key is a assetType, and each value is another object
 *   where each key is an asset symbol and each value is its current price.
 *
 * @throws {Error} An Error if data could not be fetched from Firestore
 *   or a rate was not found.
 */
export const queryApis = async (): Promise<PriceTable> => {
  const db = admin.firestore();

  // Fetch the asset table from Firestore
  const assetDoc = await db.collection("server").doc("asset_table").get();

  const assetData = assetDoc.data() as AssetTable;

  if (!assetData) {
    functions.logger.error("asset table could not be fetched from Firestore");
    throw error("asset table could not be fetched from Firestore");
  }

  // Destructure the assetData
  const cryptoIDs = Object.keys(assetData[AssetType.CRYPTO]);
  const nasdaqIDs = Object.keys(assetData[AssetType.NASDAQ]);
  const forexIDs = Object.keys(assetData[AssetType.FOREX]);
  const bistIDs = Object.keys(assetData[AssetType.BIST]);

  // Fetch the rates for each assetType directly
  const [cryptoMap, nasdaqMap, forexMap, bistMap] = await Promise.all([
    getCryptoRates(cryptoIDs),
    getAssetPrices(nasdaqIDs, ".US"),
    getAssetPrices(forexIDs, ".FOREX"),
    getAssetPrices(bistIDs, ".IS"),
  ]);

  // Create an object for the categories
  const priceTable: PriceTable = {
    crypto: cryptoMap,
    nasdaq: nasdaqMap,
    forex: forexMap,
    bist: bistMap,
  };

  return priceTable;
};
