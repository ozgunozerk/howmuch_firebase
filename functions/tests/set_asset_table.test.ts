import * as admin from 'firebase-admin'
import * as firebaseFunctionsTest from 'firebase-functions-test'
import { expect } from 'chai'
import { type Request, type Response } from 'express'
import * as dotenv from 'dotenv'
import { setAssetTable } from '../src/index'
import { AssetType } from '../src/types'
import { bist100, crypto100, forex30, nasdaq103 } from '../src/server/asset_list'

const projectId = 'demo-project'
const test = firebaseFunctionsTest({
  projectId
})

dotenv.config()

describe('Asset List Functions', () => {
  beforeEach(async () => {
    await test.firestore.clearFirestoreData({ projectId })
  })

  it('sets asset lists', async () => {
    // Make a mock request and response.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req: any = {
      query: {
        apiKey: process.env.SUDO_API_KEY
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = {
      status: function (statusCode: number) {
        return {
          send: (_result: string) => {
            expect(statusCode).to.equal(200)
          }
        }
      }
    }

    await setAssetTable(req as Request, res as Response)

    const assetDoc = await admin
      .firestore()
      .collection('server')
      .doc('asset_table')
      .get()

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(assetDoc.data()).to.exist

    const assetTable = {
      [AssetType.CRYPTO]: crypto100,
      [AssetType.NASDAQ]: nasdaq103,
      [AssetType.FOREX]: forex30,
      [AssetType.BIST]: bist100
    }

    expect(assetDoc.data()).to.deep.equal(assetTable)
  })

  after(async () => {
    test.cleanup()
  })
})
