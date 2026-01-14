const LS_KEY_BIRTH = 'neo-chronos-birthdate';
const TOTAL_YEARS = 90;
let timerInterval, timerStartTime, isTimerRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    const birth = localStorage.getItem(LS_KEY_BIRTH);
    if (!birth) {
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
        }
    } else {
        // Direct entry
        document.getElementById('setup-date').value = birth;
        switchTab('life');
    }
});

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
            mainContent.style.display = 'none';
        } else {
            calibration.classList.add('hidden');
            calibration.style.display = 'none';
            mainContent.classList.remove('hidden');
            mainContent.style.display = 'flex';
            renderLifeGrid('years'); // Start with Years as requested
        }
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
        total = TOTAL_YEARS;
        lived = today.getFullYear() - birth.getFullYear();
        cols = 10;
        gap = '8px';
        label = 'Años Vividos';
    }
    else if (mode === 'months') {
        total = TOTAL_YEARS * 12;
        lived = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        cols = 36;
        gap = '4px';
        label = 'Meses Vividos';
    }
    else {
        // weeks
        total = TOTAL_YEARS * 52;
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
    grid.className = 'grid w-full animate-fade-in';
    grid.style.maxWidth = 'none';
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.style.gap = (mode === 'years') ? '10px' : (mode === 'months' ? '4px' : '2px');

    const frag = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
        const d = document.createElement('div');
        d.className = 'aspect-square rounded-[1px] transition-all duration-300 ' +
            (i < lived ? 'bg-cyan-500 opacity-60 hover:opacity-100 hover:bg-cyan-400' : 'bg-white/5 border border-white/5 hover:border-white/20');
        frag.appendChild(d);
    }
    grid.appendChild(frag);

    // Active button state
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('bg-white/10', 'border-cyan-400', 'text-cyan-400'));
    const vb = document.getElementById('view-' + mode);
    if (vb) vb.classList.add('bg-white/10', 'border-cyan-400', 'text-cyan-400');
}

function saveLifeCalibration() {
    const val = document.getElementById('life-birth-input').value;
    if (val) {
        localStorage.setItem(LS_KEY_BIRTH, val);
        const dInput = document.getElementById('setup-date');
        if (dInput) dInput.value = val;
        switchTab('life');
    } else {
        alert("Sajor, la Matrix requiere un origen válido para trazar tu existencia.");
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
    const val = document.getElementById('setup-date').value;
    if (val) {
        localStorage.setItem(LS_KEY_BIRTH, val);
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) overlay.style.display = 'none';
        switchTab('life');
    }
}

function resetSystem() {
    if (confirm('¿Reiniciar sistema? Perderás tu origen y memorias.')) {
        localStorage.removeItem(LS_KEY_BIRTH);
        location.reload();
    }
}
