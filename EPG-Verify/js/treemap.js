/**
 * XMLTV Viewer v4.2.1 - Treemap Module
 * Visualizzazione treemap e algoritmi di layout
 */

/**
 * Disegna treemap con programmi aggregati per format
 */
function drawTreemap(programs) {
    const container = document.getElementById('treemapContainer');
    
    // Pulisci contenuto esistente (tranne fill indicator)
    const fillIndicator = document.getElementById('fillIndicator');
    container.innerHTML = '';
    container.appendChild(fillIndicator);
    
    const containerWidth = 800;
    const containerHeight = 800;
    
    // Raggruppa programmi per format e calcola durata totale
    const formatGroups = {};
    let totalUsedSeconds = 0;
    
    programs.forEach((program) => {
        const format = program.title;
        if (!formatGroups[format]) {
            formatGroups[format] = {
                title: format,
                programs: [],
                totalDuration: 0,
                icon: program.icon,
                category: program.category,
                color: GlobalState.formatColors[format]
            };
        }
        
        formatGroups[format].programs.push(program);
        formatGroups[format].totalDuration += program.duration;
        totalUsedSeconds += program.duration;
        
        // Usa la prima icona trovata per questo format
        if (!formatGroups[format].icon && program.icon) {
            formatGroups[format].icon = program.icon;
        }
    });
    
    // Converti in array e prepara per treemap
    const formatNodes = Object.values(formatGroups).map(group => ({
        ...group,
        value: group.totalDuration,
        programCount: group.programs.length
    }));
    
    // Ordina per durata (più grande prima)
    formatNodes.sort((a, b) => b.value - a.value);
    
    // Aggiorna fill indicator
    const fillPercent = 100; // Mostriamo tutti i dati
    document.getElementById('fillPercent').textContent = `${formatNodes.length} format`;
    fillIndicator.className = 'fill-indicator complete';
    
    // Calcola layout treemap
    const root = {
        x0: 0,
        y0: 0,
        x1: containerWidth,
        y1: containerHeight,
        value: totalUsedSeconds,
        children: formatNodes
    };
    
    // Applica algoritmo treemap
    if (GlobalState.currentLayout === 'squarify') {
        squarify(root.children, root, totalUsedSeconds);
    } else if (GlobalState.currentLayout === 'binary') {
        binary(root.children, root, totalUsedSeconds);
    } else if (GlobalState.currentLayout === 'slice') {
        sliceDice(root.children, root, totalUsedSeconds);
    }
    
    // Disegna blocchi format
    formatNodes.forEach((formatNode) => {
        const div = document.createElement('div');
        div.className = 'treemap-program new';
        
        const width = formatNode.x1 - formatNode.x0;
        const height = formatNode.y1 - formatNode.y0;
        
        div.style.left = `${formatNode.x0}px`;
        div.style.top = `${formatNode.y0}px`;
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        div.style.backgroundColor = formatNode.color;
        
        // Aggiungi icona se disponibile e spazio sufficiente
        if (formatNode.icon && width > 60 && height > 60) {
            const img = document.createElement('img');
            img.src = formatNode.icon;
            img.className = 'treemap-icon';
            img.onerror = function() {
                this.style.display = 'none';
            };
            div.appendChild(img);
        }
        
        // Aggiungi etichetta migliorata
        if (width > 50 && height > 40) {
            const label = document.createElement('div');
            label.className = 'treemap-label';
            label.style.fontSize = Math.min(16, width / 10) + 'px';
            
            // Etichetta multi-riga con nome format e statistiche
            const durationHours = (formatNode.totalDuration / 3600).toFixed(1);
            const percentage = ((formatNode.totalDuration / totalUsedSeconds) * 100).toFixed(1);
            
            label.innerHTML = `
                <div style="font-weight: 700;">${formatNode.title}</div>
                ${height > 60 ? `<div style="font-size: 0.8em; margin-top: 4px;">${formatNode.programCount} episodi</div>` : ''}
                ${height > 80 ? `<div style="font-size: 0.8em;">${durationHours}h (${percentage}%)</div>` : ''}
            `;
            
            div.appendChild(label);
        }
        
        // Gestori eventi - mostra info format aggregato
        div.onclick = () => showFormatDetails(formatNode);
        div.onmouseenter = (e) => showFormatPreview(e, formatNode, width * height);
        div.onmouseleave = hideProgramPreview;
        
        container.appendChild(div);
    });
    
    // Salva formatGroups globalmente per legenda
    GlobalState.formatGroups = formatGroups;
    window.formatGroups = formatGroups;
}

