const fs = require('fs');
const path = require('path');

const WORKSPACE_PATH = './workspace';
const DATA_DIR = './data';

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getFileCount(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) return 0;
        return fs.readdirSync(dirPath).filter(f => fs.statSync(path.join(dirPath, f)).isFile()).length;
    } catch { return 0; }
}

function getRecentFiles(dirPath, limit = 10) {
    try {
        if (!fs.existsSync(dirPath)) return [];
        return fs.readdirSync(dirPath)
            .filter(f => f.endsWith('.md'))
            .map(f => ({
                name: f,
                time: fs.statSync(path.join(dirPath, f)).mtime
            }))
            .sort((a, b) => b.time - a.time)
            .slice(0, limit)
            .map(f => f.name);
    } catch { return []; }
}

function extractMemoryEntries() {
    const memoryPath = path.join(WORKSPACE_PATH, 'memory');
    const entries = [];
    
    try {
        const files = getRecentFiles(memoryPath, 5);
        files.forEach(file => {
            const content = fs.readFileSync(path.join(memoryPath, file), 'utf8');
            const date = file.replace('.md', '');
            const preview = content.substring(0, 100).replace(/\n/g, ' ');
            entries.push({
                date,
                title: content.match(/^#+\s*(.+)/m)?.[1] || 'Memory Entry',
                preview: preview + (content.length > 100 ? '...' : ''),
                type: 'memory'
            });
        });
    } catch (e) {
        console.log('Memory read error:', e.message);
    }
    
    return entries;
}

function extractDiaryEntries() {
    const diaryPath = path.join(WORKSPACE_PATH, 'diary');
    const entries = [];
    
    try {
        const files = getRecentFiles(diaryPath, 5);
        files.forEach(file => {
            const content = fs.readFileSync(path.join(diaryPath, file), 'utf8');
            const lines = content.split('\n').filter(l => l.trim());
            const date = file.replace('.md', '');
            entries.push({
                date,
                title: lines[0]?.substring(0, 50) || 'Diary Entry',
                preview: lines.slice(1, 3).join(' ').substring(0, 100),
                type: 'diary'
            });
        });
    } catch (e) {
        console.log('Diary read error:', e.message);
    }
    
    return entries;
}

function generateAgents() {
    // In future, this could read from AGENTS.md
    return [
        { id: 'friday', name: 'Friday', status: 'working', task: 'Mission Control Active', progress: 100, hex: '#dc2626', location: 'mission', model: 'Kimi 2.5', lastSeen: new Date().toISOString() },
        { id: 'jarvis', name: 'Jarvis', status: 'standby', task: 'Awaiting orders', progress: 0, hex: '#f59e0b', location: 'unidreamity', model: 'Kimi 2.5', lastSeen: new Date().toISOString() },
        { id: 'vision', name: 'Vision', status: 'standby', task: 'Academic monitoring', progress: 0, hex: '#3b82f6', location: 'study', model: 'Kimi 2.5', lastSeen: new Date().toISOString() },
        { id: 'scout', name: 'Scout', status: 'standby', task: 'Research ready', progress: 0, hex: '#22c55e', location: 'research', model: 'Kimi 2.5', lastSeen: new Date().toISOString() },
        { id: 'kdb', name: 'Coder', status: 'standby', task: 'Code review ready', progress: 0, hex: '#8b5cf6', location: 'devlab', model: 'Kimi 2.5', lastSeen: new Date().toISOString() }
    ];
}

function generateTasks() {
    // In future, this could parse from a tasks file
    return [
        { id: 'whatsapp-515', title: 'WhatsApp Integration Error 515', priority: 'medium', status: 'pending', source: 'system' },
        { id: 'mpesa-integration', title: 'M-Pesa Moçambique Integration', priority: 'medium', status: 'pending', source: 'system' },
        { id: 'dashboard-live', title: 'Friday Dashboard Live - Real Data Pipeline', priority: 'high', status: 'in-progress', source: 'system' }
    ];
}

function generateLogs() {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    
    return [
        { time, level: 'INFO', message: 'Dashboard stats updated from workspace', agent: 'System' },
        { time: '04:24', level: 'TRAIN', message: 'Elite Training Protocol scheduled', agent: 'Friday' },
        { time: '03:54', level: 'TRAIN', message: 'Training completed - Report sent', agent: 'Friday' }
    ];
}

function main() {
    ensureDir(DATA_DIR);
    
    const now = new Date().toISOString();
    
    // Generate all data files
    const agents = generateAgents();
    const tasks = generateTasks();
    const logs = generateLogs();
    const memoryEntries = extractMemoryEntries();
    const diaryEntries = extractDiaryEntries();
    
    // Agents
    fs.writeFileSync(path.join(DATA_DIR, 'agents.json'), JSON.stringify(agents, null, 2));
    
    // Cron (placeholder - could read from cron config)
    fs.writeFileSync(path.join(DATA_DIR, 'cron.json'), JSON.stringify({
        active: 1,
        total: 1,
        jobs: [{
            id: 'training-protocol',
            name: 'Friday Elite Training Protocol',
            schedule: { expr: '54 3 * * *', tz: 'Europe/Lisbon' },
            enabled: true,
            nextRun: '2026-03-20T03:54:00Z'
        }]
    }, null, 2));
    
    // Tasks
    fs.writeFileSync(path.join(DATA_DIR, 'tasks.json'), JSON.stringify(tasks, null, 2));
    
    // Logs
    fs.writeFileSync(path.join(DATA_DIR, 'logs.json'), JSON.stringify(logs, null, 2));
    
    // Memory
    fs.writeFileSync(path.join(DATA_DIR, 'memory.json'), JSON.stringify(memoryEntries, null, 2));
    
    // Metrics
    fs.writeFileSync(path.join(DATA_DIR, 'metrics.json'), JSON.stringify({
        timestamp: now,
        memory: {
            totalEntries: getFileCount(path.join(WORKSPACE_PATH, 'memory')),
            today: new Date().toISOString().split('T')[0]
        },
        diary: {
            totalEntries: getFileCount(path.join(WORKSPACE_PATH, 'diary'))
        },
        agents: {
            total: 5,
            working: 1,
            standby: 4
        },
        tasks: {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length
        },
        training: {
            sessions: 1,
            nextSession: '2026-03-20T03:54:00Z',
            status: 'scheduled'
        },
        version: '1.0.0-live'
    }, null, 2));
    
    console.log('✓ Stats generated at', now);
    console.log('  - Memory entries:', memoryEntries.length);
    console.log('  - Diary entries:', diaryEntries.length);
    console.log('  - Agents:', agents.length);
    console.log('  - Tasks:', tasks.length);
}

main();
