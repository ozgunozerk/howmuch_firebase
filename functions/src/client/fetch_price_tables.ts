import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { type PriceTable, type PriceTables } from '../types'

/**
 * Firebase Cloud Function to fetch the price table from Firestore.
 * This function doesn't expect any input data.
 *
 * The returned value is of type PriceTable.
 * @param _data - This function does not expect any input data,
 *   so this parameter is not used.
 * @param _context - Information about the function call,
 *   execution environment, and security rules.
 *
 * @returns {Promise<PriceTable>} - Returns a promise that resolves
 *   with the price table from Firestore. If the "price_table" document
 *   does not exist in the Firestore, or if there is any internal error
 *   while fetching the document, it rejects with an appropriate error message.
 *
 * @throws {functions.https.HttpsError} - Throws an HttpsError if the
 *   "price_table" document does not exist or if there's any internal error.
 */
export const fetchPriceTables = functions
// .runWith({ enforceAppCheck: true, }) // enable this for DDoS if necessary
  .region('europe-west1')
  .https.onCall(
    async (
      data: { latestPriceTableDate?: string },
      context: functions.https.CallableContext
    ): Promise<PriceTables> => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'only authenticated users can get assets'
        )
      }

      const db = admin.firestore()
      let priceTablesQuery: admin.firestore.Query =
                db.collection('price-tables')

      if (data.latestPriceTableDate) {
        priceTablesQuery = priceTablesQuery.where(
          admin.firestore.FieldPath.documentId(),
          '>',
          data.latestPriceTableDate
        )
      }

      try {
        const queryResult = await priceTablesQuery.get()
        if (queryResult.empty) {
          return {}
        } else {
          const priceTables: PriceTables = {}
          queryResult.docs.forEach((doc) => {
            priceTables[doc.id] = doc.data() as PriceTable
          })
          return priceTables
        }
      } catch (err) {
        throw new functions.https.HttpsError(
          'internal',
          'could not fetch price tables',
          err
        )
      }
    }
  )
