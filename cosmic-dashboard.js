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
let selectedCategory = null;
let hexProgressInterval = null;
let currentHexIndex = 0;
const ENERGY_ICONS = { low: '🧊', fluid: '⚡', overload: '🔥' };
const PILLAR_COLORS = {
    'pillar-op': '#00f2ff',    // Neon Cyan (Operación)
    'pillar-con': '#ff007a',   // Neon Magenta (Conexión)
    'pillar-vit': '#39ff14',   // Neon Green (Vitalidad)
    'pillar-chaos': '#f0f000'  // Neon Yellow (Espíritu)
};
const LS_KEY_THEME = 'neo-chronos-theme';

document.addEventListener('DOMContentLoaded', () => {
    const birth = localStorage.getItem(LS_KEY_BIRTH);
    const savedTheme = localStorage.getItem(LS_KEY_THEME) || 'dark';

    setLifeTheme(savedTheme);

    const overlay = document.getElementById('onboarding-overlay');
    if (!birth) {
        if (overlay) {
            overlay.style.display = 'flex';
        }
    } else {
        if (overlay) overlay.remove(); // Eliminar de raíz si ya hay datos
        document.getElementById('setup-date').value = birth;
        document.getElementById('setup-expectancy').value = totalYears;
        switchTab('life');
    }

    setInterval(updateSystemClock, 1000);
    updateSystemClock();
});

function startSystemSequence() {
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.remove(); // Eliminar del DOM para liberar espacio
            switchTab('life');
        }, 800);
    } else {
        switchTab('life');
    }
}

function setLifeTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem(LS_KEY_THEME, themeId);
}


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

        // Calculate Daily Progress (0-24h)
        const totalDaySeconds = 24 * 3600;
        const elapsedSeconds = (currentHour * 3600) + (currentMinutes * 60) + currentSeconds;
        const dayPercent = Math.floor((elapsedSeconds / totalDaySeconds) * 100);

        if (progressFill) progressFill.style.height = `${dayPercent}%`;
        if (progressPercent) progressPercent.innerText = `${dayPercent}%`;

        // Session Timer Update
        if (isSessionActive && sessionStartTime && sessionTimer) {
            const diff = now - sessionStartTime;
            const mins = Math.floor(diff / 60000).toString().padStart(2, '0');
            const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            sessionTimer.innerText = `${mins}:${secs}`;

            // Update hexagon progress
            updateHexProgress(diff);
        }

        const lifeTab = document.getElementById('tab-life');
        const dayView = document.getElementById('day-view-container');
        if (lifeTab && lifeTab.classList.contains('active') && dayView && !dayView.classList.contains('hidden')) {
            renderDayClock();
        }
    }
}

