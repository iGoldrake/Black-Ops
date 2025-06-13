/**
 * XMLTV Viewer v4.2.1 - Export Module
 * Gestione export XMLTV e attualizzazione date
 */

/**
 * Mostra dialog attualizzazione date
 */
function showActualizationDialog() {
    document.getElementById('actualizationDialog').classList.remove('hidden');
    // Imposta oggi come default
    const today = new Date();
    document.getElementById('newStartDate').value = today.toISOString().split('T')[0];
}

/**
 * Chiudi dialog attualizzazione
 */
function closeActualizationDialog() {
    document.getElementById('actualizationDialog').classList.add('hidden');
}

/**
 * Attualizza date palinsesto
 */
function actualizeSchedule() {
    const newStartDateStr = document.getElementById('newStartDate').value;
    if (!newStartDateStr) {
        showToast('Seleziona una data', 'error');
        return;
    }
    
    // Trova programma più vecchio
    if (GlobalState.currentPrograms.length === 0) {
        showToast('Nessun programma da attualizzare', 'error');
        closeActualizationDialog();
        return;
    }
    
    const earliestProgram = GlobalState.currentPrograms.reduce((earliest, program) => 
        program.start < earliest.start ? program : earliest
    );
    
    // Calcola differenza giorni
    const oldStartDate = new Date(earliestProgram.start);
    oldStartDate.setUTCHours(0, 0, 0, 0);
    
    const [year, month, day] = newStartDateStr.split('-').map(Number);
    const newStartDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    
    const dayDiff = Math.floor((newStartDate - oldStartDate) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0) {
        showToast('La data selezionata è la stessa', 'info');
        closeActualizationDialog();
        return;
    }
    
    // Aggiorna tutte le date programmi
    GlobalState.currentPrograms.forEach(program => {
        const newStart = new Date(program.start);
        newStart.setUTCDate(newStart.getUTCDate() + dayDiff);
        const newStop = new Date(program.stop);
        newStop.setUTCDate(newStop.getUTCDate() + dayDiff);
        
        program.start = newStart;
        program.stop = newStop;
        
        program.element.setAttribute('start', formatXMLTVDate(newStart));
        program.element.setAttribute('stop', formatXMLTVDate(newStop));
    });
    
    // Aggiorna attributo date dell'elemento tv se esiste
    const tvElement = GlobalState.xmlDoc.querySelector('tv');
    if (tvElement) {
        tvElement.setAttribute('date', newStartDate.toISOString().split('T')[0]);
    }
    
    // Ricarica programmi
    loadPrograms();
    
    closeActualizationDialog();
    showToast('Date attualizzate con successo', 'success');
}

/**
 * Esporta file XMLTV
 */
function exportXMLTV() {
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(GlobalState.xmlDoc);
    const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `${GlobalState.currentChannelId}_updated_${date}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showToast('File esportato con successo', 'success');
}

// Esporta funzioni
window.showActualizationDialog = showActualizationDialog;
window.closeActualizationDialog = closeActualizationDialog;
window.actualizeSchedule = actualizeSchedule;
window.exportXMLTV = exportXMLTV;