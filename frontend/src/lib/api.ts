import { createClient } from '@metagptx/web-sdk';

export const client = createClient();

export interface ParsedSupplierRow {
  fornitore: string;
  data_ordine: string;
  data_consegna: string;
  categoria_prodotto: string;
  quantita: number;
  prezzo_totale: number;
}

export interface ParsedSalesRow {
  data: string;
  canale_vendita: string;
  categoria_prodotto: string;
  quantita: number;
  prezzo_totale?: number;
}

export interface CategoryData {
  categoria: string;
  acquisti_quantita: number;
  vendite_quantita: number;
  acquisti_valore: number;
  vendite_valore: number;
}

export interface MonthlyData {
  anno: number;
  mese: number;
  acquisti_quantita: number;
  vendite_quantita: number;
  acquisti_valore: number;
  vendite_valore: number;
}

export interface SummaryData {
  totale_acquisti_quantita: number;
  totale_vendite_quantita: number;
  totale_acquisti_valore: number;
  totale_vendite_valore: number;
  categorie_count: number;
}

export interface AnalyticsSummaryResponse {
  summary: SummaryData;
  by_category: CategoryData[];
  by_month: MonthlyData[];
}