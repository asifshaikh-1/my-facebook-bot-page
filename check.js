let isConnecting = false;

async function autoConnect() {
    if (isConnecting) return;

    isConnecting = true;

    const button = document.getElementById(\'connectButton\');
    const status = document.getElementById(\'status\');
    const serverDisplay = document.getElementById(\'serverDisplay\');

    button.disabled = true;
    button.innerHTML = \'Connecting... <div class="loading-spinner"></div>\';
    status.textContent = \'Starting server check in 8 seconds...\';
    serverDisplay.innerHTML = \'\';

    // Show 8-second countdown
    for (let i = 8; i > 0; i--) {
        status.textContent = \`Starting server check in ${i} seconds...\`;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    status.textContent = \'Starting server check...\';

    try {
        const response = await fetch(\'/api/auto-connect-visual\');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split(\'\\n\');

            for (const line of lines) {
                if (line.trim() === \'\') continue;

                try {
                    const data = JSON.parse(line.replace(\'data: \', \'\'));

                    if (data.type === \'checking\') {
                        showServerCard(data.server, \'checking\');
                        status.textContent = \`Checking Server ${data.server}...\`;
                    } else if (data.type === \'result\') {
                        if (data.status === \'available\') {
                            updateServerCard(data.server, \'available\', data);
                            status.textContent = \`âœ… Server ${data.server} is available! Opening in 2 seconds...\`;

                            setTimeout(() => {
                                window.location.href = data.url;
                            }, 2000);
                            break;
                        } else if (data.status === \'busy\') {
                            updateServerCard(data.server, \'busy\', data);
                            status.textContent = \`Server ${data.server} is busy (${data.activeCount}/15) - Checking next in 5s...\`;
                            
                            // Hide current server card after showing busy status
                            setTimeout(() => {
                                hideCurrentServerCard(data.server);
                            }, 3000);
                        }
                    } else if (data.type === \'no\\_servers\') {
                        status.textContent = \'âŒ All servers are currently busy. Please try again later.\';
                    }
                } catch (e) {
                    // Ignore JSON parse errors for incomplete chunks
                }
            }
        }

    } catch (error) {
        status.textContent = \'âŒ Connection Error: \' + error.message;
    }

    button.disabled = false;
    button.innerHTML = \'Check fb bot server\';
    isConnecting = false;
}

function showServerCard(serverNumber, status) {
    const serverDisplay = document.getElementById(\'serverDisplay\');

    // Hide previous server card immediately
    const previousCard = document.querySelector(\'\\.server-card\\.show\');
    if (previousCard && previousCard.id !== \`server-${serverNumber}\`) {
        hideServerCard(previousCard);
    }

    const serverCard = document.createElement(\'div\');
    serverCard.className = \`server-card ${status}\`;
    serverCard.id = \`server-${serverNumber}\`;

    serverCard.innerHTML = \`
        <div class="server-header">
            <div class="server-name">Server ${serverNumber}</div>
            <div class="server-status status-${status}">
                ${status === \'checking\' ? \'Checking\' : status}
                ${status === \'checking\' ? \'<div class="loading-spinner"></div>\' : \'\'}
            </div>
        </div>
        <div class="server-details">
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value" id="status-${serverNumber}">
                    ${status === \'checking\' ? \'Connecting...\' : \'Standby\'}
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Response Time</div>
                <div class="detail-value" id="time-${serverNumber}">Measuring...</div>
            </div>
        </div>
    \`;

    serverDisplay.appendChild(serverCard);

    setTimeout(() => {
        serverCard.classList.add(\'show\');
    }, 100);
}

function updateServerCard(serverNumber, status, data) {
    const serverCard = document.getElementById(\`server-${serverNumber}\`);
    const statusElement = document.getElementById(\`status-${serverNumber}\`);
    const timeElement = document.getElementById(\`time-${serverNumber}\`);
    const statusBadge = serverCard.querySelector(\'\\.server-status\');

    serverCard.className = \`server-card show ${status}\`;

    if (status === \'available\') {
        statusElement.textContent = \`Available (${data.activeCount}/15)\`;
        statusBadge.textContent = \'Available\';
        statusBadge.className = \'server-status status-available\';

        setTimeout(() => {
            showSuccessBanner(serverNumber);
        }, 500);
    } else if (status === \'busy\') {
        statusElement.textContent = \`Busy (${data.activeCount}/15)\`;
        statusBadge.textContent = \'Busy\';
        statusBadge.className = \'server-status status-busy\';
    }

    timeElement.textContent = \`${data.responseTime}ms\`;
}

function hideServerCard(card) {
    card.style.opacity = \'0\';
    card.style.transform = \'translateY(-30px)\';
    setTimeout(() => {
        if (card.parentNode) {
            card.remove();
        }
    }, 500);
}

function hideCurrentServerCard(serverNumber) {
    const currentCard = document.getElementById(\`server-${serverNumber}\`);
    if (currentCard) {
        hideServerCard(currentCard);
    }
}

function showSuccessBanner(serverNumber) {
    const status = document.getElementById(\'status\');
    status.innerHTML = \`
        <div class="success-banner">
            ðŸŽ‰ Connected to Server ${serverNumber}! Opening now...
        </div>
    \`;
}

      
