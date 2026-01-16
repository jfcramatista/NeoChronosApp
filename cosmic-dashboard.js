const LS_KEY_BIRTH = 'neo-chronos-birthdate';
const LS_KEY_EXPECTANCY = 'neo-chronos-expectancy';
const LS_KEY_DAY_DATA = 'neo-chronos-day-data';
let selectedPillarCode = 'pillar-op';
let selectedEnergyMark = 'diamond';
const LS_KEY_ANOMALIES = 'neo-chronos-anomalies';
let totalYears = parseInt(localStorage.getItem(LS_KEY_EXPECTANCY)) || 90;
let isSessionActive = false;
let sessionStartTime = null;
let selectedAnomalyDate = null;
const ENERGY_ICONS = { bolt: '⚡', diamond: '💠', aura: '🟣' };
const PILLAR_COLORS = {
    'pillar-op': '#00f2ff',
    'pillar-con': '#ff007a',
    'pillar-vit': '#39ff14',
    'pillar-chaos': '#f0f000'
};

document.addEventListener('DOMContentLoaded', () => {
    const birth = localStorage.getItem(LS_KEY_BIRTH);
    const expectancy = localStorage.getItem(LS_KEY_EXPECTANCY);

    if (!birth) {
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
        }
    } else {
        document.getElementById('setup-date').value = birth;
        document.getElementById('setup-expectancy').value = totalYears;
        switchTab('life');
    }

    setInterval(updateSystemClock, 1000);
    updateSystemClock();
});

function updateSystemClock() {
    const timeEl = document.getElementById('current-time-big');
    const dateEl = document.getElementById('current-date-full');
    const progressFill = document.getElementById('hour-progress-fill');
    const progressPercent = document.getElementById('hour-progress-percent');
    const sessionTimer = document.getElementById('session-timer-display');

    if (timeEl && dateEl) {
        const now = new Date();
        timeEl.innerText = now.toLocaleTimeString('en-GB', { hour12: false });
        dateEl.innerText = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentSeconds = now.getSeconds();

        // Calculate Hour Progress
        const percent = Math.floor(((currentMinutes * 60 + currentSeconds) / 3600) * 100);
        if (progressFill) progressFill.style.height = `${percent}%`;
        if (progressPercent) progressPercent.innerText = `${percent}%`;

        // Session Timer Update
        if (isSessionActive && sessionStartTime && sessionTimer) {
            const diff = now - sessionStartTime;
            const mins = Math.floor(diff / 60000).toString().padStart(2, '0');
            const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            sessionTimer.innerText = `${mins}:${secs}`;
        }

        const dayTab = document.getElementById('tab-day');
        if (dayTab && dayTab.classList.contains('active')) {
            renderDayClock();
        }
    }
}

function switchTab(id) {
    const birth = localStorage.getItem(LS_KEY_BIRTH);

    // UI Cleanup
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('text-cyan-400', 'glass-active');
    });

    const currentTab = document.getElementById('tab-' + id);
    if (currentTab) currentTab.classList.add('active');

    const btn = document.getElementById('btn-' + id);
    if (btn) btn.classList.add('text-cyan-400', 'glass-active');

    // Logic for Life Tab
    if (id === 'life') {
        const calibration = document.getElementById('life-calibration');
        const mainContent = document.getElementById('life-main-content');

        if (!birth) {
            calibration.classList.remove('hidden');
            calibration.style.display = 'flex';
            mainContent.classList.add('hidden');
        } else {
            calibration.classList.add('hidden');
            mainContent.classList.remove('hidden');
            mainContent.style.display = 'flex';
            renderLifeGrid('years'); // Start with Years as requested
        }
    }

    if (id === 'day') {
        renderDayClock();
        renderFrequencyMirror();
    }
}

