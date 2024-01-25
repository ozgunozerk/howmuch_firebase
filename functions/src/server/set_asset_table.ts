import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import * as dotenv from 'dotenv'
import { AssetType } from '../types'
import { bist50, crypto100, forex30, nasdaq103 } from './asset_list'

dotenv.config()

/**
 * Firebase Cloud Function to set the asset lists for
 *   each AssetType in Firestore.
 * This function is triggered by an HTTP request.
 *
 * @throws {functions.https.HttpsError} An HttpsError if the asset lists could
 *   not be set.
 */
export const setAssetTable = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    const db = admin.firestore()

    // Check if the request contains the correct API key
    if (req.query.apiKey !== process.env.SUDO_API_KEY) {
      res.status(403).send(
        'Forbidden: You are not authorized to access this resource.'
      )
      return
    }

    // Set the asset lists in Firestore
    try {
      const assetTable = {
        [AssetType.CRYPTO]: crypto100,
        [AssetType.NASDAQ]: nasdaq103,
        [AssetType.FOREX]: forex30,
        [AssetType.BIST]: bist50
      }
      await db.collection('server').doc('asset_table').set(assetTable)
      res.status(200).send('Asset table has been updated.')
    } catch (err) {
      res.status(500).send(`Couldn't set asset lists, because: ${err}`)
    }
  })
