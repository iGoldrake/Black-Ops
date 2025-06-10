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
            options: {
                fillGaps: true,
                validateData: false,
                debugMode: false,
                useRealDates: true
            },
            categoryMapping: {},
            ratingMapping: {}
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
        this.log(`   🎯 Verranno generati ${this.state.detectedDates