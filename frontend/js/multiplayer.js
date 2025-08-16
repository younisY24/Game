let opponentSocket = null;
let opponentScore = 0;

export function startMultiplayerGame() {
    opponentSocket = new WebSocket('wss://multiplayer.time-jump.workers.dev');
    
    opponentSocket.onopen = () => {
        console.log('اتصال الوضع الأونلاين ناجح');
        opponentSocket.send(JSON.stringify({ type: 'join', gameId: 'demo' }));
    };
    
    opponentSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'scoreUpdate') {
            opponentScore = data.score;
            updateOpponentUI();
        }
    };
    
    // إرسال النقاط كل ثانيتين
    setInterval(() => {
        if (opponentSocket && opponentSocket.readyState === WebSocket.OPEN) {
            opponentSocket.send(JSON.stringify({ 
                type: 'score', 
                score: window.score || 0 
            }));
        }
    }, 2000);
}

function updateOpponentUI() {
    let opponentElement = document.getElementById('opponent-score');
    if (!opponentElement) {
        opponentElement = document.createElement('div');
        opponentElement.id = 'opponent-score';
        opponentElement.className = 'score-display';
        document.querySelector('.hud').appendChild(opponentElement);
    }
    
    opponentElement.textContent = `المنافس: ${opponentScore.toLocaleString()}`;
}

export function endMultiplayerGame() {
    if (opponentSocket) {
        opponentSocket.close();
        opponentSocket = null;
    }
}
