/**
 * EPG Converter v4.0.0 - UI Manager Module
 * Handles all UI interactions and updates
 */

export class UIManager {
    constructor(app) {
        this.app = app;
    }
    
    /**
     * Initialize UI components
     */
    init() {
        this.loadRecentSessions();
        this.initializeTooltips();
    }
    
    /**
     * Initialize tab system
     */
    initTabSystem() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }
    
    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('hidden', content.dataset.tab !== tabName);
        });
        
        this.app.state.currentTab = tabName;
        
        // Load icon list if switching to icons tab
        if (tabName === 'icons' && this.app.state.currentChannel) {
            this.updateIconList(this.app.state.currentChannel);
        }
    }
    
    /**
     * Update channel selection UI
     */
    updateChannelSelection(channel) {
        document.querySelectorAll('.channel-card').forEach(card => {
            card.classList.toggle('active', card.dataset.channel === channel);
        });
    }
    
    /**
     * Update step navigation
     */
    updateStepNavigation(step) {
        // Update sidebar
        document.querySelectorAll('.step-item').forEach((item, index) => {
            const itemStep = index + 1;
            item.classList.toggle('active', itemStep === step);
            item.classList.toggle('completed', itemStep < step);
        });
        
        // Update content
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.toggle('hidden', parseInt(content.dataset.step) !== step);
        });
        
        // Animate new content
        const newContent = document.querySelector(`.step-content[data-step="${step}"]`);
        if (newContent) {
            newContent.classList.add('fade-in');
        }
    }
    
    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        const icons = {
            success: '<svg class="status-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
            error: '<svg class="status-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
            info: '<svg class="status-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
        };
        
        statusDiv.innerHTML = `
            <div class="status ${type}">
                ${icons[type] || icons.info}
                <span>${message}</span>
            </div>
        `;
    }
    
    /**
     * Show file info
     */
    showFileInfo(file, state) {
        const fileInfo = document.getElementById('file-info');
        fileInfo.innerHTML = `
            <div class="status success">
                <svg class="status-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <div>
                    <strong>${file.name}</strong> caricato con successo
                    <div class="text-xs mt-1">
                        ${state.workbook.SheetNames.length} fogli • 
                        ${state.detectedFormats.size} format unici • 
                        ${state.detectedDates.length} date rilevate •
                        ${(file.size / 1024).toFixed(1)} KB
                    </div>
                </div>
            </div>
        `;
        fileInfo.classList.remove('hidden');
        
        // Show navigation button
        document.getElementById('step2-nav').classList.remove('hidden');
    }
    
    /**
     * Show date preview grid
     */
    showDatePreview(detectedDates) {
        const previewDiv = document.getElementById('date-preview');
        const gridDiv = document.getElementById('date-grid');
        
        if (detectedDates.length === 0) {
            previewDiv.classList.add('hidden');
            return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        gridDiv.innerHTML = '';
        
        for (const dateInfo of detectedDates) {
            const dateItem = document.createElement('div');
            dateItem.className = 'date-item';
            
            // Check if date is in the past
            if (dateInfo.date < today) {
                dateItem.classList.add('past');
            }
            
            const dayName = dateInfo.date.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
            const dateStr = dateInfo.date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
            
            dateItem.innerHTML = `
                <div class="date-item-day">${dayName}</div>
                <div class="date-item-date">${dateStr}</div>
                <div class="date-item-sheet">Foglio: ${dateInfo.sheetName}</div>
            `;
            
            gridDiv.appendChild(dateItem);
        }
        
        previewDiv.classList.remove('hidden');
    }
    
    /**
     * Update icon list display
     */
    updateIconList(channel) {
        const iconList = document.getElementById('iconList');
        const formatIcons = this.app.config.formatIcons[channel];
        const baseUrl = this.app.config.channels[channel].baseIconUrl;
        
        iconList.innerHTML = '';
        
        Object.entries(formatIcons).forEach(([format, filename]) => {
            const item = document.createElement('div');
            item.className = 'icon-item fade-in';
            item.innerHTML = `
                <div class="icon-preview" style="background-image: url('${baseUrl}${filename}')"></div>
                <div class="icon-details">
                    <div class="icon-name">${format}</div>
                    <div class="icon-url">${filename}</div>
                </div>
                <div class="icon-actions">
                    <button class="btn btn-ghost btn-icon" onclick="window.app.editFormat('${format}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn btn-ghost btn-icon" onclick="window.app.removeFormat('${format}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            `;
            iconList.appendChild(item);
        });
    }
    
    /**
     * Get conversion parameters from form
     */
    getConversionParameters() {
        const timezoneValue = document.getElementById('timezone').value;
        return {
            channelId: document.getElementById('channelId').value.trim(),
            channelName: document.getElementById('channelName').value.trim(),
            timezoneOffset: parseInt(timezoneValue, 10), // Forziamo la conversione a numero
            iconUrl: document.getElementById('iconUrl').value.trim()
        };
    }
    
    /**
     * Show conversion progress
     */
    showConversionProgress() {
        const progressSection = document.getElementById('conversion-progress');
        progressSection.classList.remove('hidden');
        
        const multiProgress = document.getElementById('multi-progress');
        multiProgress.classList.remove('hidden');
        multiProgress.innerHTML = '';
    }
    
    /**
     * Hide conversion progress
     */
    hideConversionProgress() {
        document.getElementById('conversion-progress').classList.add('hidden');
    }
    
    /**
     * Update overall progress bar
     */
    updateProgress(percent) {
        document.getElementById('progress-percent').textContent = `${percent}%`;
        document.getElementById('progress-fill').style.width = `${percent}%`;
    }
    
    /**
     * Update multi-file progress item
     */
    updateMultiProgress(index, dateInfo, status) {
        const progressItemId = `progress-${index}`;
        let progressItem = document.getElementById(progressItemId);
        
        if (!progressItem) {
            // Create progress item if it doesn't exist
            progressItem = document.createElement('div');
            progressItem.className = 'file-progress-item';
            progressItem.id = progressItemId;
            document.getElementById('multi-progress').appendChild(progressItem);
        }
        
        if (status === 'processing') {
            progressItem.innerHTML = `
                <div class="file-progress-header">
                    <span class="file-progress-name">${dateInfo.date.toLocaleDateString('it-IT')} - ${dateInfo.dateString}.xml (${dateInfo.sheetName})</span>
                    <span class="file-progress-status">
                        <span class="spinner"></span>
                        In elaborazione...
                    </span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
            `;
        } else if (status === 'complete') {
            progressItem.classList.add('complete');
            progressItem.querySelector('.file-progress-status').innerHTML = `
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="color: var(--success)">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Completato
            `;
            progressItem.querySelector('.progress-fill').style.width = '100%';
        }
    }
    
    /**
     * Show download options after conversion
     */
    showDownloadOptions(zipUrl, zipFilename, zipSize, xmlFiles) {
        const downloadSection = document.getElementById('downloadSection');
        
        downloadSection.innerHTML = `
            <div class="fade-in">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" style="margin: 0 auto 1rem;">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h3 class="font-semibold mb-2">File XMLTV Generati!</h3>
                <p class="text-secondary mb-2">${xmlFiles.length} file XML • ${(zipSize / 1024).toFixed(1)} KB totali</p>
                <div class="text-xs text-secondary mb-4">
                    ${xmlFiles.map(f => f.filename).join(' • ')}
                </div>
                <a href="${zipUrl}" download="${zipFilename}" class="btn btn-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Scarica ZIP (${xmlFiles.length} file)
                </a>
                <button class="btn btn-secondary mt-2" onclick="window.app.showIndividualDownloads()">
                    Scarica file singoli
                </button>
            </div>
        `;
        
        downloadSection.classList.remove('hidden');
    }
    
    /**
     * Show individual file downloads
     */
    showIndividualDownloads(xmlFiles) {
        const downloadSection = document.getElementById('downloadSection');
        let html = '<div class="fade-in"><h3 class="font-semibold mb-4">Download file singoli</h3><div class="grid grid-2" style="gap: 0.5rem; max-width: 600px; margin: 0 auto;">';
        
        for (const file of xmlFiles) {
            const blob = new Blob([file.content], { type: 'application/xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            html += `
                <a href="${url}" download="${file.filename}" class="btn btn-secondary btn-sm">
                    📄 ${file.filename}
                </a>
            `;
        }
        
        html += '</div><button class="btn btn-ghost mt-4" onclick="window.app.showDownload()">← Torna al download ZIP</button></div>';
        downloadSection.innerHTML = html;
    }
    
    /**
     * Load and display recent sessions
     */
    loadRecentSessions() {
        const sessions = JSON.parse(localStorage.getItem('epg-sessions') || '[]');
        const container = document.getElementById('recent-sessions');
        
        if (sessions.length === 0) {
            container.innerHTML = '<p class="text-xs opacity-50">Nessuna sessione recente</p>';
            return;
        }
        
        container.innerHTML = sessions.map((session, index) => {
            const date = new Date(session.date);
            const timeAgo = this.app.utils ? this.app.utils.getTimeAgo(date) : this.getTimeAgo(date);
            
            return `
                <div class="mb-2 text-xs">
                    <div class="font-semibold">${session.channelName}</div>
                    <div class="opacity-50">${timeAgo}</div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Simple time ago function (fallback)
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'Adesso';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minuti fa`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} ore fa`;
        return `${Math.floor(seconds / 86400)} giorni fa`;
    }
    
    /**
     * Initialize tooltips (CSS-based, no JS needed)
     */
    initializeTooltips() {
        // Tooltips are handled entirely via CSS :hover
        // This method is kept for compatibility
    }
}