function switchTab(id) {
    const birth = localStorage.getItem(LS_KEY_BIRTH);

    // UI Cleanup: Hide all content, remove active states from all buttons
    document.querySelectorAll('.tab-content').forEach(e => {
        e.classList.remove('active');
        e.style.display = 'none';
    });
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('glass-active');
        b.style.color = 'var(--text-dim)';
    });

    // Activate selected content
    const currentTab = document.getElementById('tab-' + id);
    if (currentTab) {
        currentTab.classList.add('active');
        currentTab.style.display = 'flex';
    }

    // Activate selected button
    const btn = document.getElementById('btn-' + id);
    if (btn) {
        btn.classList.add('glass-active');
        btn.style.color = 'var(--accent)';
    }

    // Trigger Tactical Scan Animation
    const mainContent = document.getElementById('life-main-content');
    if (mainContent && !mainContent.classList.contains('hidden')) {
        mainContent.classList.remove('is-scanning');
        void mainContent.offsetWidth; // Force reflow
        mainContent.classList.add('is-scanning');
    }

    // Logic for Macro-Matrix (life)
    if (id === 'life') {
        const calibration = document.getElementById('life-calibration');
        const mainContent = document.getElementById('life-main-content');

        if (!birth) {
            if (calibration) {
                calibration.classList.remove('hidden');
                calibration.style.display = 'flex';
            }
            if (mainContent) {
                mainContent.classList.add('hidden');
                mainContent.style.display = 'none';
            }
        } else {
            if (calibration) {
                calibration.classList.add('hidden');
                calibration.style.display = 'none';
            }
            if (mainContent) {
                mainContent.classList.remove('hidden');
                mainContent.style.display = 'flex';
            }

            // Check current active view mode in buttons
            const activeBtn = document.querySelector('.view-btn.text-cyan-400');
            const mode = activeBtn ? activeBtn.id.replace('view-', '') : 'years';
            renderLifeGrid(mode);
        }
    }

    // Logic for Ciclo Circadiano (day)
    if (id === 'day') {
        switchTab('life');
        renderLifeGrid('days');
    }

    // Logic for Session Log
    if (id === 'hitos') {
        renderSessionLog();
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
    else if (mode === 'weeks') {
        total = totalYears * 52;
        lived = Math.floor((today - birth) / (604800000));
        cols = 52;
        gap = '2px';
        label = 'Semanas Vividas';
    }
    else if (mode === 'days') {
        // Toggle Containers
        if (grid) grid.style.display = 'none';
        const dayView = document.getElementById('day-view-container');
        if (dayView) {
            dayView.classList.remove('hidden');
            dayView.style.display = 'flex';
        }

        renderDayClock();
    }

    if (lived < 0) lived = 0;

    // Update Stats (UI Hierarchy Refined v3.2)
    const lblEl = document.getElementById('stat-label');
    const livedEl = document.getElementById('stat-lived');
    const leftEl = document.getElementById('stat-left');
    const percentEl = document.getElementById('stat-percent');

    if (lblEl) lblEl.innerText = label || 'Vida Recorrida';
    if (livedEl) livedEl.innerText = lived.toLocaleString();
    if (leftEl) leftEl.innerText = (total - lived).toLocaleString();
    if (percentEl) percentEl.innerText = ((lived / total) * 100).toFixed(1) + '%';

    // Active button state
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('bg-white/10', 'border-cyan-400', 'text-cyan-400', 'text-white'));
    const activeBtnId = (mode === 'days') ? 'view-days' : `view-${mode}`;
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) activeBtn.classList.add('bg-white/10', 'border-cyan-400', 'text-cyan-400');

    // Trigger Tactical Scan Animation on view change
    const mainContent = document.getElementById('life-main-content');
    if (mainContent) {
        mainContent.classList.remove('is-scanning');
        void mainContent.offsetWidth;
        mainContent.classList.add('is-scanning');
    }

    if (mode === 'days') return;

    // Show Macro View
    if (grid) grid.style.display = 'grid';
    const dayView = document.getElementById('day-view-container');
    if (dayView) {
        dayView.style.display = 'none';
        dayView.classList.add('hidden');
    }

    // Grid Layout Config
    grid.className = 'grid w-full mx-auto relative px-4 gap-2';
    grid.style.maxWidth = (mode === 'years') ? '800px' : '1200px';

    // Decade Markers logic: Add a column for markers if in years mode
    if (mode === 'years') {
        grid.style.gridTemplateColumns = `40px repeat(${cols}, minmax(0, 1fr))`;
    } else {
        grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    }
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
            statusClass = 'past bg-cyan-500';
            if (anomaly) statusClass = `anomaly-${anomaly.type}`;
        } else if (i === lived) {
            statusClass = 'present bg-white pulse-grid';
        } else {
            statusClass = 'future bg-white/5 border border-white/5 cursor-pointer';
            if (anomaly) statusClass = `anomaly-${anomaly.type}`;
        }

        // Add Decade Marker if in years mode at the start of each decade (row)
        if (mode === 'years' && i % cols === 0) {
            const marker = document.createElement('div');
            marker.className = 'decade-marker';
            marker.innerText = `${i}y`;
            frag.appendChild(marker);
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

        // Visual Transition: Clear the calibration portal immediately
        const calibration = document.getElementById('life-calibration');
        if (calibration) {
            calibration.classList.add('hidden');
            calibration.style.display = 'none';
        }

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
    document.querySelectorAll('.energy-btn').forEach(b => {
        b.classList.remove('active', 'border-cyan-400', 'bg-cyan-500/20');
        b.style.opacity = '0.4';
    });
    btn.classList.add('active', 'border-cyan-400', 'bg-cyan-500/20');
    btn.style.opacity = '1';
}

