import { initializeApp } from 'firebase-admin/app'
import { newUserSignUp, userDeleted } from './auth'
import { addTransactions } from './client/add_transactions'
import { fetchTransactions } from './client/fetch_transactions'
import { setAssetTable } from './server/set_asset_table'
import { createPriceTable } from './server/create_price_table'
import { fetchAssetTable } from './client/fetch_asset_table'
import { fetchPriceTables } from './client/fetch_price_tables'

initializeApp()

export {
  addTransactions,
  newUserSignUp,
  userDeleted,
  fetchAssetTable,
  fetchPriceTables,
  fetchTransactions,
  setAssetTable,
  createPriceTable
}
