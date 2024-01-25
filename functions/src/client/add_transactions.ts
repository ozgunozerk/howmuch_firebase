import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { type UserTransactions } from '../types'

/**
 * @function addTransactions
 * Firebase Cloud Function for adding user's transactions.
 *
 * The received transactions are written to Firestore doc.
 *
 * @param {UserAssets} data - Contains the transaction list to be set.
 * @param {functions.https.CallableContext} context
 * @returns {Promise<admin.firestore.WriteResult>}
 *
 * @throws {functions.https.HttpsError} If the user is unauthenticated.
 */
export const addTransactions = functions
  .region('europe-west1')
  .https.onCall(
    async (
      data: UserTransactions,
      context: functions.https.CallableContext
    ) => {
      // Check if the user is authenticated
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'only authenticated users can set assets'
        )
      }

      // Get the current date
      const currentYear = new Date().getFullYear()

      // append the transactions
      await admin
        .firestore()
        .collection('users')
        .doc(context.auth.uid)
        .collection('transactions')
        .doc(`transactions_${currentYear}`)
        .set(data, { merge: true })
    }
  )