/**
 * Algoritmo Squarify
 */
function squarify(children, parent, totalValue) {
    const area = (parent.x1 - parent.x0) * (parent.y1 - parent.y0);
    
    children.forEach((child) => {
        const childArea = (child.value / totalValue) * area;
        child.area = childArea;
    });
    
    squarifyRecursive(children, parent.x0, parent.y0, parent.x1, parent.y1);
}

function squarifyRecursive(children, x0, y0, x1, y1) {
    if (children.length === 0) return;
    
    const totalArea = (x1 - x0) * (y1 - y0);
    const totalValue = children.reduce((sum, child) => sum + child.area, 0);
    
    if (children.length === 1) {
        const child = children[0];
        child.x0 = x0;
        child.y0 = y0;
        child.x1 = x1;
        child.y1 = y1;
        return;
    }
    
    const width = x1 - x0;
    const height = y1 - y0;
    const vertical = width <= height;
    
    let accumulatedArea = 0;
    let i = 0;
    
    while (i < children.length) {
        const child = children[i];
        accumulatedArea += child.area;
        
        const ratio = accumulatedArea / totalArea;
        
        if (vertical) {
            const splitY = y0 + ratio * height;
            
            if (i === children.length - 1 || wouldImproveRatio(children, i + 1, width, splitY - y0)) {
                layoutRow(children.slice(0, i + 1), x0, y0, x1, splitY, true);
                
                if (i < children.length - 1) {
                    squarifyRecursive(children.slice(i + 1), x0, splitY, x1, y1);
                }
                break;
            }
        } else {
            const splitX = x0 + ratio * width;
            
            if (i === children.length - 1 || wouldImproveRatio(children, i + 1, splitX - x0, height)) {
                layoutRow(children.slice(0, i + 1), x0, y0, splitX, y1, false);
                
                if (i < children.length - 1) {
                    squarifyRecursive(children.slice(i + 1), splitX, y0, x1, y1);
                }
                break;
            }
        }
        
        i++;
    }
}

function wouldImproveRatio(children, nextIndex, width, height) {
    if (nextIndex >= children.length) return false;
    
    const currentRatio = Math.max(width / height, height / width);
    const nextArea = children[nextIndex].area;
    const newHeight = height * (1 + nextArea / (width * height));
    const newRatio = Math.max(width / newHeight, newHeight / width);
    
    return newRatio < currentRatio;
}

function layoutRow(children, x0, y0, x1, y1, vertical) {
    const totalArea = children.reduce((sum, child) => sum + child.area, 0);
    
    if (vertical) {
        const width = x1 - x0;
        let currentX = x0;
        
        children.forEach(child => {
            const childWidth = (child.area / totalArea) * width;
            child.x0 = currentX;
            child.y0 = y0;
            child.x1 = currentX + childWidth;
            child.y1 = y1;
            currentX += childWidth;
        });
    } else {
        const height = y1 - y0;
        let currentY = y0;
        
        children.forEach(child => {
            const childHeight = (child.area / totalArea) * height;
            child.x0 = x0;
            child.y0 = currentY;
            child.x1 = x1;
            child.y1 = currentY + childHeight;
            currentY += childHeight;
        });
    }
}

/**
 * Algoritmo Binary
 */
function binary(children, parent, totalValue) {
    binaryRecursive(children, parent.x0, parent.y0, parent.x1, parent.y1, totalValue);
}

