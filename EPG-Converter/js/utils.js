/**
 * EPG Converter v4.0.0 - Utilities Module
 * Helper functions for date parsing, file handling, etc.
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
                    const workbook = XLSX.read(e.target.result, {
                        type: 'binary',
                        cellDates: true,
                        cellNF: false,
                        cellText: false
                    });
                    
                    resolve({ workbook });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsBinaryString(file);
        });
    }
    
    /**
     * Parse cell as date
     */
    parseCellAsDate(cell) {
        if (!cell) return null;
        
        // If it's already a Date object
        if (cell instanceof Date) {
            return isNaN(cell.getTime()) ? null : cell;
        }
        
        // If it's a string, try to parse it
        if (typeof cell === 'string') {
            const cleanStr = cell.trim();
            
            // Try Italian date formats
            const italianFormats = [
                /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
                /(\d{1,2})-(\d{1,2})-(\d{4})/,    // DD-MM-YYYY
                /(\d{1,2})\.(\d{1,2})\.(\d{4})/   // DD.MM.YYYY
            ];
            
            for (const format of italianFormats) {
                const match = cleanStr.match(format);
                if (match) {
                    const day = parseInt(match[1]);
                    const month = parseInt(match[2]) - 1; // JavaScript months are 0-based
                    const year = parseInt(match[3]);
                    const date = new Date(year, month, day);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                }
            }
            
            // Try parsing as standard date
            const date = new Date(cleanStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // If it's a number (Excel date serial)
        if (typeof cell === 'number' && cell > 0) {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + cell * 24 * 60 * 60 * 1000);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        return null;
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
     * Detect dates in TV Moda workbook
     */
    detectTVModaDates(workbook) {
        const detectedDates = [];
        const sheetData = {};
        
        this.app.log('\n🔍 Ricerca date nei fogli TV Moda...');
        
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
            
            this.app.log(`\nAnalisi foglio "${sheetName}":`);
            
            // Search for date in first 10 rows
            let foundDate = null;
            for (let i = 0; i < Math.min(10, data.length); i++) {
                const row = data[i];
                if (!row) continue;
                
                // Check each cell in the row
                for (let j = 0; j < row.length; j++) {
                    const cell = row[j];
                    if (!cell) continue;
                    
                    const parsedDate = this.parseCellAsDate(cell);
                    if (parsedDate) {
                        foundDate = parsedDate;
                        this.app.log(`  ✅ Data trovata in riga ${i+1}, colonna ${j+1}: ${parsedDate.toLocaleDateString('it-IT')}`);
                        break;
                    }
                }
                if (foundDate) break;
            }
            
            if (foundDate) {
                detectedDates.push({
                    sheetName: sheetName,
                    date: foundDate,
                    dateString: this.formatDateForFilename(foundDate)
                });
                
                sheetData[sheetName] = {
                    date: foundDate,
                    data: data
                };
            } else {
                this.app.log(`  ⚠️ Nessuna data trovata - foglio ignorato`);
            }
        }
        
        // Sort detected dates
        detectedDates.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        return { detectedDates, sheetData };
    }
    
    /**
     * Detect dates in Class CNBC data
     */
    detectClassCNBCDates(fileData) {
        const dates = [];
        
        // Scan for date change rows
        for (let i = 0; i < fileData.length; i++) {
            const row = fileData[i];
            
            if (!row || row.length === 0) continue;
            
            // Check if this is a date row (single cell with date)
            if (row.length === 1 || (row.length > 1 && !row[1])) {
                const parsedDate = this.parseCellAsDate(row[0]);
                if (parsedDate) {
                    dates.push({
                        sheetName: 'Sheet1',
                        date: parsedDate,
                        dateString: this.formatDateForFilename(parsedDate)
                    });
                }
            }
        }
        
        // Remove duplicates and sort
        const uniqueDates = [];
        const seen = new Set();
        for (const dateInfo of dates) {
            const key = dateInfo.date.toDateString();
            if (!seen.has(key)) {
                seen.add(key);
                uniqueDates.push(dateInfo);
            }
        }
        
        const sortedDates = uniqueDates.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // If no dates found, add today as default
        if (sortedDates.length === 0) {
            this.app.log('⚠️ Nessuna data trovata nel file Class CNBC - genererò un unico file per oggi');
            const today = new Date();
            sortedDates.push({
                sheetName: 'Sheet1',
                date: today,
                dateString: this.formatDateForFilename(today)
            });
        }
        
        return sortedDates;
    }
    
    /**
     * Get time ago string
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        const intervals = {
            anno: 31536000,
            mese: 2592000,
            settimana: 604800,
            giorno: 86400,
            ora: 3600,
            minuto: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 ? `1 ${unit} fa` : `${interval} ${unit === 'mese' ? 'mesi' : unit + 'i'} fa`;
            }
        }
        
        return 'Adesso';
    }
    
}