import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { type AssetTable } from '../types'

/**
 * Firebase Cloud Function to fetch the asset table from Firestore.
 * This function doesn't expect any input data.
 *
 * The returned value is of type AssetTable.
 *
 * @param _data - This function does not expect any input data,
 *   so this parameter is not used.
 * @param _context - Information about the function call,
 *   execution environment and security rules.
 *
 * @returns {Promise<AssetTable>} - Returns a promise that resolves with the
 *   asset table from Firestore. If the "asset_table" document does not
 *   exist in the Firestore, or if there is any internal error while fetching
 *   the document, it rejects with an appropriate error message.
 *
 * @throws {functions.https.HttpsError} - Throws an HttpsError if the
 *   "asset_table" document does not exist or if there's any internal error.
 */
export const fetchAssetTable = functions
  .region('europe-west1')
  .https.onCall(async (_data, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'only authenticated users can get assets'
      )
    }

    const db = admin.firestore()

    // Get the asset lists from Firestore
    try {
      const assetsDoc = await db
        .collection('server')
        .doc('asset_table')
        .get()

      if (!assetsDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'asset table doc could not be found'
        )
      }

      // Construct the response
      const assetTable = assetsDoc.data()

      return assetTable as AssetTable
    } catch (err) {
      throw new functions.https.HttpsError(
        'internal',
            `Couldn't fetch asset lists, because: ${err}`
      )
    }
  })
