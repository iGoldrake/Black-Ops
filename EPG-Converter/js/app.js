/**
 * EPG Converter v4.0.0 - Main Application Module
 * Modular architecture for GitHub Pages deployment
 */

// Import modules
import { UIManager } from './ui.js';
import { XMLTVGenerator } from './converter.js';
import { Utils } from './utils.js';

// Main Application Class
class EPGConverter {
    constructor() {
        this.SOFTWARE_VERSION = "4.0.0";
        this.LAST_UPDATE = "10/06/2025";
        
        // State management
        this.state = {
            currentStep: 1,
            currentChannel: null,
            currentTab: 'general',
            fileData: null,
            xmltvFiles: [],
            workbook: null,
            detectedFormats: new Set(),
            detectedDates: [],
            tvModaSheetData: {},
            logContent: []
        };
        
        // Configuration
        this.config = {
            channels: {},
            formatIcons: {
                tvmoda: {},
                classcnbc: {}
            },
            categoryMapping: {},
            ratingMapping: {}
        };
        
        // Options (separate from config for clarity)
        this.options = {
            fillGaps: true,
            validateData: false,
            debugMode: false,
            useRealDates: true
        };
        
        // Initialize managers
        this.ui = null;
        this.converter = null;
        this.utils = null;
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Load configuration files
            await this.loadConfigurations();
            
            // Initialize managers
            this.utils = new Utils(this);
            this.ui = new UIManager(this);
            this.converter = new XMLTVGenerator(this);
            
            // Initialize UI
            this.ui.init();
            
            // Load preferences
            this.loadPreferences();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Log startup
            this.log('🚀 EPG Converter 4.0.0 - Modular Edition avviato');
            this.log('✅ Architettura modulare per GitHub Pages');
            this.log('🔧 File JSON modificabili manualmente');
            this.log('Seleziona il canale per iniziare la conversione');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.log(`❌ Errore inizializzazione: ${error.message}`);
        }
    }
    
    /**
     * Load configuration files
     */
    async loadConfigurations() {
        try {
            // Load format configurations
            const [tvModaFormats, classCnbcFormats, settings] = await Promise.all([
                fetch('config/formats-tvmoda.json').then(r => r.json()),
                fetch('config/formats-classcnbc.json').then(r => r.json()),
                fetch('config/settings.json').then(r => r.json())
            ]);
            
            // Apply configurations
            this.config.formatIcons.tvmoda = tvModaFormats;
            this.config.formatIcons.classcnbc = classCnbcFormats;
            
            // Apply settings
            Object.assign(this.config.channels, settings.channels);
            Object.assign(this.config.categoryMapping, settings.categoryMapping);
            Object.assign(this.config.ratingMapping, settings.ratingMapping);
            
        } catch (error) {
            console.error('Error loading configurations:', error);
            // Fallback to defaults if config files fail
            this.applyDefaultConfigurations();
        }
    }
    
    /**
     * Apply default configurations as fallback
     */
    applyDefaultConfigurations() {
        this.config.channels = {
            classcnbc: {
                id: 'ClassCNBC',
                name: 'Class CNBC',
                baseIconUrl: 'https://df4c28da231b4c30821e57d5f2111c23.msvdn.net/feeds/epg/ClassCNBC_IT_samsung/Images/'
            },
            tvmoda: {
                id: 'ClassTVModa',
                name: 'Class TV Moda',
                baseIconUrl: 'https://df4c28da231b4c30821e57d5f2111c23.msvdn.net/feeds/epg/ClassTVModa_IT_samsung/Images/'
            }
        };
        
        // Default mappings
        this.config.categoryMapping = {
            'Informazione': 'News',
            'Economia': 'Business',
            'Fashion': 'Fashion',
            'Lifestyle': 'Lifestyle'
        };
        
        this.config.ratingMapping = {
            'U': '0',
            'T': '6',
            'VM14': '14',
            'VM18': '18'
        };
    }
    
    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Channel selection
        document.querySelectorAll('.channel-card').forEach(card => {
            card.addEventListener('click', () => {
                const channel = card.dataset.channel;
                this.selectChannel(channel);
            });
        });
        
        // File upload
        const fileInput = document.getElementById('fileInput');
        const selectFileBtn = document.getElementById('select-file-btn');
        
        selectFileBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });
        
        // Upload area drag & drop
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
        
        // Navigation buttons
        document.getElementById('nav-step2')?.addEventListener('click', () => this.navigateToStep(2));
        document.getElementById('nav-step3')?.addEventListener('click', () => this.navigateToStep(3));
        document.getElementById('nav-step4')?.addEventListener('click', () => this.navigateToStep(4));
        document.getElementById('nav-step3-back')?.addEventListener('click', () => this.navigateToStep(3));
        
        // Convert button
        document.getElementById('convertBtn')?.addEventListener('click', () => this.convertFile());
        
        // Console actions
        document.getElementById('clear-log')?.addEventListener('click', () => this.clearLog());
        document.getElementById('export-log')?.addEventListener('click', () => this.exportLog());
        
        // Shortcuts button
        document.getElementById('shortcuts-btn')?.addEventListener('click', () => this.showShortcuts());
        
        // Tab system
        this.ui.initTabSystem();
        
        // Toggle switches
        document.querySelectorAll('.toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const option = toggle.dataset.option;
                this.toggleOption(option);
            });
        });
        
        // Icon management
        document.getElementById('scan-formats')?.addEventListener('click', () => this.scanForMissingFormats());
        document.getElementById('export-icons')?.addEventListener('click', () => this.exportIconMapping());
        document.getElementById('import-icons')?.addEventListener('click', () => this.importIconMapping());
        document.getElementById('add-format')?.addEventListener('click', () => this.addNewFormat());
        
        // Import file handler
        document.getElementById('importFile')?.addEventListener('change', (e) => this.handleImport(e));
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+O - Open file
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                if (this.state.currentStep >= 2) {
                    document.getElementById('fileInput').click();
                }
            }
            
            // Ctrl+Enter - Convert
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (this.state.currentStep === 4 && !document.getElementById('convertBtn').disabled) {
                    this.convertFile();
                }
            }
            
            // Ctrl+/ - Show shortcuts
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                this.showShortcuts();
            }
        });
    }
    
    /**
     * Select a channel
     */
    selectChannel(channel) {
        this.state.currentChannel = channel;
        
        // Update UI
        this.ui.updateChannelSelection(channel);
        
        // Update form values
        const config = this.config.channels[channel];
        document.getElementById('channelId').value = config.id;
        document.getElementById('channelName').value = config.name;
        document.getElementById('iconUrl').value = config.baseIconUrl;
        
        this.log(`✅ Canale selezionato: ${config.name}`);
        
        // Save session
        this.saveSession();
        
        // Move to next step
        this.state.currentStep = 2;
        this.navigateToStep(2);
    }
    
    /**
     * Navigate to a specific step
     */
    navigateToStep(step) {
        // Validate navigation
        if (step > this.state.currentStep && !this.canProceedToStep(step)) {
            this.ui.showStatus('Completa prima i passaggi precedenti', 'error');
            return;
        }
        
        // Update UI
        this.ui.updateStepNavigation(step);
        
        // Update current step if moving forward
        if (step > this.state.currentStep) {
            this.state.currentStep = step;
        }
    }
    
    /**
     * Check if user can proceed to step
     */
    canProceedToStep(step) {
        switch(step) {
            case 2:
                return this.state.currentChannel !== null;
            case 3:
                return this.state.currentChannel !== null && this.state.workbook !== null;
            case 4:
                return this.state.currentChannel !== null && this.state.workbook !== null;
            default:
                return true;
        }
    }
    
    /**
     * Handle file upload
     */
    async handleFile(file) {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            this.ui.showStatus('⚠️ Seleziona un file Excel (.xlsx o .xls)', 'error');
            return;
        }
        
        try {
            // Read file
            const data = await this.utils.readExcelFile(file);
            this.state.workbook = data.workbook;
            
            // Reset state
            this.state.detectedFormats.clear();
            this.state.detectedDates = [];
            this.state.tvModaSheetData = {};
            
            // Process based on channel
            if (this.state.currentChannel === 'tvmoda') {
                await this.processTVModaFile(file, data.workbook);
            } else {
                await this.processClassCNBCFile(file, data.workbook);
            }
            
            // Update UI
            this.ui.showFileInfo(file, this.state);
            this.ui.showDatePreview(this.state.detectedDates);
            
            // Enable convert button
            document.getElementById('convertBtn').disabled = false;
            
            // Auto-navigate to next step
            setTimeout(() => {
                this.state.currentStep = 3;
                this.navigateToStep(3);
            }, 1500);
            
        } catch (error) {
            this.ui.showStatus('❌ Errore nel leggere il file Excel', 'error');
            this.log(`Errore: ${error.message}`);
        }
    }
    
    /**
     * Process TV Moda file
     */
    async processTVModaFile(file, workbook) {
        this.log(`\n📁 Analisi file TV Moda: ${file.name}`);
        this.log(`   Fogli trovati: ${workbook.SheetNames.join(', ')}`);
        
        // Detect dates from sheets
        const dates = this.utils.detectTVModaDates(workbook);
        this.state.detectedDates = dates.detectedDates;
        this.state.tvModaSheetData = dates.sheetData;
        
        // Scan formats
        for (const dateInfo of this.state.detectedDates) {
            const worksheet = workbook.Sheets[dateInfo.sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
            
            for (let i = 3; i < data.length; i++) {
                const row = data[i];
                if (row && row[1] && typeof row[1] === 'string') {
                    this.state.detectedFormats.add(row[1].trim());
                }
            }
        }
        
        this.log(`   Format unici: ${this.state.detectedFormats.size}`);
        this.log(`   Date rilevate: ${this.state.detectedDates.length}`);
        this.log(`   🎯 Verranno generati ${this.state.detectedDates.length} file XML`);
        
        if (this.state.detectedDates.length === 0) {
            this.ui.showStatus('⚠️ Nessuna data valida trovata nei fogli TV Moda', 'error');
            this.log('❌ ERRORE: Impossibile trovare date valide nei fogli');
        }
    }
    
    /**
     * Process Class CNBC file
     */
    async processClassCNBCFile(file, workbook) {
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        this.state.fileData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
        
        // Detect dates
        this.state.detectedDates = this.utils.detectClassCNBCDates(this.state.fileData);
        
        // Scan formats
        for (let i = 1; i < this.state.fileData.length; i++) {
            const row = this.state.fileData[i];
            if (row && row[1] && typeof row[1] === 'string' && row.length > 10) {
                this.state.detectedFormats.add(row[1].trim());
            }
        }
        
        this.log(`📁 File Class CNBC caricato: ${file.name}`);
        this.log(`   Righe: ${this.state.fileData.length}`);
        this.log(`   Format unici: ${this.state.detectedFormats.size}`);
        this.log(`   Date rilevate: ${this.state.detectedDates.length}`);
        this.log(`   🎯 Verranno generati ${this.state.detectedDates.length} file XML`);
    }
    
    /**
     * Convert file to XMLTV
     */
    async convertFile() {
        if (!this.state.workbook && !this.state.fileData) {
            this.ui.showStatus('❌ Carica prima un file Excel', 'error');
            return;
        }
        
        // Show progress
        this.ui.showConversionProgress();
        
        // Get parameters
        const params = this.ui.getConversionParameters();
        
        // DEBUG: Verifichiamo cosa stiamo leggendo
        const timezoneSelect = document.getElementById('timezone');
        this.log(`\n🔍 DEBUG Timezone:`);
        this.log(`- Valore select: "${timezoneSelect.value}"`);
        this.log(`- Opzione selezionata: "${timezoneSelect.options[timezoneSelect.selectedIndex].text}"`);
        this.log(`- Parametro passato: ${params.timezoneOffset}`);
        
        this.log('\n🔧 CONFIGURAZIONE:');
        this.log(`- Tipo canale: ${this.state.currentChannel}`);
        this.log(`- Canale ID: ${params.channelId}`);
        this.log(`- Nome Canale: ${params.channelName}`);
        this.log(`- Timezone input: UTC${params.timezoneOffset >= 0 ? '+' : ''}${params.timezoneOffset}`);
        this.log(`- Output: UTC (conversione automatica)`);
        this.log(`- Gap filling: ${this.options.fillGaps ? 'ATTIVO' : 'DISATTIVO'}`);
        this.log(`- Date da processare: ${this.state.detectedDates.length}`);
        
        try {
            // Generate XML files
            this.state.xmltvFiles = [];
            
            for (let i = 0; i < this.state.detectedDates.length; i++) {
                const dateInfo = this.state.detectedDates[i];
                
                // Update progress
                this.ui.updateMultiProgress(i, dateInfo, 'processing');
                
                // Generate XML
                let xmlContent;
                if (this.state.currentChannel === 'tvmoda') {
                    xmlContent = await this.converter.generateXMLForTVModaSheet(
                        this.state.tvModaSheetData[dateInfo.sheetName],
                        dateInfo,
                        params
                    );
                } else {
                    xmlContent = await this.converter.generateXMLForClassCNBCDate(
                        this.state.fileData,
                        dateInfo,
                        params
                    );
                }
                
                if (xmlContent && xmlContent.length > 100) {
                    this.state.xmltvFiles.push({
                        date: dateInfo.date,
                        filename: `${dateInfo.dateString}.xml`,
                        content: xmlContent
                    });
                    
                    // Update progress
                    this.ui.updateMultiProgress(i, dateInfo, 'complete');
                }
                
                // Update overall progress
                const overallProgress = Math.round((i + 1) / this.state.detectedDates.length * 100);
                this.ui.updateProgress(overallProgress);
            }
            
            this.log(`✅ Generati ${this.state.xmltvFiles.length} file XML`);
            
            // Complete conversion
            setTimeout(() => {
                this.ui.hideConversionProgress();
                this.ui.showStatus('✅ Conversione completata con successo!', 'success');
                this.showDownload();
            }, 500);
            
        } catch (error) {
            this.ui.hideConversionProgress();
            this.ui.showStatus('❌ Errore durante la conversione', 'error');
            this.log(`Errore: ${error.message}`);
            console.error(error);
        }
    }
    
    /**
     * Show individual downloads
     */
    showIndividualDownloads() {
        this.ui.showIndividualDownloads(this.state.xmltvFiles);
    }
    
    /**
     * Show main download view
     */
    showDownload() {
        // Re-create ZIP and show main download
        this.showDownloadSection();
    }
    
    /**
     * Re-show download section
     */
    async showDownloadSection() {
        if (this.state.xmltvFiles.length > 0) {
            try {
                // Create ZIP file
                const zip = new JSZip();
                
                // Add all XML files
                for (const file of this.state.xmltvFiles) {
                    zip.file(file.filename, file.content);
                }
                
                // Generate ZIP
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const zipUrl = URL.createObjectURL(zipBlob);
                const zipFilename = `epg-${this.state.currentChannel}-${this.utils.formatDateForFilename(new Date())}.zip`;
                
                // Show download UI
                this.ui.showDownloadOptions(zipUrl, zipFilename, zipBlob.size, this.state.xmltvFiles);
                
                this.log(`✅ ZIP pronto: ${zipFilename} (${zipBlob.size} bytes)`);
                
                // Save session
                this.saveSession();
                
            } catch (error) {
                this.log(`Errore creazione ZIP: ${error.message}`);
                this.ui.showStatus('❌ Errore nella creazione del file ZIP', 'error');
            }
        } else {
            this.log('ERRORE: Nessun contenuto XML generato');
            this.ui.showStatus('❌ Nessun contenuto XML generato', 'error');
        }
    }
    
    /**
     * Toggle option
     */
    toggleOption(optionName) {
        this.options[optionName] = !this.options[optionName];
        const toggle = document.getElementById(optionName);
        toggle.classList.toggle('active', this.options[optionName]);
        
        this.log(`⚙️ ${optionName}: ${this.options[optionName] ? 'ATTIVO' : 'DISATTIVO'}`);
        this.savePreferences();
    }
    
    /**
     * Scan for missing formats - VERSIONE MIGLIORATA
     */
    scanForMissingFormats() {
        if (this.state.detectedFormats.size === 0) {
            this.ui.showStatus('⚠️ Carica prima un file Excel per verificare i format mancanti', 'info');
            this.log('⚠️ Nessun file caricato - impossibile verificare i format');
            return;
        }
        
        const formatIcons = this.config.formatIcons[this.state.currentChannel];
        const missingFormats = [];
        const foundFormats = [];
        
        // Verifica ogni format rilevato
        for (const format of this.state.detectedFormats) {
            const normalizedFormat = format.trim().toUpperCase();
            let found = false;
            
            for (const key of Object.keys(formatIcons)) {
                if (key.toUpperCase() === normalizedFormat) {
                    found = true;
                    foundFormats.push(format);
                    break;
                }
            }
            
            if (!found) {
                missingFormats.push(format);
            }
        }
        
        // Log dettagliato
        this.log('\n🔍 SCANSIONE FORMAT COMPLETATA:');
        this.log(`   Format totali rilevati: ${this.state.detectedFormats.size}`);
        this.log(`   Format con icona: ${foundFormats.length}`);
        this.log(`   Format SENZA icona: ${missingFormats.length}`);
        
        if (missingFormats.length === 0) {
            this.ui.showStatus('✅ Tutti i format hanno un\'icona associata!', 'success');
            this.log('✅ Tutti i format sono mappati correttamente!');
        } else {
            // Mostra i format mancanti nel log
            this.log('\n⚠️ FORMAT SENZA ICONA:');
            missingFormats.forEach((format, index) => {
                this.log(`   ${index + 1}. "${format}"`);
            });
            
            // Mostra il risultato nell'UI
            const scanResultDiv = document.getElementById('scan-result');
            if (scanResultDiv) {
                scanResultDiv.innerHTML = `
                    <div class="scan-result-content">
                        <h4>⚠️ ${missingFormats.length} format senza icona:</h4>
                        <div class="missing-formats-list">
                            ${missingFormats.slice(0, 10).map(f => `<div class="missing-format-item">• ${f}</div>`).join('')}
                            ${missingFormats.length > 10 ? `<div class="missing-format-item">... e altri ${missingFormats.length - 10}</div>` : ''}
                        </div>
                        <button class="btn btn-secondary mt-2" onclick="window.app.autoAddMissingFormats()">
                            Aggiungi tutti con icona default
                        </button>
                    </div>
                `;
                scanResultDiv.classList.remove('hidden');
            } else {
                // Fallback se non c'è il div scan-result
                this.ui.showStatus(`⚠️ ${missingFormats.length} format senza icona - controlla il log`, 'info');
            }
        }
    }
    
    /**
     * Auto-add missing formats with default icon
     */
    autoAddMissingFormats() {
        const formatIcons = this.config.formatIcons[this.state.currentChannel];
        const missingFormats = [];
        
        // Trova di nuovo i format mancanti
        for (const format of this.state.detectedFormats) {
            const normalizedFormat = format.trim().toUpperCase();
            let found = false;
            
            for (const key of Object.keys(formatIcons)) {
                if (key.toUpperCase() === normalizedFormat) {
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                missingFormats.push(format);
                formatIcons[format] = 'default.jpg';
            }
        }
        
        if (missingFormats.length > 0) {
            this.ui.updateIconList(this.state.currentChannel);
            this.ui.showStatus(`✅ Aggiunti ${missingFormats.length} format con icona default`, 'success');
            this.log(`✅ Aggiunti automaticamente ${missingFormats.length} format con icona default`);
            
            // Nascondi il risultato della scansione
            const scanResultDiv = document.getElementById('scan-result');
            if (scanResultDiv) {
                scanResultDiv.classList.add('hidden');
            }
        }
    }
    
    /**
     * Export icon mapping
     */
    exportIconMapping() {
        const formatIcons = this.config.formatIcons[this.state.currentChannel];
        const data = {
            channel: this.state.currentChannel,
            channelName: this.config.channels[this.state.currentChannel].name,
            formatIcons: formatIcons,
            defaultIcon: this.config.channels[this.state.currentChannel].baseIconUrl + 'default.jpg',
            exportDate: new Date().toISOString(),
            version: this.SOFTWARE_VERSION
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `format-icons-${this.state.currentChannel}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.log(`💾 Mappatura icone esportata per ${this.config.channels[this.state.currentChannel].name}`);
    }
    
    /**
     * Import icon mapping
     */
    importIconMapping() {
        document.getElementById('importFile').click();
    }
    
    /**
     * Handle import file
     */
    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.formatIcons) {
                    const formatIcons = this.config.formatIcons[this.state.currentChannel];
                    
                    // Clear existing
                    Object.keys(formatIcons).forEach(key => delete formatIcons[key]);
                    // Apply new
                    Object.assign(formatIcons, data.formatIcons);
                    
                    this.ui.updateIconList(this.state.currentChannel);
                    this.log(`📂 Mappatura importata: ${Object.keys(data.formatIcons).length} format`);
                    this.ui.showStatus('Mappatura icone importata con successo', 'success');
                } else {
                    this.ui.showStatus('File non valido', 'error');
                }
            } catch (error) {
                this.ui.showStatus('Errore nel leggere il file', 'error');
                this.log(`Errore importazione: ${error.message}`);
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    }
    
    /**
     * Add new format
     */
    addNewFormat() {
        const nameInput = document.getElementById('newFormatName');
        const iconInput = document.getElementById('newFormatIcon');
        
        const name = nameInput.value.trim();
        const icon = iconInput.value.trim() || 'default.jpg';
        
        if (!name) {
            this.ui.showStatus('Inserisci il nome del format', 'error');
            return;
        }
        
        const formatIcons = this.config.formatIcons[this.state.currentChannel];
        formatIcons[name] = icon;
        
        nameInput.value = '';
        iconInput.value = '';
        
        this.ui.updateIconList(this.state.currentChannel);
        this.log(`✅ Nuovo format aggiunto: "${name}"`);
        this.ui.showStatus(`Format "${name}" aggiunto con successo`, 'success');
    }
    
    /**
     * Edit format
     */
    editFormat(format) {
        const formatIcons = this.config.formatIcons[this.state.currentChannel];
        const newFilename = prompt(`Modifica filename per "${format}":`, formatIcons[format]);
        
        if (newFilename !== null && newFilename.trim() !== '') {
            formatIcons[format] = newFilename.trim();
            this.ui.updateIconList(this.state.currentChannel);
            this.log(`📝 Icona aggiornata per format "${format}"`);
        }
    }
    
    /**
     * Remove format
     */
    removeFormat(format) {
        if (confirm(`Rimuovere il format "${format}"?`)) {
            const formatIcons = this.config.formatIcons[this.state.currentChannel];
            delete formatIcons[format];
            this.ui.updateIconList(this.state.currentChannel);
            this.log(`🗑️ Format "${format}" rimosso`);
        }
    }
    
    /**
     * Show keyboard shortcuts
     */
    showShortcuts() {
        const shortcuts = [
            { key: 'Ctrl + O', action: 'Apri file' },
            { key: 'Ctrl + Enter', action: 'Converti' },
            { key: 'Ctrl + /', action: 'Mostra shortcuts' }
        ];
        
        const content = shortcuts.map(s => `${s.key} - ${s.action}`).join('\n');
        alert(`Scorciatoie da tastiera:\n\n${content}`);
    }
    
    /**
     * Log message
     */
    log(message) {
        const timestamp = new Date().toLocaleTimeString('it-IT');
        const logEntry = `[${timestamp}] ${message}`;
        this.state.logContent.push(logEntry);
        
        const logDiv = document.getElementById('log');
        logDiv.innerHTML += logEntry + '\n';
        logDiv.scrollTop = logDiv.scrollHeight;
    }
    
    /**
     * Clear log
     */
    clearLog() {
        this.state.logContent = [];
        document.getElementById('log').innerHTML = '';
        this.log('🧹 Console pulita');
    }
    
    /**
     * Export log
     */
    exportLog() {
        const logText = this.state.logContent.join('\n');
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `epg-converter-log-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Save preferences
     */
    savePreferences() {
        const prefs = {
            options: this.options,
            lastChannel: this.state.currentChannel
        };
        localStorage.setItem('epg-preferences', JSON.stringify(prefs));
    }
    
    /**
     * Load preferences
     */
    loadPreferences() {
        const saved = localStorage.getItem('epg-preferences');
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                
                // Apply options
                if (prefs.options) {
                    Object.assign(this.options, prefs.options);
                    
                    // Update UI
                    Object.keys(this.options).forEach(key => {
                        const toggle = document.getElementById(key);
                        if (toggle) {
                            toggle.classList.toggle('active', this.options[key]);
                        }
                    });
                }
            } catch (e) {
                console.error('Error loading preferences:', e);
            }
        }
    }
    
    /**
     * Save session
     */
    saveSession() {
        const session = {
            date: new Date().toISOString(),
            channel: this.state.currentChannel,
            channelName: this.config.channels[this.state.currentChannel]?.name || '',
            settings: {
                channelId: document.getElementById('channelId').value,
                timezone: document.getElementById('timezone').value
            }
        };
        
        let sessions = JSON.parse(localStorage.getItem('epg-sessions') || '[]');
        sessions.unshift(session);
        sessions = sessions.slice(0, 5); // Keep last 5
        
        localStorage.setItem('epg-sessions', JSON.stringify(sessions));
        this.ui.loadRecentSessions();
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EPGConverter();
    window.app.init();
});

// Export for module access
export { EPGConverter };
