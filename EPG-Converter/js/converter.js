/**
 * EPG Converter v4.0.0 - XMLTV Generator Module
 * Handles conversion from Excel to XMLTV format
 */

export class XMLTVGenerator {
    constructor(app) {
        this.app = app;
    }
    
    /**
     * Escape XML special characters
     */
    escapeXml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    /**
     * Capitalize title (first letter uppercase, rest lowercase)
     */
    capitalizeTitle(title) {
        if (!title) return '';
        return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
    }
    
    /**
     * Format date for XMLTV (converts to UTC)
     */
    formatXMLTVDate(date, timezoneOffset) {
        // TODO: Implement UTC conversion logic
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+0000`;
    }
    
    /**
     * Get icon URL for format
     */
    getIconForFormat(format, channel) {
        if (!format) return this.app.config.channels[channel].baseIconUrl + 'default.jpg';
        
        const formatIcons = this.app.config.formatIcons[channel];
        const normalizedFormat = format.trim().toUpperCase();
        
        for (const [key, value] of Object.entries(formatIcons)) {
            if (key.toUpperCase() === normalizedFormat) {
                return this.app.config.channels[channel].baseIconUrl + value;
            }
        }
        
        return this.app.config.channels[channel].baseIconUrl + 'default.jpg';
    }
    
    /**
     * Generate XMLTV for TV Moda sheet
     */
    async generateXMLForTVModaSheet(sheetData, dateInfo, params) {
        // TODO: Implement TV Moda XML generation
        this.app.log(`Generazione XMLTV per ${dateInfo.sheetName} - ${dateInfo.date.toLocaleDateString('it-IT')}...`);
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += `<tv date="${dateInfo.date.toISOString().split('T')[0]}">\n`;
        xml += `  <channel id="${params.channelId}">\n`;
        xml += `    <display-name lang="it">${params.channelName}</display-name>\n`;
        xml += `  </channel>\n\n`;
        
        // TODO: Parse programs and generate programme elements
        
        xml += '</tv>';
        
        return xml;
    }
    
    /**
     * Generate XMLTV for Class CNBC date
     */
    async generateXMLForClassCNBCDate(fileData, dateInfo, params) {
        // TODO: Implement Class CNBC XML generation
        this.app.log(`Generazione XMLTV per ${dateInfo.date.toLocaleDateString('it-IT')}...`);
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += `<tv date="${dateInfo.date.toISOString().split('T')[0]}">\n`;
        xml += `  <channel id="${params.channelId}">\n`;
        xml += `    <display-name lang="it">${params.channelName}</display-name>\n`;
        xml += `  </channel>\n\n`;
        
        // TODO: Parse programs and generate programme elements
        
        xml += '</tv>';
        
        return xml;
    }
    
    // TODO: Add remaining conversion methods:
    // - parseTVModaDayPrograms()
    // - parseClassCNBCProgramsForDate()
    // - processProgramsForSingleDay()
    // - generateProgrammeXML()
    // - parseTime()
    // - parseDuration()
    // - calculateDurations()
    // - fillGapsInDay()
    // - etc...
}