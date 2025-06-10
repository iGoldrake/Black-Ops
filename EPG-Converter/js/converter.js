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
        // IMPORTANTE: Le date da Excel potrebbero non avere il timezone corretto
        // Dobbiamo forzare la conversione manuale
        
        // Log per debug
        if (!this._debugLogged) {
            this.app.log(`🕐 DEBUG formatXMLTVDate:`);
            this.app.log(`- Timezone offset: ${timezoneOffset}`);
            this.app.log(`- Data input: ${date.toString()}`);
            this.app.log(`- Data input ISO: ${date.toISOString()}`);
            this._debugLogged = true;
        }
        
        // Prendiamo i componenti della data in ora locale
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        
        // Creiamo una nuova data UTC con i valori locali
        // e poi sottraiamo l'offset
        const localDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
        const utcTime = localDate.getTime() - (timezoneOffset * 60 * 60 * 1000);
        const utcDate = new Date(utcTime);
        
        // Formattiamo usando i metodi UTC
        const utcYear = utcDate.getUTCFullYear();
        const utcMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
        const utcDay = String(utcDate.getUTCDate()).padStart(2, '0');
        const utcHours = String(utcDate.getUTCHours()).padStart(2, '0');
        const utcMinutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
        const utcSeconds = String(utcDate.getUTCSeconds()).padStart(2, '0');
        
        // Debug: verifichiamo la conversione
        if (!this._logCount) this._logCount = 0;
        if (this._logCount < 3) {
            this.app.log(`📅 Conversione dettagliata:`);
            this.app.log(`   - Locale: ${day}/${month+1}/${year} ${hours}:${minutes}`);
            this.app.log(`   - UTC: ${utcDay}/${utcMonth}/${utcYear} ${utcHours}:${utcMinutes}`);
            this.app.log(`   - Differenza ore: ${hours - parseInt(utcHours)}`);
            this._logCount++;
        }
        
        // Formato XMLTV: YYYYMMDDTHH:MM:SS+0000
        return `${utcYear}${utcMonth}${utcDay}T${utcHours}:${utcMinutes}:${utcSeconds}+0000`;
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
        this.app.log(`\n📺 Generazione XMLTV per ${dateInfo.sheetName} - ${dateInfo.date.toLocaleDateString('it-IT')}...`);
        this.app.log(`🕐 Conversione orari da UTC${params.timezoneOffset >= 0 ? '+' : ''}${params.timezoneOffset} a UTC`);
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += `<tv date="${dateInfo.date.toISOString().split('T')[0]}">\n`;
        xml += `  <channel id="${params.channelId}">\n`;
        xml += `    <display-name lang="it">${params.channelName}</display-name>\n`;
        xml += `  </channel>\n\n`;
        
        const programs = this.parseTVModaDayPrograms(sheetData.data, dateInfo.date);
        const processedPrograms = this.processProgramsForSingleDay(
            programs, 
            dateInfo.date, 
            params.fillGaps, 
            'tvmoda'
        );
        
        for (const program of processedPrograms) {
            xml += this.generateProgrammeXML(program, params.channelId, params.timezoneOffset, 'tvmoda');
        }
        
        xml += '</tv>';
        
        this.app.log(`✅ Generati ${processedPrograms.length} programmi per ${dateInfo.date.toLocaleDateString('it-IT')}`);
        
        return xml;
    }
    
    /**
     * Generate XMLTV for Class CNBC date
     */
    async generateXMLForClassCNBCDate(fileData, dateInfo, params) {
        const targetDate = dateInfo.date;
        this.app.log(`\n📺 Generazione XMLTV per Class CNBC - ${targetDate.toLocaleDateString('it-IT')}...`);
        this.app.log(`🕐 Conversione orari da UTC${params.timezoneOffset >= 0 ? '+' : ''}${params.timezoneOffset} a UTC`);
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += `<tv date="${targetDate.toISOString().split('T')[0]}">\n`;
        xml += `  <channel id="${params.channelId}">\n`;
        xml += `    <display-name lang="it">${params.channelName}</display-name>\n`;
        xml += `  </channel>\n\n`;
        
        const programs = this.parseClassCNBCProgramsForDate(fileData, targetDate);
        const processedPrograms = this.processProgramsForSingleDay(
            programs, 
            targetDate, 
            params.fillGaps, 
            'classcnbc'
        );
        
        for (const program of processedPrograms) {
            xml += this.generateProgrammeXML(program, params.channelId, params.timezoneOffset, 'classcnbc');
        }
        
        xml += '</tv>';
        
        this.app.log(`✅ Generati ${processedPrograms.length} programmi per ${targetDate.toLocaleDateString('it-IT')}`);
        
        return xml;
    }
    
    /**
     * Parse TV Moda programs for a day
     */
    parseTVModaDayPrograms(data, currentDate) {
        const programs = [];
        
        for (let i = 3; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 4) continue;
            
            const startTime = row[0];
            const title = row[1];
            const duration = row[2];
            const description = row[3];
            
            if (!title || !startTime) continue;
            
            const programTime = this.parseTime(startTime, currentDate);
            if (!programTime) continue;
            
            const durationMinutes = this.parseDuration(duration);
            
            programs.push({
                startTime: programTime,
                endTime: new Date(programTime.getTime() + durationMinutes * 60 * 1000),
                title: title,
                description: description || '',
                duration: durationMinutes * 60,
                category: 'Fashion',
                format: title
            });
        }
        
        return programs;
    }
    
    /**
     * Parse Class CNBC programs for a specific date
     */
    parseClassCNBCProgramsForDate(data, targetDate) {
        const allPrograms = [];
        let currentDate = null;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            if (!row || row.length === 0) continue;
            
            // Check if this is a date row
            if (row.length === 1 && row[0]) {
                const newDate = this.parseDate(row[0]);
                if (newDate) {
                    currentDate = newDate;
                }
                continue;
            }
            
            if (row.length < 10) continue;
            
            const program = this.parseClassCNBCProgram(row, currentDate || targetDate);
            if (program) {
                // Check if program is on target date
                const programDateStr = this.formatDateString(program.startTime);
                const targetDateStr = this.formatDateString(targetDate);
                
                if (programDateStr === targetDateStr) {
                    allPrograms.push(program);
                }
            }
        }
        
        return allPrograms;
    }
    
    /**
     * Parse single Class CNBC program row
     */
    parseClassCNBCProgram(row, currentDate) {
        const timeObj = row[0];
        const title = row[1];
        const programId = row[2];
        const category = row[6] || row[7];
        const rating = row[13];
        const shortDesc = row[15];
        const longDesc = row[16];
        
        if (!title || !programId) return null;
        
        const programTime = this.parseTime(timeObj, currentDate);
        if (!programTime) return null;
        
        return {
            startTime: programTime,
            title: title,
            programId: programId,
            category: category,
            rating: rating,
            shortDesc: shortDesc,
            longDesc: longDesc,
            format: title
        };
    }
    
    /**
     * Process programs for a single day
     */
    processProgramsForSingleDay(programs, targetDate, fillGaps, channel) {
        // Sort programs by start time
        programs.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        
        // Calculate durations
        this.calculateDurations(programs, fillGaps);
        
        // Process for the specific day
        const dayPrograms = this.processDayPrograms(programs, targetDate, channel, fillGaps);
        
        return dayPrograms;
    }
    
    /**
     * Process programs for a specific day
     */
    processDayPrograms(allPrograms, targetDate, channel, fillGaps) {
        const targetStart = new Date(targetDate);
        targetStart.setHours(0, 0, 0, 0);
        const targetEnd = new Date(targetDate);
        targetEnd.setHours(23, 59, 59, 999);
        
        this.app.log(`\n🗓️ Processo programmi per ${targetDate.toLocaleDateString('it-IT')}...`);
        
        // Filter programs that touch this day
        const dayPrograms = allPrograms.filter(program => {
            return (program.startTime >= targetStart && program.startTime <= targetEnd) ||
                   (program.endTime >= targetStart && program.endTime <= targetEnd) ||
                   (program.startTime < targetStart && program.endTime > targetEnd);
        });
        
        this.app.log(`  Trovati ${dayPrograms.length} programmi che toccano questa giornata`);
        
        // Remove duplicates
        const uniquePrograms = this.removeDuplicatePrograms(dayPrograms);
        this.app.log(`  Dopo rimozione duplicati: ${uniquePrograms.length} programmi`);
        
        // Check for overlaps
        this.checkForOverlaps(uniquePrograms);
        
        // Adjust programs for day boundaries
        const adjustedPrograms = this.adjustProgramsForDay(uniquePrograms, targetStart, targetEnd);
        
        // Fill gaps if enabled
        const filledPrograms = fillGaps ? this.fillGapsInDay(adjustedPrograms, targetStart, targetEnd, channel) : adjustedPrograms;
        
        const totalMinutes = filledPrograms.reduce((sum, p) => sum + (p.duration / 60), 0);
        this.app.log(`  ✅ Copertura totale: ${totalMinutes.toFixed(0)} minuti (su 1440 attesi)`);
        
        return filledPrograms;
    }
    
    /**
     * Calculate program durations
     */
    calculateDurations(programs, fillGaps) {
        if (!fillGaps || programs.length < 2) {
            // Default duration if not filling gaps
            programs.forEach(program => {
                if (!program.endTime) {
                    program.endTime = new Date(program.startTime.getTime() + 30 * 60 * 1000);
                    program.duration = 30 * 60;
                }
            });
            return;
        }
        
        this.app.log('\n⏱️ Applico gap filling...');
        
        for (let i = 0; i < programs.length; i++) {
            const currentProgram = programs[i];
            let endTime;
            
            if (i + 1 < programs.length) {
                const nextProgram = programs[i + 1];
                const currentDay = currentProgram.startTime.toDateString();
                const nextDay = nextProgram.startTime.toDateString();
                
                if (currentDay === nextDay) {
                    endTime = new Date(nextProgram.startTime);
                } else {
                    // End of day
                    endTime = new Date(currentProgram.startTime);
                    endTime.setHours(23, 59, 59, 999);
                }
            } else {
                // Last program
                endTime = new Date(currentProgram.startTime);
                endTime.setMinutes(endTime.getMinutes() + 30);
            }
            
            currentProgram.endTime = endTime;
            currentProgram.duration = Math.max(60, Math.floor((endTime - currentProgram.startTime) / 1000));
        }
    }
    
    /**
     * Remove duplicate programs
     */
    removeDuplicatePrograms(programs) {
        const seen = new Map();
        const unique = [];
        
        for (const program of programs) {
            const key = `${program.startTime.getTime()}_${program.title}`;
            
            if (!seen.has(key)) {
                seen.set(key, true);
                unique.push(program);
            } else {
                this.app.log(`  ⚠️ Duplicato rimosso: "${program.title}" alle ${program.startTime.toLocaleTimeString('it-IT')}`);
            }
        }
        
        return unique.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    
    /**
     * Check and fix overlapping programs
     */
    checkForOverlaps(programs) {
        for (let i = 0; i < programs.length - 1; i++) {
            const current = programs[i];
            const next = programs[i + 1];
            
            if (current.endTime > next.startTime) {
                const overlapMinutes = (current.endTime - next.startTime) / (1000 * 60);
                this.app.log(`  ⚠️ SOVRAPPOSIZIONE: "${current.title}" finisce alle ${current.endTime.toLocaleTimeString('it-IT')} ma "${next.title}" inizia alle ${next.startTime.toLocaleTimeString('it-IT')} (${overlapMinutes.toFixed(1)} minuti di sovrapposizione)`);
                
                // Fix overlap
                current.endTime = new Date(next.startTime);
                current.duration = Math.floor((current.endTime - current.startTime) / 1000);
                this.app.log(`  ✅ Auto-fix: aggiustata fine di "${current.title}" alle ${current.endTime.toLocaleTimeString('it-IT')}`);
            }
        }
    }
    
    /**
     * Adjust programs for day boundaries
     */
    adjustProgramsForDay(programs, targetStart, targetEnd) {
        const adjusted = [];
        
        for (const program of programs) {
            const adjustedProgram = { ...program };
            
            // Adjust start if before day start
            if (program.startTime < targetStart) {
                adjustedProgram.startTime = new Date(targetStart);
                adjustedProgram.wasAdjustedStart = true;
                this.app.log(`  📅 Adattato inizio di "${program.title}" da ${program.startTime.toLocaleTimeString('it-IT')} a 00:00:00`);
            }
            
            // Adjust end if after day end
            if (program.endTime > targetEnd) {
                adjustedProgram.endTime = new Date(targetEnd);
                adjustedProgram.endTime.setSeconds(59);
                adjustedProgram.wasAdjustedEnd = true;
                this.app.log(`  📅 Adattato fine di "${program.title}" da ${program.endTime.toLocaleTimeString('it-IT')} a 23:59:59`);
            }
            
            // Recalculate duration
            adjustedProgram.duration = Math.floor((adjustedProgram.endTime - adjustedProgram.startTime) / 1000);
            
            if (adjustedProgram.duration > 0) {
                adjusted.push(adjustedProgram);
            }
        }
        
        return adjusted.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    
    /**
     * Fill gaps in day schedule
     */
    fillGapsInDay(programs, targetStart, targetEnd, channel) {
        if (programs.length === 0) {
            this.app.log(`  ⚠️ Nessun programma trovato - creo filler per l'intera giornata`);
            return [this.createFillerProgram(targetStart, targetEnd, channel, true)];
        }
        
        const filled = [];
        let currentTime = new Date(targetStart);
        
        for (const program of programs) {
            // Check for gap before program
            if (program.startTime > currentTime) {
                const gapMinutes = (program.startTime - currentTime) / (1000 * 60);
                this.app.log(`  ⚠️ Buco di ${gapMinutes.toFixed(0)} minuti prima di "${program.title}"`);
                filled.push(this.createFillerProgram(currentTime, program.startTime, channel, false));
            }
            
            filled.push(program);
            currentTime = new Date(program.endTime);
        }
        
        // Check for gap at end of day
        if (currentTime < targetEnd) {
            const gapMinutes = (targetEnd - currentTime) / (1000 * 60);
            this.app.log(`  ⚠️ Buco di ${gapMinutes.toFixed(0)} minuti alla fine della giornata`);
            
            const fillerEnd = new Date(targetEnd);
            fillerEnd.setSeconds(59);
            filled.push(this.createFillerProgram(currentTime, fillerEnd, channel, false));
        }
        
        return filled;
    }
    
    /**
     * Create filler program
     */
    createFillerProgram(startTime, endTime, channel, isFullDay) {
        const title = isFullDay ? "Programmazione" : "Programmazione notturna";
        return {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            title: title,
            programId: channel === 'classcnbc' ? (isFullDay ? "FILLER_DAY" : "FILLER_NIGHT") : undefined,
            description: title,
            duration: (endTime - startTime) / 1000,
            category: channel === 'tvmoda' ? 'Fashion' : 'Informazione',
            format: title,
            isFiller: true
        };
    }
    
    /**
     * Generate programme XML element
     */
    generateProgrammeXML(program, channelId, timezoneOffset, channel) {
        const startFormatted = this.formatXMLTVDate(program.startTime, timezoneOffset);
        const stopFormatted = this.formatXMLTVDate(program.endTime, timezoneOffset);
        
        let xml = `  <programme start="${startFormatted}" stop="${stopFormatted}" channel="${channelId}">\n`;
        
        if (program.programId) {
            xml += `    <episode-num system="assetID">${this.escapeXml(program.programId)}</episode-num>\n`;
        }
        
        // Always capitalize title
        const displayTitle = this.capitalizeTitle(program.title);
        xml += `    <title lang="it">${this.escapeXml(displayTitle)}</title>\n`;
        
        const description = this.getDescription(program);
        if (description) {
            xml += `    <desc lang="it">${this.escapeXml(description)}</desc>\n`;
        }
        
        xml += `    <length units="seconds">${program.duration}</length>\n`;
        
        const rating = this.getRating(program);
        xml += `    <rating system="Italy Parental Rating">\n`;
        xml += `      <value>${rating}</value>\n`;
        xml += `    </rating>\n`;
        
        if (program.category) {
            const mappedCategory = this.app.config.categoryMapping[program.category] || program.category;
            xml += `    <category lang="it">${this.escapeXml(mappedCategory)}</category>\n`;
        }
        
        const formatIcon = this.getIconForFormat(program.format, channel);
        xml += `    <icon src="${this.escapeXml(formatIcon)}" width="1920" height="1080"></icon>\n`;
        xml += `  </programme>\n\n`;
        
        return xml;
    }
    
    /**
     * Get program description
     */
    getDescription(program) {
        if (program.longDesc && program.longDesc !== program.title && program.longDesc.trim() !== '') {
            return program.longDesc;
        } else if (program.shortDesc && program.shortDesc !== program.title && program.shortDesc.trim() !== '') {
            return program.shortDesc;
        } else if (program.description && program.description.trim() !== '') {
            return program.description;
        } else if (program.isFiller) {
            return program.description || program.title;
        }
        return null;
    }
    
    /**
     * Get program rating
     */
    getRating(program) {
        if (program.rating && program.rating !== 'U' && program.rating.trim() !== '') {
            return this.app.config.ratingMapping[program.rating] || '0';
        }
        return '0';
    }
    
    /**
     * Parse time from various formats
     */
    parseTime(timeObj, baseDate) {
        let programTime;
        
        try {
            if (timeObj instanceof Date || Object.prototype.toString.call(timeObj) === '[object Date]') {
                programTime = new Date(baseDate);
                programTime.setHours(timeObj.getHours(), timeObj.getMinutes(), timeObj.getSeconds() || 0, 0);
            } else if (typeof timeObj === 'string') {
                const tempDate = new Date(timeObj);
                if (!isNaN(tempDate.getTime())) {
                    programTime = new Date(baseDate);
                    programTime.setHours(tempDate.getHours(), tempDate.getMinutes(), 0, 0);
                }
            }
        } catch (e) {
            return null;
        }
        
        return programTime;
    }
    
    /**
     * Parse date from various formats
     */
    parseDate(dateObj) {
        try {
            let date = dateObj;
            if (typeof dateObj === 'string') {
                date = new Date(dateObj);
            }
            
            if (date instanceof Date && !isNaN(date.getTime())) {
                return date;
            }
        } catch (e) {
            return null;
        }
        return null;
    }
    
    /**
     * Parse duration from various formats
     */
    parseDuration(duration) {
        let durationMinutes = 30; // Default
        
        if (duration) {
            if (duration instanceof Date || Object.prototype.toString.call(duration) === '[object Date]') {
                durationMinutes = duration.getHours() * 60 + duration.getMinutes();
            } else if (typeof duration === 'string') {
                const colonMatch = duration.match(/(\d+):(\d+)(?::(\d+))?/);
                if (colonMatch) {
                    const hours = parseInt(colonMatch[1]) || 0;
                    const minutes = parseInt(colonMatch[2]) || 0;
                    durationMinutes = hours * 60 + minutes;
                } else if (/^\d+$/.test(duration)) {
                    durationMinutes = parseInt(duration);
                }
            }
        }
        
        return durationMinutes;
    }
    
    /**
     * Format date string for comparison
     */
    formatDateString(date) {
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
    }
}