function renderLifeGrid(mode) {
    const birthVal = localStorage.getItem(LS_KEY_BIRTH);
    if (!birthVal) return;
    const birth = new Date(birthVal);
    const today = new Date();
    const grid = document.getElementById('lifeGrid');
    if (!grid) return;

    grid.innerHTML = '';

    let total, lived, cols, gap, label;

    if (mode === 'years') {
        total = totalYears;
        lived = today.getFullYear() - birth.getFullYear();
        cols = (totalYears <= 50) ? 10 : (totalYears <= 100 ? 10 : 20);
        gap = '10px';
        label = 'Años Vividos';
    }
    else if (mode === 'months') {
        total = totalYears * 12;
        lived = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        cols = 36;
        gap = '4px';
        label = 'Meses Vividos';
    }
    else {
        // weeks
        total = totalYears * 52;
        lived = Math.floor((today - birth) / (604800000));
        cols = 52;
        gap = '2px';
        label = 'Semanas Vividas';
    }

    if (lived < 0) lived = 0;

    // Update Stats
    document.getElementById('stat-label').innerText = label;
    document.getElementById('stat-lived').innerText = lived.toLocaleString();
    document.getElementById('stat-left').innerText = (total - lived).toLocaleString();
    document.getElementById('stat-percent').innerText = ((lived / total) * 100).toFixed(1) + '%';

    // Restoring to full-width as requested
    grid.className = 'grid w-full animate-fade-in mx-auto';
    grid.style.maxWidth = (mode === 'years') ? '800px' : 'none';
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.style.gap = gap;

    const frag = document.createDocumentFragment();
    const anomalies = JSON.parse(localStorage.getItem(LS_KEY_ANOMALIES) || '{}');

    for (let i = 0; i < total; i++) {
        const d = document.createElement('div');
        let statusClass = '';
        let title = '';

        // Calculate date for this cell
        let cellDate = new Date(birth);
        if (mode === 'years') cellDate.setFullYear(birth.getFullYear() + i);
        else if (mode === 'months') cellDate.setMonth(birth.getMonth() + i);
        else cellDate.setDate(birth.getDate() + (i * 7));

        // Check for anomalies
        const dateKey = cellDate.toISOString().split('T')[0];
        // For simplicity in Year/Month view, we look for matches in the same period
        let anomaly = null;
        if (mode === 'years') {
            const yearStr = cellDate.getFullYear().toString();
            anomaly = Object.values(anomalies).find(a => a.date.startsWith(yearStr));
        } else if (mode === 'months') {
            const monthStr = cellDate.toISOString().substring(0, 7);
            anomaly = Object.values(anomalies).find(a => a.date.startsWith(monthStr));
        } else {
            anomaly = anomalies[dateKey];
        }

        if (i < lived) {
            statusClass = 'bg-cyan-500 opacity-60 hover:opacity-100 hover:bg-cyan-400';
            if (anomaly) statusClass = `anomaly-${anomaly.type}`;
        } else if (i === lived) {
            statusClass = 'pulse-grid';
        } else {
            statusClass = 'bg-white/5 border border-white/5 hover:border-cyan-500/30 cursor-pointer';
            if (anomaly) statusClass = `anomaly-${anomaly.type}`;
        }

        d.className = `aspect-square transition-all duration-300 hex-shape hex-cell-macro ${statusClass}`;

        if (anomaly) {
            const star = document.createElement('div');
            star.className = 'star-particle';
            d.appendChild(star);

            const label = document.createElement('div');
            label.className = 'anomaly-label';
            label.innerText = anomaly.title;
            d.appendChild(label);
        }

        if (i >= lived || anomaly) {
            d.onclick = () => openAnomalyTerminal(dateKey);
        }

        frag.appendChild(d);
    }
    grid.appendChild(frag);

    // Active button state
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('bg-white/10', 'border-cyan-400', 'text-cyan-400'));
    const vb = document.getElementById('view-' + mode);
    if (vb) vb.classList.add('bg-white/10', 'border-cyan-400', 'text-cyan-400');
}