function binaryRecursive(children, x0, y0, x1, y1, totalValue) {
    if (children.length === 0) return;
    
    if (children.length === 1) {
        const child = children[0];
        child.x0 = x0;
        child.y0 = y0;
        child.x1 = x1;
        child.y1 = y1;
        return;
    }
    
    const mid = Math.floor(children.length / 2);
    const leftChildren = children.slice(0, mid);
    const rightChildren = children.slice(mid);
    
    const leftValue = leftChildren.reduce((sum, child) => sum + child.value, 0);
    const rightValue = rightChildren.reduce((sum, child) => sum + child.value, 0);
    
    const width = x1 - x0;
    const height = y1 - y0;
    
    if (width > height) {
        // Dividi verticalmente
        const splitX = x0 + (leftValue / totalValue) * width;
        binaryRecursive(leftChildren, x0, y0, splitX, y1, leftValue);
        binaryRecursive(rightChildren, splitX, y0, x1, y1, rightValue);
    } else {
        // Dividi orizzontalmente
        const splitY = y0 + (leftValue / totalValue) * height;
        binaryRecursive(leftChildren, x0, y0, x1, splitY, leftValue);
        binaryRecursive(rightChildren, x0, splitY, x1, y1, rightValue);
    }
}

/**
 * Algoritmo Slice & Dice
 */
function sliceDice(children, parent, totalValue) {
    const width = parent.x1 - parent.x0;
    const height = parent.y1 - parent.y0;
    const area = width * height;
    
    let currentX = parent.x0;
    let currentY = parent.y0;
    let rowHeight = 0;
    let rowChildren = [];
    let rowValue = 0;
    
    children.forEach((child, index) => {
        const childArea = (child.value / totalValue) * area;
        const childWidth = Math.sqrt(childArea);
        
        if (currentX + childWidth > parent.x1 && rowChildren.length > 0) {
            // Layout riga corrente
            layoutRowSlice(rowChildren, parent.x0, currentY, parent.x1, currentY + rowHeight);
            
            // Inizia nuova riga
            currentY += rowHeight;
            currentX = parent.x0;
            rowHeight = 0;
            rowChildren = [];
            rowValue = 0;
        }
        
        rowChildren.push(child);
        rowValue += child.value;
        rowHeight = Math.max(rowHeight, childArea / childWidth);
        currentX += childWidth;
    });
    
    // Layout ultima riga
    if (rowChildren.length > 0) {
        layoutRowSlice(rowChildren, parent.x0, currentY, parent.x1, Math.min(parent.y1, currentY + rowHeight));
    }
}

function layoutRowSlice(children, x0, y0, x1, y1) {
    const totalValue = children.reduce((sum, child) => sum + child.value, 0);
    const width = x1 - x0;
    let currentX = x0;
    
    children.forEach(child => {
        const childWidth = (child.value / totalValue) * width;
        child.x0 = currentX;
        child.y0 = y0;
        child.x1 = Math.min(currentX + childWidth, x1);
        child.y1 = y1;
        currentX += childWidth;
    });
}

/**
 * Mostra dettagli format
 */
