import * as admin from "firebase-admin";
import * as firebaseFunctionsTest from "firebase-functions-test";
import {expect} from "chai";
import {createUserRecord} from "./util";
import {newUserSignUp, userDeleted} from "../src/index";

const projectId = "demo-project";
const test = firebaseFunctionsTest({
  projectId,
});

describe("Auth Functions", () => {
  let user: admin.auth.UserRecord;

  beforeEach(async () => {
    await test.firestore.clearFirestoreData({projectId});
    user = createUserRecord("abc123", "test@example.com");
  });

  it("creates new user data on sign up", async () => {
    const wrapped = test.wrap(newUserSignUp);
    await wrapped(user);

    const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .get();

    expect(userDoc.exists).to.be.true;
  });

  it("deletes user data on account deletion", async () => {
    const wrapped = test.wrap(userDeleted);

    // Create some data to delete
    await admin.firestore().collection("users").doc(user.uid).set({});

    await wrapped(user);

    const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .get();

    expect(userDoc.exists).to.be.false;
  });

  afterEach(async () => {
    // Clean up user documents
    await admin.firestore().collection("users").doc(user.uid).delete();
  });

  after(async () => {
    test.cleanup();
  });
});
