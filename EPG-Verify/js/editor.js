/**
 * XMLTV Viewer v4.2.1 - Editor Module
 * Gestione editing inline programmi
 */

/**
 * Aggiorna tabella editor programmi
 */
function updateProgramTable(programs) {
    const tbody = document.getElementById('programTable');
    tbody.innerHTML = '';
    
    programs.forEach((program, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        
        const startTimeStr = formatDateTime(program.start);
        const stopTimeStr = formatDateTime(program.stop);
        
        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap text-sm">${startTimeStr}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">${stopTimeStr}</td>
            <td class="px-4 py-3">${formatDuration(program.duration)}</td>
            <td class="px-4 py-3 cursor-pointer hover:bg-blue-50 rounded transition-colors" onclick="editCell(this, ${index}, 'title')">${program.title}</td>
            <td class="px-4 py-3 cursor-pointer hover:bg-blue-50 rounded transition-colors" onclick="editCell(this, ${index}, 'category')">${program.category || '-'}</td>
            <td class="px-4 py-3">
                <button onclick="deleteProgram(${index})" class="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg" title="Elimina">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Re-inizializza icone
    lucide.createIcons();
}

/**
 * Modifica cella inline
 */
function editCell(cell, programIndex, field) {
    const program = GlobalState.currentPrograms[programIndex];
    if (!program) return;
    
    const currentValue = cell.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue === '-' ? '' : currentValue;
    input.className = 'w-full px-2 py-1 border rounded-lg focus:border-blue-500 focus:outline-none';
    
    input.onblur = () => {
        const newValue = input.value.trim();
        cell.textContent = newValue || '-';
        
        program[field] = newValue;
        
        // Aggiorna XML
        const elem = program.element.querySelector(field);
        if (elem) {
            elem.textContent = newValue;
        } else if (field === 'category' && newValue) {
            const catElem = GlobalState.xmlDoc.createElement('category');
            catElem.setAttribute('lang', 'it');
            catElem.textContent = newValue;
            program.element.appendChild(catElem);
        }
        
        // Ricarica se cambiato titolo
        if (field === 'title') {
            if (!GlobalState.formatColors[newValue]) {
                GlobalState.formatColors[newValue] = COLOR_PALETTE[GlobalState.colorIndex % COLOR_PALETTE.length];
                GlobalState.colorIndex++;
            }
            loadPrograms();
        }
    };
    
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            cell.textContent = currentValue;
        }
    };
    
    cell.textContent = '';
    cell.appendChild(input);
    input.focus();
    input.select();
}

/**
 * Elimina programma
 */
function deleteProgram(programIndex) {
    if (!confirm('Eliminare questo programma?')) return;
    
    const program = GlobalState.currentPrograms[programIndex];
    if (!program) return;
    
    // Rimuovi da XML
    program.element.remove();
    
    // Rimuovi da array
    GlobalState.currentPrograms.splice(programIndex, 1);
    
    loadPrograms();
    showToast('Programma eliminato', 'success');
}

/**
 * Aggiungi nuovo programma
 */
function addProgram() {
    // Trova ultimo programma
    const lastProgram = GlobalState.currentPrograms[GlobalState.currentPrograms.length - 1];
    
    let newStart;
    if (lastProgram) {
        newStart = new Date(lastProgram.stop);
    } else {
        newStart = new Date();
        newStart.setUTCHours(6, 0, 0, 0);
    }
    
    const newStop = new Date(newStart);
    newStop.setUTCMinutes(newStop.getUTCMinutes() + 30);
    
    // Crea nuovo elemento programma
    const programme = GlobalState.xmlDoc.createElement('programme');
    programme.setAttribute('start', formatXMLTVDate(newStart));
    programme.setAttribute('stop', formatXMLTVDate(newStop));
    programme.setAttribute('channel', GlobalState.currentChannelId);
    
    const title = GlobalState.xmlDoc.createElement('title');
    title.setAttribute('lang', 'it');
    title.textContent = 'Nuovo Programma';
    programme.appendChild(title);
    
    const desc = GlobalState.xmlDoc.createElement('desc');
    desc.setAttribute('lang', 'it');
    desc.textContent = 'Descrizione del nuovo programma';
    programme.appendChild(desc);
    
    // Aggiungi a XML
    GlobalState.xmlDoc.querySelector('tv').appendChild(programme);
    
    // Aggiungi ad array programmi
    const newProgram = {
        start: newStart,
        stop: newStop,
        title: 'Nuovo Programma',
        desc: 'Descrizione del nuovo programma',
        category: '',
        rating: '0',
        icon: '',
        duration: 1800,
        element: programme
    };
    
    GlobalState.currentPrograms.push(newProgram);
    GlobalState.currentPrograms.sort((a, b) => a.start - b.start);
    
    // Assegna colore
    if (!GlobalState.formatColors[newProgram.title]) {
        GlobalState.formatColors[newProgram.title] = COLOR_PALETTE[GlobalState.colorIndex % COLOR_PALETTE.length];
        GlobalState.colorIndex++;
    }
    
    loadPrograms();
    showToast('Nuovo programma aggiunto', 'success');
}

// Esporta funzioni
window.updateProgramTable = updateProgramTable;
window.editCell = editCell;
window.deleteProgram = deleteProgram;
window.addProgram = addProgram;