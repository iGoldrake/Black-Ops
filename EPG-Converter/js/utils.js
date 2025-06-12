/**
 * EPG Converter v4.0.0 - Utilities Module
 * Common utility functions
 */

export class Utils {
    constructor(app) {
        this.app = app;
    }
    
    /**
     * Read Excel file and return workbook
     */
    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { 
                        type: 'binary',
                        cellDates: true,
                        cellNF: false,
                        cellText: false
                    });
                    
                    resolve({ workbook, data });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsBinaryString(file);
        });
    }
    
    /**
     * Detect dates from TV Moda sheets
     */
    detectTVModaDates(workbook) {
        const detectedDates = [];
        const sheetData = {};
        
        this.app.log('\n🔍 Ricerca date nei fogli TV Moda...');
        
        for (const sheetName of workbook.SheetNames) {
            this.app.log(`\nAnalisi foglio "${sheetName}":`);
            
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
            
            // Store sheet data for later use
            sheetData[sheetName] = { data };
            
            // Look for date in the first few rows
            let dateFound = false;
            for (let row = 0; row < Math.min(10, data.length); row++) {
                for (let col = 0; col < Math.min(5, data[row]?.length || 0); col++) {
                    const cell = data[row][col];
                    const parsedDate = this.parseDate(cell);
                    
                    if (parsedDate && this.isValidDate(parsedDate)) {
                        const dateString = this.formatDateForFilename(parsedDate);
                        
                        detectedDates.push({
                            sheetName: sheetName,
                            date: parsedDate,
                            dateString: dateString,
                            row: row,
                            col: col
                        });
                        
                        this.app.log(`  ✅ Data trovata in riga ${row + 1}, colonna ${col + 1}: ${parsedDate.toLocaleDateString('it-IT')}`);
                        dateFound = true;
                        break;
                    }
                }
                if (dateFound) break;
            }
            
            if (!dateFound) {
                this.app.log(`  ❌ Nessuna data valida trovata nel foglio`);
            }
        }
        
        // Sort dates chronologically
        detectedDates.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        return { detectedDates, sheetData };
    }
    
    /**
     * Detect dates from Class CNBC file
     */
    detectClassCNBCDates(data) {
        const dates = [];
        const uniqueDates = new Set();
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            // Check if it's a date row (single cell with date)
            if (row && row.length === 1 && row[0]) {
                const parsedDate = this.parseDate(row[0]);
                
                if (parsedDate && this.isValidDate(parsedDate)) {
                    const dateString = this.formatDateForFilename(parsedDate);
                    
                    if (!uniqueDates.has(dateString)) {
                        uniqueDates.add(dateString);
                        dates.push({
                            date: parsedDate,
                            dateString: dateString,
                            row: i
                        });
                    }
                }
            }
        }
        
        // Sort dates chronologically
        dates.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        return dates;
    }
    
    /**
     * Parse date from various formats
     */
    parseDate(value) {
        if (!value) return null;
        
        try {
            let date = null;
            
            // If it's already a Date object
            if (value instanceof Date) {
                date = new Date(value);
            }
            // If it's a number (Excel serial date)
            else if (typeof value === 'number') {
                // Excel date serial number
                date = this.excelDateToJS(value);
            }
            // If it's a string
            else if (typeof value === 'string') {
                // Try to parse Italian date format (DD/MM/YYYY)
                const italianMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (italianMatch) {
                    const [, day, month, year] = italianMatch;
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                } else {
                    // Try standard parsing
                    date = new Date(value);
                }
            }
            
            // Validate the date
            if (date && !isNaN(date.getTime())) {
                return date;
            }
        } catch (e) {
            // Ignore parsing errors
        }
        
        return null;
    }
    
    /**
     * Convert Excel serial date to JavaScript Date
     */
    excelDateToJS(serial) {
        // Excel dates start from 1900-01-01
        // But Excel incorrectly treats 1900 as a leap year
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + serial * 86400000);
    }
    
    /**
     * Check if date is valid (not too far in past or future)
     */
    isValidDate(date) {
        const now = new Date();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        const oneYearFromNow = new Date(now);
        oneYearFromNow.setFullYear(now.getFullYear() + 1);
        
        return date >= oneYearAgo && date <= oneYearFromNow;
    }
    
    /**
     * Format date for filename (YYYY-MM-DD)
     */
    formatDateForFilename(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Get time ago string
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'Adesso';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minuti fa`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} ore fa`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} giorni fa`;
        if (seconds < 2592000) return `${Math.floor(seconds / 604800)} settimane fa`;
        return `${Math.floor(seconds / 2592000)} mesi fa`;
    }
    
    /**
     * Validate channel configuration
     */
    validateChannelConfig(params) {
        const errors = [];
        
        if (!params.channelId || params.channelId.trim() === '') {
            errors.push('ID Canale è obbligatorio');
        }
        
        if (!params.channelName || params.channelName.trim() === '') {
            errors.push('Nome Canale è obbligatorio');
        }
        
        if (params.timezoneOffset === undefined || params.timezoneOffset === null) {
            errors.push('Timezone non valido');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Create safe filename
     */
    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9_\-\.]/gi, '_');
    }
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Object) {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }
    
    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Check if browser supports required features
     */
    checkBrowserSupport() {
        const required = {
            'FileReader': typeof FileReader !== 'undefined',
            'Blob': typeof Blob !== 'undefined',
            'Promise': typeof Promise !== 'undefined',
            'localStorage': typeof localStorage !== 'undefined'
        };
        
        const missing = [];
        for (const [feature, supported] of Object.entries(required)) {
            if (!supported) {
                missing.push(feature);
            }
        }
        
        return {
            supported: missing.length === 0,
            missing: missing
        };
    }
}
