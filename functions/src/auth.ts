import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// create two new documents with the user UID on new user creation
export const newUserSignUp = functions
  .region('europe-west1')
  .auth.user()
  .onCreate(async (user) => {
    const userRef = admin.firestore().collection('users').doc(user.uid)
    // Initialize the document/s with empty data,
    // so that they won't be invisible to queries

    const promises = [userRef.set({})]
    // this is a list, due to we may have other documents
    // to create in the future

    return await Promise.all(promises)
  })

// delete the user UID doc on deletion
export const userDeleted = functions
  .region('europe-west1')
  .auth.user()
  .onDelete(async (user) => {
    const userDocRef = admin.firestore().collection('users').doc(user.uid)

    // Delete 'assets' document under the user_data collection
    // this is a list, due to me may have other promises in the future
    const promises = [admin.firestore().recursiveDelete(userDocRef)]

    return await Promise.all(promises)
  })
