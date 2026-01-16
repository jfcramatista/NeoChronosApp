$content = Get-Content "cosmic-dashboard.js" -Raw

# Replace createHourHexagon function
$pattern = '(?s)function createHourHexagon\(hourIndex\) \{.*?grid\.appendChild\(hourContainer\);[\r\n]+\}'

$newFunction = @'
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
'@

$content = $content -replace $pattern, $newFunction

# Replace updateHexProgress function
$pattern2 = '(?s)function updateHexProgress\(totalMs\) \{.*?^\}'

$newFunction2 = @'
function updateHexProgress(totalMs) {
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
            miniHex.classList.remove('active');
            miniHex.classList.add('filled');
        } else if (i === minuteInCurrentHour) {
            miniHex.classList.remove('filled');
            miniHex.classList.add('active');
        } else {
            miniHex.classList.remove('filled', 'active');
        }
    }
}
'@

$content = $content -replace $pattern2, $newFunction2

Set-Content "cosmic-dashboard.js" -Value $content -NoNewline
Write-Host "Functions replaced successfully!"
