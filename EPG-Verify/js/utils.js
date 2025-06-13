/**
 * XMLTV Viewer v4.2.1 - Utils Module
 * Funzioni utility per formattazione date, toast notifications, ecc.
 */

/**
 * Formatta data in formato leggibile
 */
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('it-IT', options);
}

/**
 * Formatta ora in formato HH:MM
 */
function formatTime(date) {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Formatta data e ora completa
 */
function formatDateTime(date) {
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    const time = formatTime(date);
    return `${day}/${month}/${year} ${time}`;
}

/**
 * Formatta durata in formato leggibile
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    } else {
        return `${minutes}min`;
    }
}

/**
 * Mostra toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast p-4 rounded-lg shadow-lg ${type} min-w-[250px]`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}" class="w-5 h-5"></i>
            <span class="font-medium">${message}</span>
        </div>
    `;
    container.appendChild(toast);
    
    // Re-inizializza icone
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Esporta funzioni
window.formatDate = formatDate;
window.formatTime = formatTime;
window.formatDateTime = formatDateTime;
window.formatDuration = formatDuration;
window.showToast = showToast;