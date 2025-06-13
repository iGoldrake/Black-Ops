# XMLTV Viewer v4.2.1

Applicazione web per visualizzare e modificare palinsesti TV in formato XMLTV con visualizzazione treemap aggregata per format.

## Caratteristiche Principali

### Visualizzazione
- **Treemap Aggregato**: Visualizza tutti i programmi raggruppati per format
- **3 Algoritmi di Layout**: Squarify (default), Binary, Slice & Dice
- **Colori Automatici**: Assegnazione automatica colori distintivi per ogni format
- **Preview on Hover**: Dettagli format al passaggio del mouse
- **Dark Mode**: Tema scuro con persistenza preferenza

### Editor
- **Modifica Inline**: Click su titolo o categoria per modificare
- **Aggiungi/Elimina**: Gestione completa programmi
- **Drag & Drop**: Caricamento file tramite trascinamento
- **Supporto Date**: Parsing formato XMLTV classico e ISO 8601

### Statistiche
- **Copertura Totale**: Ore totali di programmazione
- **Format Unici**: Conteggio format diversi
- **Gap Detection**: Rilevamento buchi nel palinsesto
- **Overlap Check**: Controllo sovrapposizioni programmi

### Export
- **Attualizzazione Date**: Sposta l'intero palinsesto a nuova data
- **Export XMLTV**: Salva file modificato in formato standard

## Struttura Progetto

```
xmltv-viewer/
├── index.html          # Struttura HTML base
├── styles.css          # Tutti gli stili CSS
├── js/
│   ├── main.js        # Inizializzazione e stato globale
│   ├── fileHandler.js # Caricamento e parsing XML
│   ├── treemap.js     # Visualizzazione treemap
│   ├── editor.js      # Funzionalità editing
│   ├── statistics.js  # Statistiche e report
│   ├── export.js      # Export e attualizzazione
│   └── utils.js       # Funzioni utility
└── README.md          # Questa documentazione
```

## Utilizzo

### Caricamento File
1. Trascina un file XMLTV sulla zona di drop
2. Oppure clicca "Seleziona File" per scegliere

### Visualizzazione Treemap
- Ogni rettangolo rappresenta un format
- La dimensione è proporzionale alla durata totale
- Click su un format per vedere tutti gli episodi
- Hover per preview rapido

### Modifica Programmi
1. Nella tabella editor, clicca su titolo o categoria
2. Modifica il testo e premi Enter
3. Usa il pulsante cestino per eliminare
4. "Aggiungi Programma" per inserire nuovo

### Attualizzazione Date
1. Click su "Attualizza Date"
2. Seleziona nuova data di inizio
3. Tutti i programmi verranno spostati mantenendo gli orari

### Export
- Click su "Esporta XMLTV" per salvare le modifiche

## Formato XMLTV Supportato

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tv>
  <channel id="channel.id">
    <display-name>Channel Name</display-name>
  </channel>
  
  <programme start="2025-06-09T21:00:00+0000" stop="2025-06-09T22:30:00+0000" channel="channel.id">
    <title lang="it">Program Title</title>
    <desc lang="it">Program Description</desc>
    <category lang="it">Category</category>
    <icon src="http://example.com/icon.jpg"/>
    <rating>
      <value>3</value>
    </rating>
  </programme>
</tv>
```

## Build Single-File

Per generare la versione single-file di produzione:

```bash
npm run build
```

Lo script di build:
1. Concatena tutti i file JS in ordine corretto
2. Inline CSS nel tag `<style>`
3. Produce `xmltv-viewer-v4.2.1.html`

## Sviluppo

### Aggiungere Nuove Funzionalità

1. **Nuovo Modulo JS**: Crea file in `js/` con commenti documentazione
2. **Nuovi Stili**: Aggiungi in `styles.css` con commenti sezione
3. **HTML**: Modifica `index.html` per nuovi elementi UI
4. **Export Funzioni**: Esponi funzioni globali con `window.functionName`

### Best Practices

- Mantieni stato globale in `GlobalState` (main.js)
- Usa `showToast()` per feedback utente
- Re-inizializza Lucide icons dopo modifiche DOM: `lucide.createIcons()`
- Formatta date sempre in UTC per consistenza

## Prossimi Sviluppi

- [ ] Vista timeline lineare orizzontale
- [ ] Confronto tra palinsesti
- [ ] Import/export template programmazione
- [ ] Vista settimanale multi-canale
- [ ] API REST per integrazione sistemi

## Note Tecniche

- **No localStorage per dati**: Solo per preferenze UI (dark mode)
- **Memoria**: Tutti i dati in variabili JavaScript
- **Compatibilità**: Chrome/Edge/Firefox/Safari moderni
- **Responsive**: Ottimizzato per desktop, funzionale su tablet

## Licenza

Sviluppato per Class CNBC e Class TV Moda - Uso interno

## Versioni

- **v4.2.1** (Corrente): Visualizzazione semplificata, nessuna conversione timezone
- **v4.2.0**: Treemap aggregato per format
- **v4.1.0**: Supporto ISO 8601, miglioramenti UI
- **v4.0.0**: Refactoring completo, nuovo design