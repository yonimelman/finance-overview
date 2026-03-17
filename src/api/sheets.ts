import Papa from 'papaparse';
import type { Holding, HoldingType, RawCurrency } from '../types';
import { HOLDING_TYPE_LABELS } from '../types';

interface SheetRow {
  source: string;
  id: string;
  name: string;
  units: string;
  currency: string;
  manual_value: string;
  manual_date: string;
  group: string;
}

const VALID_TYPES: HoldingType[] = [
  'stock', 'tase_stock', 'money_fund', 'education_fund', 'crypto', 'cash', 'stonks',
];
const VALID_CURRENCIES: RawCurrency[] = ['USD', 'ILS', 'ILA', 'USX'];

export async function fetchHoldings(sheetCsvUrl: string): Promise<Holding[]> {
  const response = await fetch(sheetCsvUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet: ${response.status}`);
  }
  const csv = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<SheetRow>(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        const holdings: Holding[] = [];
        for (const row of results.data) {
          const type = row.source?.trim() as HoldingType;
          const currency = row.currency?.trim().toUpperCase() as RawCurrency;

          if (!VALID_TYPES.includes(type)) continue;
          if (!VALID_CURRENCIES.includes(currency)) continue;

          const units = parseFloat(row.units);
          if (isNaN(units)) continue;

          const holding: Holding = {
            type,
            id: row.id?.trim(),
            name: row.name?.trim(),
            units,
            currency,
            group: row.group?.trim() || HOLDING_TYPE_LABELS[type],
          };

          const manualValue = parseFloat(row.manual_value);
          if (!isNaN(manualValue)) {
            holding.manualValue = manualValue;
          }

          const manualDate = row.manual_date?.trim();
          if (manualDate) {
            holding.manualDate = manualDate;
          }

          holdings.push(holding);
        }
        resolve(holdings);
      },
      error: (err: Error) => reject(err),
    });
  });
}
