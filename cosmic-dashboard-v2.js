// HEXAGON PROGRESS - NEW VERSION WITH LAYERS

function createHourHexagon_NEW() {
    const grid = document.getElementById('hex-progress-grid');
    if (!grid) return;

    // Only create ONE hexagon container for the entire session
    let hourContainer = document.getElementById('hex-hour-main');

    if (!hourContainer) {
        // Create main hexagon container (only once)
        hourContainer = document.createElement('div');
        hourContainer.className = 'hex-hour-container';
        hourContainer.id = 'hex-hour-main';

        // Create 5 concentric hexagonal layers (from inner to outer)
        for (let i = 1; i <= 5; i++) {
            const layer = document.createElement('div');
            layer.className = `hex-layer hex-layer-${i}`;
            layer.id = `hex-layer-${i}`;
            hourContainer.appendChild(layer);
        }

        // Grid for 60 mini hexagons
        const minuteGrid = document.createElement('div');
        minuteGrid.className = 'hex-minute-grid';
        minuteGrid.id = 'minute-grid-main';

        // Hexagonal honeycomb pattern: 6, 8, 9, 10, 10, 9, 8 = 60 hexagons
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

        // Label
        const label = document.createElement('div');
        label.className = 'hex-hour-label';
        label.id = 'hex-hour-label';
        label.innerText = 'Hora 1';

        hourContainer.appendChild(minuteGrid);
        hourContainer.appendChild(label);
        grid.appendChild(hourContainer);
    }
}

function updateHexProgress_NEW(totalMs) {
    const totalSeconds = Math.floor(totalMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const minuteInCurrentHour = totalMinutes % 60;

    // Illuminate layers based on completed hours
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

    // Update mini hexagons (resets every 60 minutes)
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