function saveLifeCalibration() {
    const valBirth = document.getElementById('life-birth-input').value;
    const valExpectancy = document.getElementById('life-expectancy-input').value;

    if (valBirth && valExpectancy) {
        localStorage.setItem(LS_KEY_BIRTH, valBirth);
        localStorage.setItem(LS_KEY_EXPECTANCY, valExpectancy);
        totalYears = parseInt(valExpectancy);

        const dInput = document.getElementById('setup-date');
        if (dInput) dInput.value = valBirth;
        const eInput = document.getElementById('setup-expectancy');
        if (eInput) eInput.value = valExpectancy;

        switchTab('life');
    } else {
        alert("Sajor, la Matrix requiere datos válidos para calcular tu proyección.");
    }
}



function saveSettings() {
    const valBirth = document.getElementById('setup-date').value;
    const valExpectancy = document.getElementById('setup-expectancy').value;

    if (valBirth && valExpectancy) {
        localStorage.setItem(LS_KEY_BIRTH, valBirth);
        localStorage.setItem(LS_KEY_EXPECTANCY, valExpectancy);
        totalYears = parseInt(valExpectancy);
        switchTab('life');
    }
}

function resetSystem() {
    if (confirm('¿Reiniciar sistema? Perderás tu origen y memorias.')) {
        localStorage.removeItem(LS_KEY_BIRTH);
        localStorage.removeItem(LS_KEY_EXPECTANCY);
        localStorage.removeItem(LS_KEY_DAY_DATA);
        location.reload();
    }
}

