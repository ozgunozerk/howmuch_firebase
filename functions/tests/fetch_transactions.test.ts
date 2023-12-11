import * as admin from "firebase-admin";
import * as firebaseFunctionsTest from "firebase-functions-test";
import {expect} from "chai";
import {UserTransactions} from "../src/types";
import {fetchTransactions} from "../src/client/fetch_transactions";

const projectId = "demo-project";
const test = firebaseFunctionsTest({
  projectId,
});

describe("fetchTransactions function", () => {
  const uid = "test_uid";
  const currentYear = new Date().getFullYear();

  beforeEach(async () => {
    // Clear Firestore data before each test
    await test.firestore.clearFirestoreData({projectId});
  });

  it("should fetch all transactions for the user", async () => {
    // Mock transaction data
    const transactions: UserTransactions = {
      [`${currentYear}-01-01-00`]: {
        assetType: "crypto",
        assetId: "1",
        amount: 100,
      },
      [`${currentYear}-01-01-06`]: {
        assetType: "crypto",
        assetId: "2",
        amount: 150,
      },
    };

    // Set up transactions in the Firestore
    const transactionsDocRef = admin
        .firestore()
        .collection("users")
        .doc(uid)
        .collection("transactions")
        .doc(`transactions_${currentYear}`);

    await transactionsDocRef.set(transactions);

    // Mock the context
    const context = {
      auth: {
        uid: uid,
      },
    };

    // Wrap the cloud function
    const wrapped = test.wrap(fetchTransactions);

    // Call the wrapped function
    const result = await wrapped({}, context);

    // Assert that the result matches the expected transactions
    expect(result).to.deep.equal(transactions);
  });

  it("should fetch transactions from multiple documents", async () => {
    // Mock transaction data in two documents
    const transactionsDoc1: UserTransactions = {
      [`${currentYear - 1}-01-01-00`]: {
        assetType: "crypto",
        assetId: "1",
        amount: 100,
      },
      [`${currentYear - 1}-01-01-00`]: {
        assetType: "crypto",
        assetId: "2",
        amount: 150,
      },
    };

    const transactionsDoc2: UserTransactions = {
      [`${currentYear}-01-01-00`]: {
        assetType: "crypto",
        assetId: "3",
        amount: 200,
      },
      [`${currentYear}-01-01-06`]: {
        assetType: "crypto",
        assetId: "4",
        amount: 250,
      },
    };

    // Set up transactions in two Firestore documents
    const transactionsDocRef1 = admin
        .firestore()
        .collection("users")
        .doc(uid)
        .collection("transactions")
        .doc(`transactions_${currentYear - 1}`);

    const transactionsDocRef2 = admin
        .firestore()
        .collection("users")
        .doc(uid)
        .collection("transactions")
        .doc(`transactions_${currentYear}`);

    await transactionsDocRef1.set(transactionsDoc1);
    await transactionsDocRef2.set(transactionsDoc2);

    // Mock the context
    const context = {
      auth: {
        uid: uid,
      },
    };

    // Wrap the cloud function
    const wrapped = test.wrap(fetchTransactions);

    // Call the wrapped function
    const result = await wrapped({}, context);

    // Assert that the result contains transactions from both documents
    expect(result).to.deep.equal({
      ...transactionsDoc1,
      ...transactionsDoc2,
    });
  });

  it("should handle when transactions collection doesn't exist", async () => {
    // Mock the context
    const context = {
      auth: {
        uid: uid,
      },
    };

    // Wrap the cloud function
    const wrapped = test.wrap(fetchTransactions);

    // Call the wrapped function
    const result = await wrapped({}, context);

    // Assert the result is an empty object when the collection doesn't exist
    expect(result).to.deep.equal({});
  });

  after(async () => {
    test.cleanup();
  });
});
