import * as admin from "firebase-admin";
import * as firebaseFunctionsTest from "firebase-functions-test";
import {expect} from "chai";
import {AssetType, PriceTables} from "../src/types";
import {fetchPriceTables} from "../src/client/fetch_price_tables";

const projectId = "demo-project";
const test = firebaseFunctionsTest({
  projectId,
});

describe("fetchPriceTables function", () => {
  const uid = "test_uid";

  // Mock price table data
  const priceTables: PriceTables = {
    "2023-01-01-00": {
      [AssetType.CRYPTO]: {
        bitcoin: 50000,
      },
      [AssetType.NASDAQ]: {
        AAPL: 150,
      },
      [AssetType.FOREX]: {
        USD: 1,
      },
      [AssetType.BIST]: {
        AKBNK: 2,
      },
    },
    "2023-01-01-06": {
      [AssetType.CRYPTO]: {
        bitcoin: 40000,
      },
      [AssetType.NASDAQ]: {
        AAPL: 130,
      },
      [AssetType.FOREX]: {
        USD: 1,
      },
      [AssetType.BIST]: {
        AKBNK: 2,
      },
    },
  };

  beforeEach(async () => {
    // Clear Firestore data before each test
    await test.firestore.clearFirestoreData({projectId});
  });

  it("should fetch the price tables", async () => {
    // Set up price tables in the Firestore
    const priceTablesDocRef = admin
        .firestore()
        .collection("price-tables")
        .doc("2023-01-01-00");

    await priceTablesDocRef.set(priceTables["2023-01-01-00"]);

    const priceTablesDocRef2 = admin
        .firestore()
        .collection("price-tables")
        .doc("2023-01-01-06");

    await priceTablesDocRef2.set(priceTables["2023-01-01-06"]);

    // Mock the context
    const context = {
      auth: {
        uid: uid,
      },
    };

    // Wrap the cloud function
    const wrapped = test.wrap(fetchPriceTables);

    // Call the wrapped function
    const result = await wrapped({}, context);

    // Assert that the result matches the expected price tables
    expect(result).to.deep.equal(priceTables);
  });

  it("should fetch price tables after a specified date", async () => {
    // Set up price tables in the Firestore
    const priceTablesDocRef = admin
        .firestore()
        .collection("price-tables")
        .doc("2023-01-01-00");

    await priceTablesDocRef.set(priceTables["2023-01-01-00"]);

    const priceTablesDocRef2 = admin
        .firestore()
        .collection("price-tables")
        .doc("2023-01-01-06");

    await priceTablesDocRef2.set(priceTables["2023-01-01-06"]);

    // Mock the context with a specified latest date
    const context = {
      auth: {
        uid: uid,
      },
    };

    // Wrap the cloud function
    const wrapped = test.wrap(fetchPriceTables);

    // Call the wrapped function with a specified latest date
    const result = await wrapped(
        {latestPriceTableDate: "2023-01-01-00"},
        context
    );

    // Assert that the result matches the expected price tables
    // after the specified date
    expect(result).to.deep.equal({
      "2023-01-01-06": priceTables["2023-01-01-06"],
    });
  });

  after(async () => {
    test.cleanup();
  });
});
