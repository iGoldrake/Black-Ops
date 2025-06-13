/**
 * XMLTV Viewer v4.2.1 - Main Module
 * Gestione inizializzazione applicazione e stato globale
 */

// Costanti applicazione
const APP_VERSION = '4.2.1';
console.log(`XMLTV Viewer v${APP_VERSION} - Treemap Sequential Timeline`);

// Stato globale applicazione
const GlobalState = {
    xmlDoc: null,
    currentPrograms: [],
    currentChannelId: '',
    currentChannelName: '',
    formatColors: {},
    colorIndex: 0,
    currentPreviewTimeout: null,
    totalDaySeconds: 86400, // 24 ore in secondi
    currentLayout: 'squarify', // Algoritmo layout treemap
    formatGroups: {} // Gruppi format per treemap
};

// Palette colori moderna per format
const COLOR_PALETTE = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
    '#10b981', '#06b6d4', '#6366f1', '#f43f5e',
    '#84cc16', '#a855f7', '#0ea5e9', '#f97316',
    '#14b8a6', '#d946ef', '#0891b2', '#dc2626'
];

// Inizializzazione al caricamento DOM
window.addEventListener('DOMContentLoaded', function() {
    // Inizializza icone Lucide
    lucide.createIcons();
    
    // Carica preferenze dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
    }
    
    // Inizializza gestori file
    initializeFileHandlers();
    
    console.log('XMLTV Viewer v4.2.1 - Ready!');
});

/**
 * Carica programmi dopo parsing XML
 */
function loadPrograms() {
    // Mostra numero programmi
    document.getElementById('programCount').textContent = GlobalState.currentPrograms.length;
    
    // Imposta info periodo
    if (GlobalState.currentPrograms.length > 0) {
        const firstDate = formatDate(GlobalState.currentPrograms[0].start);
        const lastDate = formatDate(GlobalState.currentPrograms[GlobalState.currentPrograms.length - 1].stop);
        if (firstDate === lastDate) {
            document.getElementById('scheduleDate').textContent = firstDate;
        } else {
            document.getElementById('scheduleDate').textContent = `${firstDate} - ${lastDate}`;
        }
    }
    
    // Disegna treemap
    drawTreemap(GlobalState.currentPrograms);
    
    // Aggiorna tabella editor
    updateProgramTable(GlobalState.currentPrograms);
    
    // Aggiorna statistiche
    updateStatistics(GlobalState.currentPrograms);
    
    // Controlla problemi
    checkProblems(GlobalState.currentPrograms);
    
    // Aggiorna legenda format
    updateFormatLegend(GlobalState.currentPrograms);
}

/**
 * Toggle Dark Mode
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark'));
}

/**
 * Mostra informazioni app
 */
function showInfo() {
    alert(`XMLTV Viewer v${APP_VERSION}\n\nTreemap Aggregato per Format\n\nNuove Funzionalità v4.2.1:\n- VISUALIZZAZIONE SEMPLIFICATA: Mostra tutti i programmi nel file\n- Nessuna conversione timezone, mostra gli orari come sono nel file\n- Treemap basato sulla durata totale di ogni format\n- Statistiche aggregate per tutti i programmi\n- Editor programmi con date/ore originali\n\nFunzionalità esistenti:\n- Visualizzazione TREEMAP AGGREGATA per format\n- 3 algoritmi di layout: Squarify, Binary, Slice & Dice\n- Editor inline programmi\n- Attualizzazione date palinsesto\n- Export XMLTV\n\nSviluppato per Class CNBC e Class TV Moda`);
}

/**
 * Cambia layout treemap
 */
function setLayout(layout) {
    GlobalState.currentLayout = layout;
    
    // Aggiorna UI
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-layout="${layout}"]`).classList.add('active');
    
    // Ridisegna
    if (GlobalState.currentPrograms.length > 0) {
        loadPrograms();
    }
    
    showToast(`Layout cambiato in ${layout}`, 'success');
}

// Esporta funzioni globali per HTML
window.GlobalState = GlobalState;
window.COLOR_PALETTE = COLOR_PALETTE;
window.loadPrograms = loadPrograms;
window.toggleDarkMode = toggleDarkMode;
window.showInfo = showInfo;
window.setLayout = setLayout;
