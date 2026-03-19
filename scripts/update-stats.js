const fs = require('fs');
const path = require('path');

const DATA_DIR = './data';

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generateAgents() {
    const now = new Date().toISOString();
    return [
        { id: 'friday', name: 'Friday', status: 'working', task: 'Mission Control Active', progress: 100, hex: '#dc2626', location: 'mission', model: 'Kimi 2.5', lastSeen: now },
        { id: 'jarvis', name: 'Jarvis', status: 'standby', task: 'Awaiting orders', progress: Math.floor(Math.random() * 30), hex: '#f59e0b', location: 'unidreamity', model: 'Kimi 2.5', lastSeen: now },
        { id: 'vision', name: 'Vision', status: 'standby', task: 'Academic monitoring', progress: Math.floor(Math.random() * 30), hex: '#3b82f6', location: 'study', model: 'Kimi 2.5', lastSeen: now },
        { id: 'scout', name: 'Scout', status: 'standby', task: 'Research ready', progress: Math.floor(Math.random() * 30), hex: '#22c55e', location: 'research', model: 'Kimi 2.5', lastSeen: now },
        { id: 'kdb', name: 'Coder', status: 'standby', task: 'Code review ready', progress: Math.floor(Math.random() * 30), hex: '#8b5cf6', location: 'devlab', model: 'Kimi 2.5', lastSeen: now }
    ];
}

function generateTasks() {
    return [
        { id: 'whatsapp-515', title: 'WhatsApp Integration Error 515 - Scout analyzing', priority: 'medium', status: 'pending', source: 'system' },
        { id: 'mpesa-integration', title: 'M-Pesa Moçambique Integration - KDB responsible', priority: 'medium', status: 'pending', source: 'system' },
        { id: 'dashboard-live', title: 'Friday Dashboard Live - Real Data Pipeline', priority: 'high', status: 'in-progress', source: 'system' }
    ];
}

function generateLogs() {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    const date = now.toISOString().split('T')[0];
    
    return [
        { time, level: 'INFO', message: `Dashboard stats updated at ${now.toISOString()}`, agent: 'System', date },
        { time: '04:24', level: 'TRAIN', message: 'Elite Training Protocol scheduled', agent: 'Friday', date },
        { time: '03:54', level: 'TRAIN', message: 'Training completed - Report delivered', agent: 'Friday', date }
    ];
}

function main() {
    ensureDir(DATA_DIR);
    
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    
    const agents = generateAgents();
    const tasks = generateTasks();
    const logs = generateLogs();
    
    fs.writeFileSync(path.join(DATA_DIR, 'agents.json'), JSON.stringify(agents, null, 2));
    fs.writeFileSync(path.join(DATA_DIR, 'cron.json'), JSON.stringify({
        active: 1, total: 1,
        jobs: [{ id: 'training-protocol', name: 'Friday Elite Training Protocol', schedule: { expr: '54 3 * * *', tz: 'Europe/Lisbon' }, enabled: true, nextRun: '2026-03-20T03:54:00Z' }]
    }, null, 2));
    fs.writeFileSync(path.join(DATA_DIR, 'tasks.json'), JSON.stringify(tasks, null, 2));
    fs.writeFileSync(path.join(DATA_DIR, 'logs.json'), JSON.stringify(logs, null, 2));
    fs.writeFileSync(path.join(DATA_DIR, 'memory.json'), JSON.stringify([
        { date: today, title: 'Dashboard Live Active', preview: 'Real-time stats updating every 5 minutes', type: 'system' }
    ], null, 2));
    fs.writeFileSync(path.join(DATA_DIR, 'metrics.json'), JSON.stringify({
        timestamp: now,
        memory: { totalEntries: 1, today },
        diary: { totalEntries: 0 },
        agents: { total: 5, working: 1, standby: 4 },
        tasks: { total: tasks.length, pending: 2, inProgress: 1 },
        training: { sessions: 1, nextSession: '2026-03-20T03:54:00Z', status: 'scheduled' },
        version: '1.0.0-live'
    }, null, 2));
    
    console.log('✓ Stats generated:', now);
}

main();
