import * as admin from 'firebase-admin'
import * as firebaseFunctionsTest from 'firebase-functions-test'
import { expect } from 'chai'
import { type UserTransactions } from '../src/types'
import { addTransactions } from '../src/client/add_transactions'

const projectId = 'demo-project'
const test = firebaseFunctionsTest({
  projectId
})

describe('addTransactions function', () => {
  const uid = 'test_uid'
  const currentYear = new Date().getFullYear()

  beforeEach(async () => {
    await test.firestore.clearFirestoreData({ projectId })
  })

  const transactions: UserTransactions = {
    [`${currentYear}-01-01-00`]: {
      assetType: 'crypto',
      assetId: '1',
      amount: 100
    },
    [`${currentYear}-01-01-06`]: {
      assetType: 'crypto',
      assetId: '2',
      amount: 150
    }
  }

  it("should add transactions to the user's document", async () => {
    // Mock transaction data

    // Mock the context
    const context = {
      auth: {
        uid
      }
    }

    // Wrap the cloud function
    const wrapped = test.wrap(addTransactions)

    // Call the wrapped function
    await wrapped(transactions, context)

    const userDoc = await admin
      .firestore()
      .collection('users')
      .doc(uid)
      .collection('transactions')
      .doc(`transactions_${currentYear}`)
      .get()

    // Assert that the user document contains the added transactions
    expect(userDoc.data()).to.deep.equal(transactions)
  })

  it('should append new transactions to the existing ones', async () => {
    // Set up existing transactions in the Firestore
    const existingDocRef = admin
      .firestore()
      .collection('users')
      .doc(uid)
      .collection('transactions')
      .doc(`transactions_${currentYear}`)

    await existingDocRef.set(transactions)

    // Mock new transaction data
    const newTransactions: UserTransactions = {
      [`${currentYear}-01-01-12`]: {
        assetType: 'crypto',
        assetId: '3',
        amount: 200
      },
      [`${currentYear}-01-01-18`]: {
        assetType: 'nasdaq',
        assetId: '4',
        amount: 250
      }
    }

    // Mock the context
    const context = {
      auth: {
        uid
      }
    }

    // Wrap the cloud function
    const wrapped = test.wrap(addTransactions)

    // Call the wrapped function
    await wrapped(newTransactions, context)

    const userDoc = await existingDocRef.get()

    // Assert that the user document contains the existing and new transactions
    expect(userDoc.data()).to.deep.equal({
      ...transactions,
      ...newTransactions
    })
  })

  after(async () => {
    test.cleanup()
  })
})
