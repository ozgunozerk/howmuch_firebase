import * as admin from 'firebase-admin'
import * as firebaseFunctionsTest from 'firebase-functions-test'
import { expect } from 'chai'
import { type AssetTable, AssetType } from '../src/types'
import { fetchAssetTable } from '../src/client/fetch_asset_table'

const projectId = 'demo-project'
const test = firebaseFunctionsTest({
  projectId
})

describe('getAssetTable function', () => {
  beforeEach(async () => {
    await test.firestore.clearFirestoreData({ projectId })
  })

  it('should return the asset table', async () => {
    // Set up asset table in the Firestore
    const assetTable: AssetTable = {
      [AssetType.CRYPTO]: {
        bitcoin: 'bitcoin'
      },
      [AssetType.NASDAQ]: {
        AAPL: 'aapl'
      },
      [AssetType.FOREX]: {
        USD: 'usd'
      },
      [AssetType.BIST]: {
        AKBNK: 'akbnk'
      }
    }
    await admin
      .firestore()
      .collection('server')
      .doc('asset_table')
      .set(assetTable)

    // Mock the context
    const context = {
      auth: {
        uid: 'test_uid'
      }
    }

    // Wrap the cloud function
    const wrapped = test.wrap(fetchAssetTable)

    // Call the wrapped function
    const result = await wrapped({}, context)

    // Assert that the returned asset table matches the asset table in Firestore
    expect(result).to.deep.equal(assetTable)
  })

  after(async () => {
    test.cleanup()
  })
})
