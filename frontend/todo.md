# Gestionale Ordini e Vendite - Piano di Sviluppo

## Obiettivo
Creare una piattaforma web per la gestione centralizzata di ordini di acquisto dai fornitori e dati di vendita, con importazione file CSV/Excel, consolidamento dati in database MySQL e dashboard di analisi interattiva.

## Design Guidelines

### Stile Visivo
- **Tema**: Dashboard professionale per gestionale aziendale
- **Colori**:
  - Primary: #2563eb (Blue 600 - azioni principali)
  - Secondary: #64748b (Slate 500 - testo secondario)
  - Success: #16a34a (Green 600 - vendite)
  - Warning: #ea580c (Orange 600 - acquisti)
  - Background: #f8fafc (Slate 50)
  - Card: #ffffff (White)
- **Tipografia**: Inter (sistema shadcn-ui)
- **Layout**: Sidebar fissa + area contenuto principale con cards

## Struttura Database

### Tabella: fornitori
- id (Integer, autoincrement)
- nome (String)
- created_at (DateTime)

### Tabella: acquisti
- id (Integer, autoincrement)
- fornitore_id (Integer, FK a fornitori)
- data_ordine (DateTime)
- data_consegna (DateTime)
- categoria_prodotto (String)
- quantita (Float)
- prezzo_totale (Float, in EUR)
- user_id (String)
- created_at (DateTime)

### Tabella: vendite
- id (Integer, autoincrement)
- data (DateTime)
- canale_vendita (String)
- categoria_prodotto (String)
- quantita (Float)
- prezzo_totale (Float, opzionale)
- user_id (String)
- created_at (DateTime)

## Task di Sviluppo

### 1. Setup Iniziale
- [x] Installare metagptx/web-sdk@latest
- [x] Installare xlsx per parsing Excel
- [x] Installare papaparse per parsing CSV
- [x] Installare recharts per grafici dashboard

### 2. Backend - Database
- [ ] Creare tabelle: fornitori, acquisti, vendite
- [ ] Inserire dati mock fornitori iniziali

### 3. Backend - API Endpoints
- [ ] POST /api/v1/upload/parse-suppliers - Parse file fornitori e ritorna preview
- [ ] POST /api/v1/upload/import-suppliers - Importa ordini fornitori nel DB
- [ ] POST /api/v1/upload/parse-sales - Parse file vendite e ritorna preview
- [ ] POST /api/v1/upload/import-sales - Importa vendite nel DB
- [ ] GET /api/v1/analytics/summary - Dati aggregati per dashboard (totali, per categoria, per periodo)

### 4. Frontend - Autenticazione
- [ ] Aggiungere route /auth/callback in App.tsx
- [ ] Creare pagina AuthCallback.tsx
- [ ] Implementare controllo autenticazione in App.tsx
- [ ] Header con logout

### 5. Frontend - Layout
- [ ] Creare Layout.tsx con sidebar navigazione
- [ ] Sidebar items: Dashboard, Import Ordini, Import Vendite

### 6. Frontend - Pagine
- [ ] Dashboard.tsx - Grafici e analisi
- [ ] ImportOrders.tsx - Upload file fornitori
- [ ] ImportSales.tsx - Upload file vendite

### 7. Frontend - Componenti
- [ ] FileUploader.tsx - Componente riutilizzabile per upload
- [ ] DataPreview.tsx - Preview dati prima dell'importazione
- [ ] AnalyticsChart.tsx - Grafici per dashboard

### 8. Testing e Finalizzazione
- [ ] Test importazione file CSV/Excel
- [ ] Test dashboard con filtri
- [ ] Lint e build finale