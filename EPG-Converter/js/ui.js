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
     * Show date preview
     */
    showDatePreview(detectedDates) {
        // TODO: Implement date preview grid
        const previewDiv = document.getElementById('date-preview');
        const gridDiv = document.getElementById('date-grid');
        
        if (detectedDates.length === 0) {
            previewDiv.classList.add('hidden');
            return;
        }
        
        // TODO: Generate date items
        
        previewDiv.classList.remove('hidden');
    }
    
    /**
     * Update icon list
     */
    updateIconList(channel) {
        // TODO: Implement icon list update
        const iconList = document.getElementById('iconList');
        const formatIcons = this.app.config.formatIcons[channel];
        const baseUrl = this.app.config.channels[channel].baseIconUrl;
        
        iconList.innerHTML = '';
        
        // TODO: Generate icon items
    }
    
    /**
     * Get conversion parameters
     */
    getConversionParameters() {
        return {
            channelId: document.getElementById('channelId').value.trim(),
            channelName: document.getElementById('channelName').value.trim(),
            timezoneOffset: parseInt(document.getElementById('timezone').value),
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
     * Update progress bar
     */
    updateProgress(percent) {
        document.getElementById('progress-percent').textContent = `${percent}%`;
        document.getElementById('progress-fill').style.width = `${percent}%`;
    }
    
    /**
     * Update multi-file progress
     */
    updateMultiProgress(index, dateInfo, status) {
        // TODO: Implement multi-file progress update
    }
    
    /**
     * Show download options
     */
    showDownloadOptions(zipUrl, zipFilename, zipSize, xmlFiles) {
        // TODO: Implement download UI
        const downloadSection = document.getElementById('downloadSection');
        
        downloadSection.innerHTML = `
            <div class="fade-in">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" style="margin: 0 auto 1rem;">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h3 class="font-semibold mb-2">File XMLTV Generati!</h3>
                <p class="text-secondary mb-2">${xmlFiles.length} file XML • ${(zipSize / 1024).toFixed(1)} KB totali</p>
                <a href="${zipUrl}" download="${zipFilename}" class="btn btn-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Scarica ZIP (${xmlFiles.length} file)
                </a>
            </div>
        `;
        
        downloadSection.classList.remove('hidden');
    }
    
    /**
     * Load recent sessions
     */
    loadRecentSessions() {
        // TODO: Implement recent sessions display
        const sessions = JSON.parse(localStorage.getItem('epg-sessions') || '[]');
        const container = document.getElementById('recent-sessions');
        
        if (sessions.length === 0) {
            container.innerHTML = '<p class="text-xs opacity-50">Nessuna sessione recente</p>';
            return;
        }
        
        // TODO: Generate session items
    }
    
    /**
     * Initialize tooltips
     */
    initializeTooltips() {
        // Tooltips are handled via CSS :hover
    }
}