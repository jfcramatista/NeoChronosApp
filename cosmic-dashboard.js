const LS_KEY_BIRTH = 'neo-chronos-birthdate';
const LS_KEY_EXPECTANCY = 'neo-chronos-expectancy';
const LS_KEY_DAY_DATA = 'neo-chronos-day-data';
let totalYears = parseInt(localStorage.getItem(LS_KEY_EXPECTANCY)) || 90;
let timerInterval, timerStartTime, isTimerRunning = false;
let selectedHour = null;

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
        // Direct entry
        document.getElementById('setup-date').value = birth;
        document.getElementById('setup-expectancy').value = totalYears;
        switchTab('life');
    }

    // Start Real-time Clock
    setInterval(updateSystemClock, 1000);
    updateSystemClock();
});

function updateSystemClock() {
    const timeEl = document.getElementById('current-time-big');
    const dateEl = document.getElementById('current-date-full');
    const displayHourField = document.getElementById('display-hour-now');

    if (timeEl && dateEl) {
        const now = new Date();
        timeEl.innerText = now.toLocaleTimeString('en-GB', { hour12: false });
        dateEl.innerText = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

        const currentHour = now.getHours();
        if (displayHourField) displayHourField.innerText = `${currentHour.toString().padStart(2, '0')}:00`;

        // Auto-refresh pulse if in 'day' tab
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
    for (let i = 0; i < total; i++) {
        const d = document.createElement('div');
        let statusClass = '';

        if (i < lived) {
            statusClass = 'bg-cyan-500 opacity-60 hover:opacity-100 hover:bg-cyan-400';
        } else if (i === lived) {
            statusClass = 'current-pulse'; // THE PRESENT MOMENT
        } else {
            statusClass = 'bg-white/5 border border-white/5 hover:border-white/20';
        }

        d.className = `aspect-square transition-all duration-300 hex-shape ${statusClass}`;
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

function toggleTimer() {
    const idleText = document.getElementById('timer-idle-text');
    if (isTimerRunning) {
        clearInterval(timerInterval); isTimerRunning = false;
        if (idleText) { idleText.style.display = 'flex'; idleText.querySelector('span').innerText = 'REANUDAR'; }
    } else {
        timerStartTime = Date.now();
        if (idleText) idleText.style.display = 'none';
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            const d = Date.now() - timerStartTime;
            document.getElementById('timer-min').innerText = Math.floor(d / 60000).toString().padStart(2, '0');
            document.getElementById('timer-sec').innerText = Math.floor((d % 60000) / 1000).toString().padStart(2, '0');
        }, 100);
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

function renderDayClock() {
    const container = document.getElementById('dayClock');
    if (!container) return;

    const dayData = JSON.parse(localStorage.getItem(LS_KEY_DAY_DATA) || '{}');
    const todayStr = new Date().toISOString().split('T')[0];
    const hours = dayData[todayStr] || {};
    const currentHour = new Date().getHours();

    if (container.children.length === 0) {
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
            hex.onclick = () => selectHour(i);
            container.appendChild(hex);
        }
    }

    for (let i = 0; i < 24; i++) {
        const hex = document.getElementById(`hex-hour-${i}`);
        const focus = hours[i];

        hex.classList.remove('bg-cyan-500', 'bg-cyan-500/40', 'current-pulse', 'bg-white/5', 'border-white/5');
        hex.style.boxShadow = 'none';

        if (focus) {
            hex.classList.add('bg-cyan-500');
            hex.style.boxShadow = '0 0 15px #00f2ff';
        } else if (i < currentHour) {
            hex.classList.add('bg-cyan-500/20', 'border', 'border-cyan-500/20');
        } else {
            hex.classList.add('bg-white/5', 'border', 'border-white/5');
        }

        if (i === currentHour) {
            hex.classList.add('current-pulse');
        }
    }
}

function selectHour(h) {
    const dayData = JSON.parse(localStorage.getItem(LS_KEY_DAY_DATA) || '{}');
    const todayStr = new Date().toISOString().split('T')[0];
    const data = (dayData[todayStr] && dayData[todayStr][h]);

    if (data) {
        document.getElementById('current-activity-input').value = data.note;
    }
}

function startDailyActivity() {
    const activityInput = document.getElementById('current-activity-input');
    const activity = activityInput.value;
    if (!activity) { alert("Sajor, define la actividad de comando."); return; }

    const currentHour = new Date().getHours();
    const dayData = JSON.parse(localStorage.getItem(LS_KEY_DAY_DATA) || '{}');
    const todayStr = new Date().toISOString().split('T')[0];

    if (!dayData[todayStr]) dayData[todayStr] = {};
    dayData[todayStr][currentHour] = { type: 'action', note: activity };

    localStorage.setItem(LS_KEY_DAY_DATA, JSON.stringify(dayData));
    renderDayClock();

    // Clear input after start
    activityInput.value = '';
}
