import * as admin from "firebase-admin";

/**
 * Creates a mock user record for use in Firebase tests.
 *
 * @param {string} uid - The unique ID for the user.
 *   This should be unique per test.
 * @param {string} email - The email address for the user.
 * @return {admin.auth.UserRecord} - A mock user record with the provided
 *   uid and email, along with some preset values for the other properties.
 */
export function createUserRecord(
    uid: string,
    email: string
): admin.auth.UserRecord {
  return {
    uid: uid,
    email: email,
    emailVerified: false,
    displayName: "Test User",
    phoneNumber: "+11234567890",
    photoURL: "https://example.com/photo.png",
    disabled: false,
    metadata: {
      lastSignInTime: "string",
      creationTime: "string",
      toJSON: function() {
        return {};
      },
    },
    providerData: [],
    passwordSalt: "123",
    passwordHash: "123",
    tokensValidAfterTime: "string",
    tenantId: "string",
    toJSON: function() {
      return {};
    },
  };
}
