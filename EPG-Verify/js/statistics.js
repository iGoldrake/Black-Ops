/**
 * XMLTV Viewer v4.2.1 - Statistics Module
 * Calcolo statistiche e generazione report problemi
 */

/**
 * Aggiorna statistiche programmi
 */
function updateStatistics(programs) {
    // Calcola copertura totale
    const totalDuration = programs.reduce((sum, p) => sum + p.duration, 0);
    const totalHours = totalDuration / 3600;
    const coverageHours = Math.floor(totalHours);
    const coverageMinutes = Math.floor((totalHours % 1) * 60);
    
    document.getElementById('coveragePercent').textContent = `${totalHours.toFixed(1)}h`;
    document.getElementById('coverageTime').textContent = `${coverageHours}h ${coverageMinutes}m totali`;
    
    // Aggiorna anello copertura (mostra 100% perché visualizziamo tutti i dati)
    const ring = document.getElementById('coverageRing');
    const circumference = 2 * Math.PI * 20;
    ring.style.strokeDashoffset = 0;
    
    // Conta gaps
    let gapCount = 0;
    const sortedPrograms = [...programs].sort((a, b) => a.start - b.start);
    for (let i = 0; i < sortedPrograms.length - 1; i++) {
        if (sortedPrograms[i + 1].start > sortedPrograms[i].stop) {
            gapCount++;
        }
    }
    document.getElementById('gapCount').textContent = gapCount;
    
    // Conta format unici
    const uniqueFormats = [...new Set(programs.map(p => p.title))];
    document.getElementById('formatCount').textContent = uniqueFormats.length;
    
    // Calcola durata media
    const avgDuration = totalDuration / programs.length;
    const avgMinutes = Math.floor(avgDuration / 60);
    document.getElementById('avgDuration').textContent = `${avgMinutes}m`;
}

/**
 * Aggiorna legenda format
 */
function updateFormatLegend(programs) {
    const legend = document.getElementById('formatLegend');
    legend.innerHTML = '';
    
    // Usa gruppi format se disponibili
    if (GlobalState.formatGroups && Object.keys(GlobalState.formatGroups).length > 0) {
        const sortedFormats = Object.values(GlobalState.formatGroups)
            .sort((a, b) => b.totalDuration - a.totalDuration);
        
        const totalDuration = sortedFormats.reduce((sum, f) => sum + f.totalDuration, 0);
        
        sortedFormats.forEach(format => {
            const item = document.createElement('div');
            item.className = 'format-item';
            const hours = (format.totalDuration / 3600).toFixed(1);
            const percentage = ((format.totalDuration / totalDuration) * 100).toFixed(1);
            
            item.innerHTML = `
                <div class="format-color" style="background: ${format.color}"></div>
                <span>${format.title}</span>
                <span style="margin-left: auto; font-size: 11px; color: #666;">
                    ${format.programCount} ep. • ${hours}h • ${percentage}%
                </span>
            `;
            legend.appendChild(item);
        });
    }
}

/**
 * Controlla problemi nel palinsesto
 */
function checkProblems(programs) {
    const report = document.getElementById('problemsReport');
    report.innerHTML = '';
    const problems = [];
    
    // Controlla sovrapposizioni
    for (let i = 0; i < programs.length; i++) {
        for (let j = i + 1; j < programs.length; j++) {
            if (programs[i].stop > programs[j].start && programs[i].start < programs[j].stop) {
                const overlapMinutes = Math.floor((Math.min(programs[i].stop, programs[j].stop) - Math.max(programs[i].start, programs[j].start)) / 60000);
                problems.push({
                    type: 'overlap',
                    severity: 'error',
                    message: `Sovrapposizione di ${overlapMinutes} minuti tra "${programs[i].title}" e "${programs[j].title}"`
                });
            }
        }
    }
    
    // Controlla gaps
    const sortedPrograms = [...programs].sort((a, b) => a.start - b.start);
    for (let i = 0; i < sortedPrograms.length - 1; i++) {
        const gap = sortedPrograms[i + 1].start - sortedPrograms[i].stop;
        if (gap > 60000) { // Più di 1 minuto
            const gapMinutes = Math.floor(gap / 60000);
            problems.push({
                type: 'gap',
                severity: gapMinutes > 30 ? 'error' : 'warning',
                message: `Buco di ${gapMinutes} minuti dopo "${sortedPrograms[i].title}" (${formatDateTime(sortedPrograms[i].stop)})`
            });
        }
    }
    
    // Mostra problemi
    if (problems.length === 0) {
        report.innerHTML = '<p class="text-green-600 font-semibold">✅ Nessun problema rilevato</p>';
    } else {
        problems.forEach(problem => {
            const div = document.createElement('div');
            div.className = `p-3 rounded-lg text-sm ${
                problem.severity === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                problem.severity === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
            }`;
            div.textContent = problem.message;
            report.appendChild(div);
        });
    }
}

// Esporta funzioni
window.updateStatistics = updateStatistics;
window.updateFormatLegend = updateFormatLegend;
window.checkProblems = checkProblems;