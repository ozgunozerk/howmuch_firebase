export enum AssetType {
    // eslint-disable-next-line no-unused-vars
    NASDAQ = "nasdaq",
    // eslint-disable-next-line no-unused-vars
    CRYPTO = "crypto",
    // eslint-disable-next-line no-unused-vars
    FOREX = "forex",
    // eslint-disable-next-line no-unused-vars
    BIST = "bist"
}

// Define a type for each entry in the response array
export type EODAssetEntry = {
    code: string;
    timestamp: number;
    gmtoffset: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    previousClose: number;
    change: number;
    change_p: number;
  };

// Define a type for the overall response
export type EODApiResponse = EODAssetEntry[];

export interface Transaction {
    assetType: string;
    assetId: string;
    amount: number;
}

export type UserTransactions = Record<string, Transaction>; // timestamp

export type PriceTableEntries = Record<string, number>; // ID, price

export type PriceTable = Record<AssetType, PriceTableEntries>;

export type PriceTables = Record<string, PriceTable>;

export type AssetTableEntries = Record<string, string>; // ID, symbol

export type AssetTable = Record<AssetType, AssetTableEntries>;