function selectPillar(id, btn) {
    selectedPillarCode = id;
    document.querySelectorAll('.pillar-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Real-time pulse update if session is active
    if (isSessionActive) {
        const centralHex = document.querySelector('.hour-progress-hex');
        if (centralHex) {
            centralHex.style.setProperty('--pulse-pilar', PILLAR_COLORS[selectedPillarCode]);
        }
    }
}

function selectEnergy(type, btn) {
    selectedEnergyMark = type;
    document.querySelectorAll('.energy-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function handleSessionTrigger() {
    const input = document.getElementById('current-activity-input');
    const btn = document.getElementById('session-main-btn');
    const btnText = document.getElementById('session-btn-text');
    const statusText = document.getElementById('session-status-text');
    const timerDisplay = document.getElementById('session-timer-display');

    const panel = document.getElementById('session-panel');
    const centralHex = document.querySelector('.hour-progress-hex');

    if (!isSessionActive) {
        const task = input.value.trim();
        if (!task) { alert("Sajor, define tu foco de operación."); return; }

        isSessionActive = true;
        sessionStartTime = new Date();

        btn.classList.replace('bg-cyan-500', 'bg-red-500');
        btn.classList.add('scanning');
        btnText.innerText = "SELLAR ACCIÓN";
        statusText.innerText = `OPERANDO EN: ${task.toUpperCase()}`;
        statusText.classList.replace('text-white/30', 'text-cyan-400');
        input.disabled = true;

        if (panel) panel.classList.add('session-active');
        if (centralHex) {
            centralHex.classList.add('active-pulse');
            centralHex.style.setProperty('--pulse-pilar', PILLAR_COLORS[selectedPillarCode]);
        }
    } else {
        const task = input.value;
        const endTime = new Date();
        const duration = Math.round((endTime - sessionStartTime) / 60000);
        const startStr = sessionStartTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const endStr = endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        saveSessionData(task, startStr, endStr, duration, selectedPillarCode, selectedEnergyMark);

        isSessionActive = false;
        sessionStartTime = null;

        btn.classList.replace('bg-red-500', 'bg-cyan-500');
        btn.classList.remove('scanning');
        btnText.innerText = "INICIAR SECUENCIA";
        statusText.innerText = "Operación sellada en la Matrix.";
        statusText.classList.replace('text-cyan-400', 'text-white/30');

        input.disabled = false;
        input.value = "";
        timerDisplay.innerText = "00:00";

        if (panel) panel.classList.remove('session-active');
        if (centralHex) centralHex.classList.remove('active-pulse');

        renderDayClock();
    }
}

function saveSessionData(task, start, end, duration, pillar, energy) {
    const dayData = JSON.parse(localStorage.getItem(LS_KEY_DAY_DATA) || '{}');
    const todayStr = new Date().toISOString().split('T')[0];

    if (!dayData[todayStr]) dayData[todayStr] = {};

    const startHour = parseInt(start.split(':')[0]);
    dayData[todayStr][startHour] = {
        task: task,
        time: `${start} - ${end}`,
        duration: duration,
        pillar: pillar,
        energy: energy
    };

    localStorage.setItem(LS_KEY_DAY_DATA, JSON.stringify(dayData));
    renderFrequencyMirror();
}

function renderDayClock() {
    const container = document.getElementById('dayClock');
    if (!container) return;

    const dayData = JSON.parse(localStorage.getItem(LS_KEY_DAY_DATA) || '{}');
    const todayStr = new Date().toISOString().split('T')[0];
    const sessions = dayData[todayStr] || {};
    const currentHour = new Date().getHours();

    if (!document.getElementById('hex-hour-0')) {
        const radius = 160;
        const centerX = 190;
        const centerY = 190;

        for (let i = 0; i < 24; i++) {
            const hex = document.createElement('div');
            const angle = (i * (360 / 24) - 90) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            hex.className = `hex-cell-circular hex-shape cursor-pointer transition-all duration-300`;
            hex.style.left = `${x}px`;
            hex.style.top = `${y}px`;
            hex.id = `hex-hour-${i}`;
            hex.onmouseover = () => showBitacora(i);
            hex.onmouseout = () => hideBitacora();
            container.appendChild(hex);
        }
    }

    for (let i = 0; i < 24; i++) {
        const hex = document.getElementById(`hex-hour-${i}`);
        const session = sessions[i];

        hex.classList.remove('bg-cyan-500', 'bg-cyan-500/40', 'pulse-grid', 'pulse-circular', 'bg-white/5', 'border-white/5', 'pillar-op', 'pillar-con', 'pillar-vit', 'pillar-chaos');
        hex.style.boxShadow = 'none';

        // Remove old energy marks
        const oldMark = hex.querySelector('.energy-mark');
        if (oldMark) oldMark.remove();

        if (session) {
            hex.classList.add('bg-cyan-500');
            hex.style.boxShadow = '0 0 15px #00f2ff';

            // Add Energy Mark INSIDE (Centered via CSS)
            const mark = document.createElement('div');
            mark.className = 'energy-mark';
            mark.innerText = ENERGY_ICONS[session.energy] || '💠';
            hex.appendChild(mark);
        } else if (i < currentHour) {
            hex.classList.add('bg-cyan-500/20', 'border', 'border-cyan-500/20');
        } else {
            hex.classList.add('bg-white/5', 'border', 'border-white/5');
        }

        if (i === currentHour) {
            hex.classList.add('pulse-circular');
        }
    }
}

function showBitacora(h) {
    const dayData = JSON.parse(localStorage.getItem(LS_KEY_DAY_DATA) || '{}');
    const todayStr = new Date().toISOString().split('T')[0];
    const session = (dayData[todayStr] && dayData[todayStr][h]);

    const display = document.getElementById('bitacora-display');
    const tField = document.getElementById('bitacora-task');
    const timeField = document.getElementById('bitacora-time');
    const durField = document.getElementById('bitacora-duration');
    const pilarField = document.getElementById('bitacora-pillar');
    const energyField = document.getElementById('bitacora-energy');

    if (!display) return;

    if (session) {
        tField.innerText = session.task;
        timeField.innerText = session.time;
        durField.innerText = `${session.duration} min`;

        const pillarNames = { 'pillar-op': 'Operación', 'pillar-con': 'Conexión', 'pillar-vit': 'Vitalidad', 'pillar-chaos': 'Espíritu' };
        if (pilarField) pilarField.innerText = pillarNames[session.pillar] || 'General';
        if (energyField) energyField.innerText = ENERGY_ICONS[session.energy] || '---';
    } else {
        tField.innerText = "Sin registro de comando";
        timeField.innerText = `${h.toString().padStart(2, '0')}:00`;
        durField.innerText = "0 min";
        if (pilarField) pilarField.innerText = "---";
        if (energyField) energyField.innerText = "---";
    }
    display.style.opacity = "1";
}

function hideBitacora() {
    const display = document.getElementById('bitacora-display');
    if (display) display.style.opacity = "0";
}

// ANOMALY PROTOCOLS
function openAnomalyTerminal(date) {
    const terminal = document.getElementById('anomaly-terminal');
    const titleInput = document.getElementById('anomaly-title');
    const dateInput = document.getElementById('anomaly-date-input');
    const deleteBtn = document.getElementById('delete-anomaly-btn');

    selectedAnomalyDate = date || new Date().toISOString().split('T')[0];
    const anomalies = JSON.parse(localStorage.getItem(LS_KEY_ANOMALIES) || '{}');
    const existing = anomalies[selectedAnomalyDate];

    dateInput.value = selectedAnomalyDate;
    titleInput.value = existing ? existing.title : '';

    if (existing) deleteBtn.classList.remove('hidden');
    else deleteBtn.classList.add('hidden');

    terminal.classList.add('active');
}

function closeAnomalyTerminal() {
    document.getElementById('anomaly-terminal').classList.remove('active');
    selectedAnomalyDate = null;
}

function saveAnomaly(type) {
    const title = document.getElementById('anomaly-title').value.trim();
    const manualDate = document.getElementById('anomaly-date-input').value;

    if (!manualDate) { alert("Sajor, la Matrix requiere una coordenada temporal (fecha)."); return; }
    if (!title) { alert("Sajor, la anomalía requiere una designación (nombre)."); return; }

    const anomalies = JSON.parse(localStorage.getItem(LS_KEY_ANOMALIES) || '{}');
    anomalies[manualDate] = {
        date: manualDate,
        title: title,
        type: type
    };

    localStorage.setItem(LS_KEY_ANOMALIES, JSON.stringify(anomalies));
    closeAnomalyTerminal();

    // Auto-detect current view mode to refresh
    const label = document.getElementById('stat-label').innerText;
    const mode = label.includes('Año') ? 'years' : (label.includes('Mes') ? 'months' : 'weeks');
    renderLifeGrid(mode);
}

function deleteAnomaly() {
    const manualDate = document.getElementById('anomaly-date-input').value;
    if (confirm("¿Abortar este registro temporal?")) {
        const anomalies = JSON.parse(localStorage.getItem(LS_KEY_ANOMALIES) || '{}');
        delete anomalies[manualDate];
        localStorage.setItem(LS_KEY_ANOMALIES, JSON.stringify(anomalies));
        closeAnomalyTerminal();
        const label = document.getElementById('stat-label').innerText;
        const mode = label.includes('Año') ? 'years' : (label.includes('Mes') ? 'months' : 'weeks');
        renderLifeGrid(mode);
    }
}
function renderFrequencyMirror() {
    const dayData = JSON.parse(localStorage.getItem(LS_KEY_DAY_DATA) || '{}');
    const todayStr = new Date().toISOString().split('T')[0];
    const sessions = dayData[todayStr] || {};

    const counts = { 'pillar-op': 0, 'pillar-con': 0, 'pillar-vit': 0, 'pillar-chaos': 0 };
    let totalTime = 0;

    Object.values(sessions).forEach(s => {
        if (s.pillar) {
            counts[s.pillar] += s.duration || 60; // default 60 if not specified
            totalTime += s.duration || 60;
        }
    });

    for (const [key, value] of Object.entries(counts)) {
        const idSuffix = key.split('-')[1];
        const percent = totalTime > 0 ? Math.round((value / totalTime) * 100) : 0;

        const fill = document.getElementById(`mirror-fill-${idSuffix}`);
        const val = document.getElementById(`mirror-val-${idSuffix}`);

        if (fill) fill.style.width = `${percent}%`;
        if (val) val.innerText = `${percent}%`;
    }
}
