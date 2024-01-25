import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { type UserTransactions } from '../types'

/**
 * Firebase Cloud Function to get a user's transactions.
 * This function is callable from a client app.
 *
 * @param {object} _data - This function does not require any data,
 *   so this parameter is ignored.
 * @param {functions.https.CallableContext} context - The context in which this
 *   function is called.
 *   This includes information about the user who called the function.
 *
 * @returns {Promise<UserTransactions>} user's assets.
 *
 * @throws {functions.https.HttpsError} An HttpsError if the user is not
 *   authenticated, the user's document does not exist in the database,
 *   or the user's document is empty.
 */
export const fetchTransactions = functions
  .region('europe-west1')
  .https.onCall(
    async (
      _data,
      context: functions.https.CallableContext
    ): Promise<UserTransactions> => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'only authenticated users can get assets'
        )
      }

      const transactionsCollection = await admin
        .firestore()
        .collection('users')
        .doc(context.auth.uid)
        .collection('transactions')
        .get()

      // Check if the collection exists
      if (transactionsCollection.empty) {
        return {} // Return an empty object if the collection is empty
      }

      // Accumulate transactions from all documents into a single object
      const allTransactions: UserTransactions = {}
      transactionsCollection.forEach((doc) => {
        const data = doc.data()
        if (data) {
          Object.assign(allTransactions, data)
        }
      })

      return allTransactions
    }
  )