function showFormatDetails(formatNode) {
    const detailsDiv = document.getElementById('programDetails');
    detailsDiv.style.display = 'block';
    
    // Mostra info format aggregato
    document.getElementById('detailTitle').textContent = formatNode.title;
    
    // Calcola orari inizio e fine
    const sortedPrograms = formatNode.programs.sort((a, b) => a.start - b.start);
    const firstProgram = sortedPrograms[0];
    const lastProgram = sortedPrograms[sortedPrograms.length - 1];
    
    document.getElementById('detailTime').textContent = `Prima: ${formatTime(firstProgram.start)} - Ultima: ${formatTime(lastProgram.stop)}`;
    document.getElementById('detailDuration').textContent = `${(formatNode.totalDuration / 3600).toFixed(1)} ore totali (${formatNode.programCount} episodi)`;
    document.getElementById('detailCategory').textContent = formatNode.category || '-';
    
    // Lista tutti gli episodi
    const episodesList = sortedPrograms.map(p => 
        `• ${formatDateTime(p.start)} - ${formatTime(p.stop)} (${formatDuration(p.duration)})`
    ).join('\n');
    
    document.getElementById('detailDescription').textContent = `Episodi:\n${episodesList}`;
    
    const iconDiv = document.getElementById('detailIcon');
    const iconUrl = document.getElementById('detailIconUrl');
    
    if (formatNode.icon) {
        iconDiv.style.backgroundImage = `url(${formatNode.icon})`;
        iconUrl.textContent = formatNode.icon;
    } else {
        iconDiv.style.backgroundImage = 'none';
        iconDiv.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">Nessuna icona</div>';
        iconUrl.textContent = 'Nessuna icona specificata';
    }
    
    detailsDiv.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Mostra preview format al passaggio del mouse
 */
function showFormatPreview(event, formatNode, area) {
    if (GlobalState.currentPreviewTimeout) {
        clearTimeout(GlobalState.currentPreviewTimeout);
    }
    
    GlobalState.currentPreviewTimeout = setTimeout(() => {
        const preview = document.getElementById('programPreview');
        
        document.getElementById('previewTitle').textContent = formatNode.title;
        
        // Mostra info aggregate
        const durationHours = (formatNode.totalDuration / 3600).toFixed(1);
        const totalDuration = Object.values(GlobalState.formatGroups).reduce((sum, f) => sum + f.totalDuration, 0);
        const percentage = ((formatNode.totalDuration / totalDuration) * 100).toFixed(1);
        
        document.getElementById('previewTime').textContent = `${formatNode.programCount} episodi`;
        document.getElementById('previewDuration').textContent = `${durationHours} ore totali`;
        document.getElementById('previewCategory').textContent = formatNode.category || 'N/A';
        
        // Mostra rank format per durata
        const allFormats = Object.values(GlobalState.formatColors).length;
        const formatRank = Object.values(GlobalState.formatGroups)
            .sort((a, b) => b.totalDuration - a.totalDuration)
            .findIndex(f => f.title === formatNode.title) + 1;
        
        document.getElementById('previewPosition').textContent = `${formatRank}° su ${allFormats} format`;
        document.getElementById('previewArea').textContent = `${percentage}% del tempo`;
        
        // Mostra slot orari
        const timeSlots = formatNode.programs
            .sort((a, b) => a.start - b.start)
            .slice(0, 3)
            .map(p => formatTime(p.start))
            .join(', ');
        
        document.getElementById('previewDesc').textContent = `Orari: ${timeSlots}${formatNode.programs.length > 3 ? '...' : ''}`;
        
        const iconDiv = document.getElementById('previewIcon');
        if (formatNode.icon) {
            iconDiv.style.backgroundImage = `url(${formatNode.icon})`;
            iconDiv.style.display = 'block';
        } else {
            iconDiv.style.display = 'none';
        }
        
        // Posiziona preview
        const rect = event.target.getBoundingClientRect();
        let top = rect.bottom + 10;
        let left = rect.left + rect.width / 2 - 175;
        
        if (left < 10) left = 10;
        if (left + 350 > window.innerWidth) left = window.innerWidth - 360;
        if (top + 300 > window.innerHeight) {
            top = rect.top - 300 - 10;
        }
        
        preview.style.left = left + 'px';
        preview.style.top = top + 'px';
        preview.classList.add('show');
    }, 300);
}

/**
 * Nascondi preview programma
 */
function hideProgramPreview() {
    if (GlobalState.currentPreviewTimeout) {
        clearTimeout(GlobalState.currentPreviewTimeout);
        GlobalState.currentPreviewTimeout = null;
    }
    document.getElementById('programPreview').classList.remove('show');
}

// Esporta funzioni
window.drawTreemap = drawTreemap;
window.showFormatDetails = showFormatDetails;