import * as dotenv from 'dotenv'
import { CoinGeckoClient } from 'coingecko-api-v3'
import { type PriceTableEntries, type EODApiResponse, type EODAssetEntry } from '../types'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('node-fetch')

// init dotenv
dotenv.config()

const coinGeckoClient = new CoinGeckoClient({
  timeout: 10000,
  autoRetry: true
})

const EOD_API_KEY = process.env.EOD_API_KEY

const fetchWithRetries = async (
  url: string
): Promise<Response> => {
  const maxRetries = 4
  const initialDelay = 500
  let currentDelay = initialDelay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fetchedData = await fetch(url)
      return fetchedData
    } catch (error) {
      if (attempt === maxRetries) {
        // If it's the last attempt, throw the error
        throw new Error(`Maximum tries reached for fetchWithRetries for url: ${url}, with error: ${error}`)
      }

      // If not the last attempt, wait and then retry
      await new Promise((resolve) => setTimeout(resolve, currentDelay))
      currentDelay *= 2 // Exponential back-off
    }
  }

  throw new Error(
    'Unexpected state: fetchWithRetries did not return a value'
  )
}

/**
 * Fetches the current exchange rates for a set of symbols (except crypto).
 *
 * @param {string[]} symbols - An array of symbols.
 * @param {string} postfix - the postfix to be removed from the symbols.
 *   EODHD uses postfixes to distinguish between symbols. For example:
 *   AAPL.US -> we have to remove `.US` from it to create price table
 *
 * @return {Promise<PriceTableEntries>} A Promise resolving with an object
 *   of symbols to their exchange rates.
 *
 * @throws {Error} An error message if the exchange rates could not be fetched.
 */
export const getAssetPrices = async (
  symbols: string[],
  postfix: string
): Promise<PriceTableEntries> => {
  // append postfix to each symbol
  const postFixedSymbols = symbols.map((symbol) => symbol + postfix)
  const firstSymbol = postFixedSymbols[0]
  const rest = postFixedSymbols.slice(1).join(',')
  const url = `https://eodhd.com/api/real-time/${firstSymbol}?s=${rest}&api_token=${EOD_API_KEY}&fmt=json`
  try {
    const fetchedData = await fetchWithRetries(url)
    const response = (await fetchedData.json()) as EODApiResponse
    const rates: PriceTableEntries = {}
    response.forEach((entry: EODAssetEntry) => {
      const symbol = entry.code
      const symbolWithoutPostfix = symbol.replace(postfix, '')
      rates[symbolWithoutPostfix] = entry.close
    })

    return rates
  } catch (err) {
    throw new Error(`Couldn't fetch rates, because: ${err}`)
  }
}

/**
 * Fetches the current exchange rates for a set of cryptocurrencies.
 *
 * @param {string[]} coinGeckoIDs - An array of coinGeckoIDs.
 *
 * @return {Promise<PriceMapping>}  A Promise resolving with an
 *   object of coinGeckoIDs to their exchange rates.
 *
 * @throws {Error} An error message if the exchange rates could not be fetched.
 */
export const getCryptoRates = async (
  coinGeckoIDs: string[]
): Promise<PriceTableEntries> => {
  const stringCoinGeckoIDs = coinGeckoIDs.join(',')

  try {
    const response = await coinGeckoClient.simplePrice({
      vs_currencies: 'usd',
      ids: stringCoinGeckoIDs
    })

    const cryptoRates: PriceTableEntries = {}
    coinGeckoIDs.forEach((id) => {
      const rate = response[id].usd
      cryptoRates[id] = rate
    })
    return cryptoRates
  } catch (err) {
    throw new Error(`Couldn't fetch CRYPTO RATES, because: ${err}`)
  }
}

/**
 * Fetches the names of coins for a set of CoinGecko IDs.
 *
 * @param {string[]} coinGeckoIDs - An array of coingecko IDs.
 *
 * @return {Promise<Object.<string, Object<string, string>>>}
 *   A Promise resolving with an object of CoinGecko IDs to their
 *   names and symbols.
 *
 * @throws {Error} An error message if the CoinGecko IDs could not be fetched.
 */
const createCryptoMapFromCoinGeckoIDs = async (
  coinGeckoIDs: string[]
): Promise<Record<string, { symbol: string, name: string }>> => {
  try {
    const response = await coinGeckoClient.coinList({})
    const cryptoMap: Record<string, { symbol: string, name: string }> = {}

    coinGeckoIDs.forEach((coingeckoID) => {
      const coin = response
        .filter((coin) => coin.id === coingeckoID)[0]
      // coinGeckoID's are be unique, so it should be safe
      // to take the first element, since there has to be only one element

      if (coin.id !== undefined &&
            coin.name !== undefined && coin.symbol !== undefined) {
        cryptoMap[coingeckoID] = { symbol: coin.symbol, name: coin.name }
      } else {
        throw new Error(`Coin id is undefined for: ${coingeckoID}`)
      }
    })

    return cryptoMap
  } catch (err) {
    throw new Error(`Couldn't fetch CRYPTO ASSET LIST, because: ${err}`)
  }
}

/**
 * Fetches the CoinGecko IDs for a set of cryptocurrencies.
 *
 * @return {Promise<string[]>}  A Promise resolving with a
 *   list of CoinGecko IDs of the  most popular 200 coins by market cap.
 *
 * @throws {Error} An error message if the CoinGecko IDs could not be fetched.
 */
const getCryptoAssetTable = async (): Promise<string[]> => {
  try {
    const response = await coinGeckoClient.coinMarket({
      order: 'market_cap_desc',
      vs_currency: 'usd',
      per_page: 100,
      page: 1
    })

    const coinGeckoIDs = response
      .map((coin) => coin.id)
      .filter((id) => id !== undefined) as string[]

    return coinGeckoIDs
  } catch (err) {
    throw new Error(`Couldn't fetch most popular cryptos, because: ${err}`)
  }
}

export const printUpToDateCryptoAssets = async (): Promise<void> => {
  const IDs = await getCryptoAssetTable()
  const cryptoMap = await createCryptoMapFromCoinGeckoIDs(IDs)
  console.log(cryptoMap)
}