function selectCategory(cat, btn) {
    if (selectedCategory === cat) {
        selectedCategory = null;
        btn.classList.remove('bg-cyan-500/30', 'border-cyan-400');
    } else {
        selectedCategory = cat;
        document.querySelectorAll('.category-chip').forEach(b => b.classList.remove('bg-cyan-500/30', 'border-cyan-400'));
        btn.classList.add('bg-cyan-500/30', 'border-cyan-400');
    }
}

function handleSessionTrigger() {
    const input = document.getElementById('current-activity-input');
    const categorySelect = document.getElementById('category-select');
    const btn = document.getElementById('session-main-btn');
    const btnText = document.getElementById('session-btn-text');
    const statusText = document.getElementById('session-status-text');
    const timerDisplay = document.getElementById('session-timer-display');
    const panel = document.getElementById('session-panel');

    if (!isSessionActive) {
        // START SESSION
        const task = input.value.trim();
        const category = categorySelect.value;

        if (!task) {
            alert("Sajor, necesitas describir tu actividad primero.");
            return;
        }

        const fullAction = category ? `[${category}] ${task}` : task;

        isSessionActive = true;
        sessionStartTime = new Date();

        // Visual State: Active Session
        btn.style.background = '#e67e80';
        btn.style.color = 'white';
        btn.classList.add('scanning');
        btnText.innerText = "PARAR SESIÓN";
        statusText.innerText = `EN MISIÓN: ${fullAction.toUpperCase()}`;
        statusText.style.color = 'var(--accent)';

        input.disabled = true;
        categorySelect.disabled = true;

        if (panel) panel.classList.add('session-active');

        // Start hexagon progress visualization
        startHexProgress();
    } else {
        // STOP SESSION
        const task = input.value;
        const category = categorySelect.value;
        const fullAction = category ? `[${category}] ${task}` : task;
        const endTime = new Date();
        const duration = Math.round((endTime - sessionStartTime) / 60000);
        const startStr = sessionStartTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const endStr = endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        saveSessionData(fullAction, startStr, endStr, duration, selectedPillarCode, selectedEnergyMark);

        isSessionActive = false;
        sessionStartTime = null;

        // Visual State: Reset
        btn.style.background = '';
        btn.style.color = '';
        btn.classList.remove('scanning');
        btnText.innerText = "INICIAR SECUENCIA";
        statusText.innerText = "Operación sellada con éxito.";
        statusText.style.color = '#4ade80';

        input.disabled = false;
        categorySelect.disabled = false;
        input.value = "";
        categorySelect.value = "";
        timerDisplay.innerText = "00:00";

        if (panel) panel.classList.remove('session-active');

        // Stop hexagon progress
        stopHexProgress();

        renderDayClock();

        // Reset status after 3 seconds
        setTimeout(() => {
            statusText.innerText = "Sistema en Espera";
            statusText.style.color = '';
        }, 3000);
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

        if (i === currentHour) {
            // Current Time: Brilliant white pulsing highlight
            hex.classList.add('pulse-circular');
        } else if (i < currentHour) {
            // Past Time: Colored to show time already elapsed (Cyan)
            hex.classList.add('bg-cyan-500/60', 'border', 'border-cyan-500/40');
            // If there was a session, maybe a bit more opacity to distinguish but still flat
            if (session) {
                hex.classList.add('opacity-100');
            }
        } else {
            // Future Time: Dark/Grey (Wait state)
            hex.classList.add('bg-white/5', 'border', 'border-white/5');
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

// HEXAGON PROGRESS VISUALIZATION - 1 Large Hex with 60 Mini Hexes
function startHexProgress() {
    const container = document.getElementById('hex-progress-container');
    const grid = document.getElementById('hex-progress-grid');

    if (!container || !grid) return;

    // Show container and reset
    container.classList.remove('hidden');
    grid.innerHTML = '';
    currentHexIndex = 0;

    // Create first hour hexagon (large container with 60 mini hexagons)
    createHourHexagon(0);
}

function createHourHexagon(hourIndex) {
    const grid = document.getElementById('hex-progress-grid');
    if (!grid) return;

    let hourContainer = document.getElementById('hex-hour-main');

    if (!hourContainer) {
        hourContainer = document.createElement('div');
        hourContainer.className = 'hex-hour-container';
        hourContainer.id = 'hex-hour-main';

        for (let i = 1; i <= 5; i++) {
            const layer = document.createElement('div');
            layer.className = `hex-layer hex-layer-${i}`;
            layer.id = `hex-layer-${i}`;
            hourContainer.appendChild(layer);
        }

        const minuteGrid = document.createElement('div');
        minuteGrid.className = 'hex-minute-grid';
        minuteGrid.id = 'minute-grid-main';

        const rowPattern = [6, 8, 9, 10, 10, 9, 8];
        let hexIndex = 0;

        rowPattern.forEach((hexCount, rowIndex) => {
            const row = document.createElement('div');
            row.className = 'hex-row';

            for (let i = 0; i < hexCount; i++) {
                const miniHex = document.createElement('div');
                miniHex.className = 'hex-minute';
                miniHex.id = `minute-${hexIndex}`;
                miniHex.setAttribute('data-minute', hexIndex);
                row.appendChild(miniHex);
                hexIndex++;
            }

            minuteGrid.appendChild(row);
        });

        const label = document.createElement('div');
        label.className = 'hex-hour-label';
        label.id = 'hex-hour-label';
        label.innerText = 'Hora 1';

        hourContainer.appendChild(minuteGrid);
        hourContainer.appendChild(label);
        grid.appendChild(hourContainer);
    }
}

function updateHexProgress(totalMs) {
    const totalSeconds = Math.floor(totalMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const currentHourIndex = Math.floor(totalMinutes / 60);
    const minuteInCurrentHour = totalMinutes % 60;

    // Create new hour hexagon if needed
    if (!document.getElementById('hex-hour-main')) { createHourHexagon(0); }

    // Illuminate layers based on completed hours
    const totalHours = Math.floor(totalMinutes / 60);
    for (let i = 1; i <= 5; i++) {
        const layer = document.getElementById(`hex-layer-${i}`);
        if (layer) {
            if (i <= totalHours) {
                layer.classList.add('illuminated');
            } else {
                layer.classList.remove('illuminated');
            }
        }
    }

    // Update hour label
    const label = document.getElementById('hex-hour-label');
    if (label) {
        label.innerText = `Hora ${totalHours + 1} - ${minuteInCurrentHour}/60`;
    }
    // Update mini hexagons in current hour
    for (let i = 0; i < 60; i++) {
        const miniHex = document.getElementById(`minute-${i}`);
        if (!miniHex) continue;

        if (i < minuteInCurrentHour) {
            // Filled minutes
            miniHex.classList.remove('active');
            miniHex.classList.add('filled');
        } else if (i === minuteInCurrentHour) {
            // Current active minute
            miniHex.classList.remove('filled');
            miniHex.classList.add('active');
        } else {
            // Future minutes
            miniHex.classList.remove('filled', 'active');
        }
    }
}

function stopHexProgress() {
    const container = document.getElementById('hex-progress-container');
    if (container) {
        container.classList.add('hidden');
    }

    currentHexIndex = 0;

    // Clear interval if exists
    if (hexProgressInterval) {
        clearInterval(hexProgressInterval);
        hexProgressInterval = null;
    }
}

// SESSION LOG RENDERING (Book Format)
function renderSessionLog() {
    const dayData = JSON.parse(localStorage.getItem(LS_KEY_DAY_DATA) || '{}');
    const container = document.getElementById('session-log-container');
    const emptyState = document.getElementById('session-log-empty');

    if (!container) return;

    // Get all dates with sessions and sort chronologically (newest first)
    const dates = Object.keys(dayData).sort((a, b) => new Date(b) - new Date(a));

    if (dates.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    container.innerHTML = '';

    // Render each date as a "book page"
    dates.forEach(dateStr => {
        const sessions = dayData[dateStr];
        const date = new Date(dateStr);

        // Create page container
        const page = document.createElement('div');
        page.className = 'session-log-page glass animate-fade-in';

        // Page header (date)
        const pageHeader = document.createElement('div');
        pageHeader.className = 'session-page-header';

        const dateTitle = document.createElement('h3');
        dateTitle.className = 'session-page-date';
        dateTitle.innerHTML = `
            <span class="date-day">${date.toLocaleDateString('es-ES', { weekday: 'long' })}</span>
            <span class="date-full">${date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        `;

        pageHeader.appendChild(dateTitle);
        page.appendChild(pageHeader);

        // Page content (sessions)
        const pageContent = document.createElement('div');
        pageContent.className = 'session-page-content';

        // Get all sessions for this date and sort by hour
        const sessionEntries = Object.entries(sessions).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

        // Calculate total time for the day
        const totalMinutes = sessionEntries.reduce((sum, [_, session]) => sum + (session.duration || 0), 0);

        sessionEntries.forEach(([hour, session]) => {
            const entry = document.createElement('div');
            entry.className = 'session-entry';

            // Time indicator
            const timeIndicator = document.createElement('div');
            timeIndicator.className = 'session-time-indicator';
            timeIndicator.innerHTML = `
                <div class="session-time-dot"></div>
                <div class="session-time-text">${session.time || `${hour.padStart(2, '0')}:00`}</div>
            `;

            // Session details
            const details = document.createElement('div');
            details.className = 'session-details';

            // Extract category from task if present
            let taskName = session.task;
            let category = '';
            const categoryMatch = session.task.match(/^\[(.+?)\]\s*(.+)$/);
            if (categoryMatch) {
                category = categoryMatch[1];
                taskName = categoryMatch[2];
            }

            // Task name
            const taskEl = document.createElement('div');
            taskEl.className = 'session-task-name';
            taskEl.textContent = taskName;

            // Category badge (if exists)
            if (category) {
                const categoryBadge = document.createElement('span');
                categoryBadge.className = 'session-category-badge';
                categoryBadge.textContent = category;
                taskEl.prepend(categoryBadge);
            }

            // Metadata row (pillar, energy, duration)
            const meta = document.createElement('div');
            meta.className = 'session-meta';

            const pillarNames = {
                'pillar-op': 'Operación',
                'pillar-con': 'Conexión',
                'pillar-vit': 'Vitalidad',
                'pillar-chaos': 'Espíritu'
            };

            const pillarColors = {
                'pillar-op': '#00f2ff',
                'pillar-con': '#ff007a',
                'pillar-vit': '#39ff14',
                'pillar-chaos': '#f0f000'
            };

            // Pillar indicator
            const pillarEl = document.createElement('div');
            pillarEl.className = 'session-meta-item session-pillar';
            const pillarColor = pillarColors[session.pillar] || '#666';
            pillarEl.innerHTML = `
                <span class="meta-icon" style="background: ${pillarColor}; box-shadow: 0 0 10px ${pillarColor}33;"></span>
                <span class="meta-label">${pillarNames[session.pillar] || 'General'}</span>
            `;

            // Energy indicator
            const energyEl = document.createElement('div');
            energyEl.className = 'session-meta-item session-energy';
            energyEl.innerHTML = `
                <span class="meta-emoji">${ENERGY_ICONS[session.energy] || '⚡'}</span>
                <span class="meta-label">${session.energy === 'low' ? 'Baja' : session.energy === 'fluid' ? 'Fluido' : 'Carga'}</span>
            `;

            // Duration indicator
            const durationEl = document.createElement('div');
            durationEl.className = 'session-meta-item session-duration';
            durationEl.innerHTML = `
                <span class="meta-icon">⏱️</span>
                <span class="meta-label">${session.duration || 0} min</span>
            `;

            meta.appendChild(pillarEl);
            meta.appendChild(energyEl);
            meta.appendChild(durationEl);

            details.appendChild(taskEl);
            details.appendChild(meta);

            entry.appendChild(timeIndicator);
            entry.appendChild(details);

            pageContent.appendChild(entry);
        });

        // Page footer (summary stats)
        const pageFooter = document.createElement('div');
        pageFooter.className = 'session-page-footer';
        pageFooter.innerHTML = `
            <div class="page-stat">
                <span class="stat-value">${sessionEntries.length}</span>
                <span class="stat-label">Sesiones</span>
            </div>
            <div class="page-stat">
                <span class="stat-value">${totalMinutes}</span>
                <span class="stat-label">Minutos</span>
            </div>
            <div class="page-stat">
                <span class="stat-value">${(totalMinutes / 60).toFixed(1)}</span>
                <span class="stat-label">Horas</span>
            </div>
        `;

        page.appendChild(pageContent);
        page.appendChild(pageFooter);

        container.appendChild(page);
    });
}

// Registro del Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Sajor, enlace neural (PWA) establecido con éxito.', reg))
            .catch(err => console.log('Error en la conexión del enlace:', err));
    });
}
