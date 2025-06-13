/**
 * XMLTV Viewer v4.2.1 - File Handler Module
 * Gestione caricamento, parsing e drag & drop file XML
 */

/**
 * Inizializza gestori eventi file
 */
function initializeFileHandlers() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    // Previeni comportamenti default drag
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Evidenzia drop zone
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('border-blue-500', 'bg-blue-50');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        }, false);
    });
    
    // Gestisci file droppati
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Gestisci selezione file
    fileInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });
}

/**
 * Previeni comportamenti default
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Gestisci drop file
 */
function handleDrop(e) {
    const files = e.dataTransfer.files;
    handleFiles(files);
}

/**
 * Gestisci file selezionati
 */
function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'text/xml' || file.type === 'application/xml' || file.name.endsWith('.xml')) {
            loadFile(file);
        } else {
            showToast('Seleziona un file XML valido', 'error');
        }
    }
}

/**
 * Carica e parsa file XML
 */
function loadFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const parser = new DOMParser();
            GlobalState.xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
            
            // Controlla errori parsing
            const parserError = GlobalState.xmlDoc.getElementsByTagName('parsererror');
            if (parserError.length > 0) {
                throw new Error('Errore nel parsing XML');
            }
            
            // Parsa info canale
            const channel = GlobalState.xmlDoc.querySelector('channel');
            if (!channel) {
                throw new Error('Nessun canale trovato nel file XML');
            }
            
            GlobalState.currentChannelId = channel.getAttribute('id');
            const displayName = channel.querySelector('display-name');
            GlobalState.currentChannelName = displayName ? displayName.textContent : GlobalState.currentChannelId;
            
            document.getElementById('channelName').textContent = GlobalState.currentChannelName;
            document.getElementById('channelId').textContent = `ID: ${GlobalState.currentChannelId}`;
            
            // Parsa programmi
            parsePrograms();
            
            // Mostra contenuto principale
            document.getElementById('mainContent').classList.remove('hidden');
            
            showToast('File caricato con successo', 'success');
        } catch (error) {
            console.error('Error loading file:', error);
            showToast('Errore nel caricamento del file: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

/**
 * Parsa programmi da XML
 */
function parsePrograms() {
    const programmes = GlobalState.xmlDoc.querySelectorAll('programme');
    GlobalState.currentPrograms = [];
    
    programmes.forEach((prog) => {
        const startStr = prog.getAttribute('start');
        const stopStr = prog.getAttribute('stop');
        
        if (!startStr || !stopStr) return;
        
        const start = parseXMLTVDate(startStr);
        const stop = parseXMLTVDate(stopStr);
        
        const title = prog.querySelector('title')?.textContent || '';
        const desc = prog.querySelector('desc')?.textContent || '';
        const category = prog.querySelector('category')?.textContent || '';
        const ratingValue = prog.querySelector('rating value');
        const rating = ratingValue ? ratingValue.textContent : '0';
        const icon = prog.querySelector('icon')?.getAttribute('src') || '';
        
        const program = {
            start,
            stop,
            title,
            desc,
            category,
            rating,
            icon,
            duration: (stop - start) / 1000, // secondi
            element: prog
        };
        
        GlobalState.currentPrograms.push(program);
        
        // Assegna colore al format
        if (!GlobalState.formatColors[title]) {
            GlobalState.formatColors[title] = COLOR_PALETTE[GlobalState.colorIndex % COLOR_PALETTE.length];
            GlobalState.colorIndex++;
        }
    });
    
    if (GlobalState.currentPrograms.length === 0) {
        showToast('Nessun programma trovato nel file', 'error');
        return;
    }
    
    // Ordina programmi per ora inizio
    GlobalState.currentPrograms.sort((a, b) => a.start - b.start);
    
    // Carica programmi
    loadPrograms();
}

/**
 * Parsa data XMLTV (supporta formato classico e ISO 8601)
 */
function parseXMLTVDate(dateStr) {
    // Controlla se è formato ISO 8601 (contiene 'T')
    if (dateStr.includes('T')) {
        // Formato ISO 8601: 2025-06-09T21:00:00+0000
        // Rimuovi info timezone e parsa come UTC
        const cleanDate = dateStr.replace(/[+-]\d{4}$/, '');
        const [datePart, timePart] = cleanDate.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));
    } else {
        // Formato XMLTV classico: YYYYMMDDHHmmss +0000
        const year = parseInt(dateStr.substr(0, 4));
        const month = parseInt(dateStr.substr(4, 2)) - 1;
        const day = parseInt(dateStr.substr(6, 2));
        const hour = parseInt(dateStr.substr(8, 2));
        const minute = parseInt(dateStr.substr(10, 2));
        const second = parseInt(dateStr.substr(12, 2));
        
        return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
}

/**
 * Formatta data in formato XMLTV ISO 8601
 */
function formatXMLTVDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+0000`;
}

// Esporta funzioni
window.initializeFileHandlers = initializeFileHandlers;
window.parseXMLTVDate = parseXMLTVDate;
window.formatXMLTVDate = formatXMLTVDate;