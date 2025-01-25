const WebSocket = require('ws');
const server = new WebSocket.Server({ port: process.env.PORT || 3000 });

// Храним подключенных клиентов
const clients = new Set();

// Храним последние данные
let homeworkData = new Map();

server.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected');

    // Отправляем текущие данные новому клиенту
    ws.send(JSON.stringify({
        type: 'init',
        data: Array.from(homeworkData.values())
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'new_homework') {
                // Сохраняем новое домашнее задание
                const hw = data.data;
                const key = `${hw.day}_${hw.subject}`;
                homeworkData.set(key, hw);

                // Отправляем всем клиентам, кроме отправителя
                broadcast(ws, {
                    type: 'homework_update',
                    homework: hw
                });
            } else if (data.type === 'sync') {
                // Обновляем данные с клиента
                data.data.forEach(hw => {
                    const key = `${hw.day}_${hw.subject}`;
                    if (!homeworkData.has(key) || homeworkData.get(key).timestamp < hw.timestamp) {
                        homeworkData.set(key, hw);
                    }
                });

                // Отправляем обновленные данные всем
                broadcast(null, {
                    type: 'sync_complete',
                    data: Array.from(homeworkData.values())
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected');
    });
});

function broadcast(sender, data) {
    const message = JSON.stringify(data);
    for (const client of clients) {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

console.log('WebSocket server started'); 