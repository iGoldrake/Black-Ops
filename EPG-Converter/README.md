# EPG Converter v4.0.0 - Modular Edition

Applicazione web modulare per la conversione di palinsesti televisivi da formato Excel a XMLTV.

## 🚀 Caratteristiche

- **Architettura Modulare**: Struttura multi-file per manutenzione semplificata
- **GitHub Pages Ready**: Deploy diretto senza build process
- **Multi-file Output**: Genera automaticamente file XML separati per ogni data
- **Supporto Canali**: Class CNBC e Class TV Moda
- **Conversione UTC**: Converte automaticamente gli orari in UTC
- **Gap Filling**: Riempimento automatico dei buchi nella programmazione
- **Icon Mapping**: Gestione icone format con file JSON modificabili

## 📁 Struttura File

```
epg-converter/
├── index.html              # Struttura HTML principale
├── css/
│   └── styles.css          # Stili CSS (solo light theme)
├── js/
│   ├── app.js              # Logica principale dell'applicazione
│   ├── converter.js        # Modulo generazione XMLTV
│   ├── ui.js               # Gestione interfaccia utente
│   └── utils.js            # Funzioni di utilità
├── config/
│   ├── formats-tvmoda.json     # Mappatura format TV Moda
│   ├── formats-classcnbc.json  # Mappatura format Class CNBC
│   └── settings.json           # Configurazioni generali
└── README.md                   # Questa documentazione
```

## 🛠️ Installazione

1. Clona il repository:
```bash
git clone https://github.com/tuousername/epg-converter.git
cd epg-converter
```

2. Serve i file con un web server locale (per sviluppo):
```bash
python -m http.server 8000
# oppure
npx http-server
```

3. Apri nel browser: `http://localhost:8000`

## 🌐 Deploy su GitHub Pages

1. Abilita GitHub Pages nel repository
2. Seleziona la branch `main` (o `gh-pages`)
3. L'app sarà disponibile su: `https://tuousername.github.io/epg-converter/`

## 📝 Modificare i Format

I file di mappatura format sono in formato JSON e possono essere modificati manualmente:

### formats-tvmoda.json
```json
{
  "NOME_FORMAT": "nome-icona.jpg",
  "FASHION NEWS": "fashion-news.jpg",
  ...
}
```

### formats-classcnbc.json
```json
{
  "Tradingroom": "tradingroom.jpg",
  "Linea Mercati": "linea-mercati.jpg",
  ...
}
```

## 🔧 Configurazione

Modifica `config/settings.json` per personalizzare:

- URL base delle icone
- Mapping categorie
- Mapping rating
- Configurazioni canali

## 📊 Formato Excel Supportato

### Class CNBC
- Prima colonna: orario (HH:MM)
- Seconda colonna: titolo programma
- Righe con singola cella: cambio data

### TV Moda
- Ogni foglio rappresenta una data
- La data deve essere presente nelle prime 10 righe
- Colonna A: orario
- Colonna B: titolo
- Colonna C: durata
- Colonna D: descrizione

## 🚦 Utilizzo

1. **Seleziona Canale**: Scegli tra Class CNBC o TV Moda
2. **Carica File**: Trascina o seleziona il file Excel
3. **Configura**: Verifica le impostazioni (timezone, gap filling, etc.)
4. **Converti**: Genera i file XMLTV
5. **Scarica**: Download ZIP con tutti i file generati

## 🐛 Troubleshooting

### Errore CORS con file locali
Usa un web server locale invece di aprire direttamente il file HTML.

### File Excel non riconosciuto
Verifica che il file sia in formato .xlsx o .xls e segua la struttura richiesta.

### Date non rilevate
- TV Moda: La data deve essere nelle prime 10 righe del foglio
- Class CNBC: Le date devono essere in celle singole (cambio giornata)

## 📄 Licenza

© 2025 Telesia S.p.A. - Tutti i diritti riservati

## 🆕 Changelog

### v4.0.0 (10/06/2025)
- Architettura completamente modulare
- Rimozione dark mode per semplicità
- File JSON per configurazioni modificabili
- Miglioramento performance con moduli ES6
- GitHub Pages compatibility

### v3.2.2
- Versione monolitica single-page
- Supporto dark mode
- Generazione automatica multi-file

## 🤝 Contributi

Per contribuire:
1. Fork del repository
2. Crea un branch per la feature
3. Commit delle modifiche
4. Push del branch
5. Apri una Pull Request

## 📞 Supporto

Per supporto tecnico contattare il team di sviluppo Telesia S.p.A.