/**
 * Friday Dashboard - Main Application
 * Navigation, Data Loading, Tasks, Cron Jobs
 */

// ============================================================
//  NAVIGATION
// ============================================================
function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) item.classList.add('active');
    });
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) targetPage.classList.add('active');
    
    // Update page title
    const titles = {
        'overview': 'Overview', 'agents': 'Agents', 'projects': 'Projetos',
        'tasks': 'Tarefas', 'memory': 'Memória', 'skills': 'Skills',
        'gym': 'Training Gym', 'cron': 'Cron Jobs', 'logs': 'Logs'
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl && titles[page]) titleEl.textContent = titles[page];
    
    // Initialize office if needed
    if (page === 'gym' && typeof boot === 'function') boot();
    
    // Load page-specific data
    if (page === 'tasks') renderTasks();
    if (page === 'cron') renderCronJobs();
}

// Setup navigation listeners
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(item.dataset.page);
        document.querySelectorAll('.bnav-item').forEach(b => {
            b.classList.toggle('active', b.dataset.page === item.dataset.page);
        });
    });
});

// ============================================================
//  SIDEBAR TOGGLE (mobile)
// ============================================================
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
}

function openSidebar() {
    document.querySelector('.sidebar').classList.add('open');
    const ov = document.querySelector('.sidebar-overlay');
    if (ov) { ov.style.display = 'block'; requestAnimationFrame(() => ov.classList.add('active')); }
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    document.querySelector('.sidebar').classList.remove('open');
    const ov = document.querySelector('.sidebar-overlay');
    if (ov) {
        ov.classList.remove('active');
        setTimeout(() => { if (!ov.classList.contains('active')) ov.style.display = ''; }, 300);
    }
    document.body.style.overflow = '';
}

// ============================================================
//  BOTTOM NAV
// ============================================================
function bnSelect(el) {
    document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
}

// ============================================================
//  TIME UPDATES
// ============================================================
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-PT', {
        timeZone: 'Europe/Lisbon',
        hour: '2-digit',
        minute: '2-digit'
    });
    const lastUpdate = document.getElementById('last-update');
    const footerTime = document.getElementById('footer-time');
    if (lastUpdate) lastUpdate.textContent = timeStr;
    if (footerTime) footerTime.textContent = timeStr + ' WET';
}

updateTime();
setInterval(updateTime, 60000);

// ============================================================
//  LIVE DATA INTEGRATION - Real-time polling every 30s
// ============================================================
async function loadLiveData() {
    try {
        const [agents, cron, tasks, logs, metrics] = await Promise.all([
            fetch("data/agents.json?v=" + Date.now()).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch('data/cron.json').then(r => r.ok ? r.json() : null).catch(() => null),
            fetch('data/tasks.json').then(r => r.ok ? r.json() : null).catch(() => null),
            fetch('data/logs.json').then(r => r.ok ? r.json() : null).catch(() => null),
            fetch('data/metrics.json').then(r => r.ok ? r.json() : null).catch(() => null)
        ]);
        
        let hasUpdates = false;
        if (agents && Array.isArray(agents) && typeof AGENTS !== 'undefined') {
            agents.forEach(a => {
                if (AGENTS[a.id]) {
                    if (AGENTS[a.id].status !== a.status || AGENTS[a.id].task !== a.task) {
                        hasUpdates = true;
                    }
                    AGENTS[a.id].status = a.status || AGENTS[a.id].status;
                    AGENTS[a.id].task = a.task || AGENTS[a.id].task;
                    AGENTS[a.id].progress = a.progress !== undefined ? a.progress : AGENTS[a.id].progress;
                    AGENTS[a.id].lastSeen = a.lastSeen || new Date().toISOString();
                }
            });
            if (hasUpdates && typeof renderUI === 'function') {
                console.log('✓ Live agents updated:', new Date().toLocaleTimeString());
                renderUI();
            }
        }

        window.liveData = { agents, cron, tasks, logs, metrics };
        
        // Update last refresh indicator
        const refreshIndicator = document.getElementById('refresh-indicator');
        if (refreshIndicator) {
            refreshIndicator.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite;"></span>● LIVE · ' + new Date().toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
        }
    } catch(e) {
        console.log('Using default data (no live feed)');
    }
}

// Initial load + polling every 30 seconds
loadLiveData();
setInterval(loadLiveData, 30000);
console.log('📡 Real-time polling active (30s interval)');

// ============================================================
//  TASKS RENDERING
// ============================================================
async function renderTasks() {
    try {
        const response = await fetch('data/tasks.json?t=' + Date.now());
        const tasks = await response.json();
        
        const container = document.getElementById('tasks-container');
        const subtitle = document.getElementById('tasks-subtitle');
        
        if (!tasks || tasks.length === 0) {
            if (container) container.innerHTML = `
                <div style="padding:40px 20px;text-align:center;color:var(--text-tertiary);">
                    <div style="font-size:48px;margin-bottom:16px;">📋</div>
                    <div style="font-size:15px;font-weight:500;">Nenhuma tarefa ativa</div>
                    <div style="font-size:12px;margin-top:8px;">Adiciona tarefas em TASKS.md</div>
                </div>
            `;
            if (subtitle) subtitle.textContent = '0 tarefas pendentes';
            return;
        }
        
        const pendingTasks = tasks.filter(t => t.status !== 'completed');
        if (subtitle) subtitle.textContent = `${pendingTasks.length} tarefa${pendingTasks.length !== 1 ? 's' : ''} pendente${pendingTasks.length !== 1 ? 's' : ''}`;
        
        const priorityColors = {
            'high': { bg: 'rgba(220,38,38,0.12)', color: '#dc2626', label: 'ALTA' },
            'medium': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'MÉDIA' },
            'low': { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', label: 'BAIXA' }
        };
        
        const assigneeColors = {
            'Fabio': '#dc2626', 'Friday': '#3b82f6', 'Scout': '#22c55e',
            'KDB': '#f59e0b', 'Jarvis': '#8b5cf6', 'Vision': '#0ea5e9'
        };
        
        if (container) {
            container.innerHTML = tasks.map((task, idx) => {
                const p = priorityColors[task.priority] || priorityColors.medium;
                const color = assigneeColors[task.assignee] || '#64748b';
                const isDone = task.status === 'completed';
                
                return `
                    <div style="display:flex;align-items:flex-start;gap:14px;padding:16px 10px;border-radius:12px;transition:background 0.15s;cursor:pointer;${isDone ? 'opacity:0.5;' : ''}" onmouseenter="this.style.background='var(--bg-tertiary)'" onmouseleave="this.style.background='transparent'">
                        <div style="width:18px;height:18px;border-radius:5px;border:2px solid ${isDone ? '#22c55e' : 'var(--border-hover)'};margin-top:3px;flex-shrink:0;cursor:pointer;transition:var(--transition);display:flex;align-items:center;justify-content:center;" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='${isDone ? '#22c55e' : 'var(--border-hover)'}'">
                            ${isDone ? '<span style="color:#22c55e;font-size:12px;">✓</span>' : ''}
                        </div>
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
                                <span style="font-size:10px;background:${p.bg};color:${p.color};border:1px solid ${p.color}33;padding:1px 8px;border-radius:5px;font-weight:700;letter-spacing:0.3px;">${p.label}</span>
                                <span style="font-size:14px;font-weight:550;letter-spacing:-0.1px;${isDone ? 'text-decoration:line-through;' : ''}">${task.title}</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:14px;">
                                <span style="font-size:11px;color:var(--text-tertiary);display:flex;align-items:center;gap:5px;">
                                    <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;"></span>
                                    ${task.assignee}
                                </span>
                                ${task.source ? `<span style="font-size:11px;color:var(--text-tertiary);">${task.source}</span>` : ''}
                                ${task.dueDate ? `<span style="font-size:11px;color:var(--accent);">📅 ${task.dueDate}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    ${idx < tasks.length - 1 ? '<div style="height:1px;background:var(--border);margin:2px 10px;"></div>' : ''}
                `;
            }).join('');
        }
    } catch (e) {
        console.error('Failed to load tasks:', e);
        const container = document.getElementById('tasks-container');
        if (container) container.innerHTML = `
            <div style="padding:40px 20px;text-align:center;color:var(--text-tertiary);">
                <div style="font-size:15px;">Erro ao carregar tarefas</div>
                <div style="font-size:12px;margin-top:8px;">Tenta novamente mais tarde</div>
            </div>
        `;
    }
}

// ============================================================
//  CRON JOBS RENDERING
// ============================================================
async function renderCronJobs() {
    try {
        const response = await fetch('data/cron.json?t=' + Date.now());
        const cronData = await response.json();
        
        const jobs = Array.isArray(cronData) ? cronData : (cronData.jobs || []);
        
        const container = document.getElementById('cron-container');
        const subtitle = document.getElementById('cron-subtitle');
        const historyContainer = document.getElementById('cron-history');
        
        if (!jobs || jobs.length === 0) {
            if (container) container.innerHTML = `
                <div style="padding:40px 20px;text-align:center;color:var(--text-tertiary);">
                    <div style="font-size:48px;margin-bottom:16px;">⏰</div>
                    <div style="font-size:15px;font-weight:500;">Nenhum cron job configurado</div>
                    <div style="font-size:12px;margin-top:8px;">Adiciona jobs via <code>openclaw cron add</code></div>
                </div>
            `;
            if (subtitle) subtitle.textContent = '0 jobs ativos';
            if (historyContainer) historyContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);">Sem histórico disponível</div>';
            return;
        }
        
        const activeJobs = jobs.filter(j => j.enabled !== false);
        if (subtitle) subtitle.textContent = `${activeJobs.length} job${activeJobs.length !== 1 ? 's' : ''} ativo${activeJobs.length !== 1 ? 's' : ''}`;
        
        function parseSchedule(schedule) {
            if (!schedule) return 'Desconhecido';
            if (typeof schedule === 'string') return schedule;
            if (schedule.expr) {
                if (schedule.expr === '*/5 * * * *') return 'A cada 5 minutos';
                if (schedule.expr === '0 */6 * * *') return 'A cada 6 horas';
                if (schedule.expr.includes('54 3')) return '04:24 diário';
                return schedule.expr;
            }
            if (schedule.kind === 'every' && schedule.everyMs) {
                const hours = Math.floor(schedule.everyMs / 3600000);
                return `A cada ${hours} horas`;
            }
            return schedule.kind || 'Desconhecido';
        }
        
        if (container) {
            container.innerHTML = jobs.map(job => {
                const isActive = job.enabled !== false;
                const scheduleText = parseSchedule(job.schedule);
                
                return `
                    <div style="background:linear-gradient(135deg,${isActive ? 'rgba(220,38,38,0.07)' : 'rgba(100,100,100,0.07)'} 0%,var(--bg-tertiary) 100%);border:1px solid ${isActive ? 'rgba(220,38,38,0.15)' : 'var(--border)'};border-radius:14px;padding:20px 22px;display:flex;align-items:center;gap:18px;margin-bottom:12px;">
                        <div style="width:50px;height:50px;border-radius:14px;background:${isActive ? 'var(--accent-dim)' : 'var(--bg-card)'};border:1px solid ${isActive ? 'rgba(220,38,38,0.2)' : 'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">
                            ${job.name?.includes('Training') ? '🏋️' : job.name?.includes('Backup') ? '💾' : job.name?.includes('Dashboard') ? '📊' : '⏰'}
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:15px;font-weight:650;letter-spacing:-0.2px;margin-bottom:5px;">${job.name || 'Cron Job'}</div>
                            <div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:12px;line-height:1.6;">${job.id ? job.id.substring(0, 8) : '...'} · ${job.sessionTarget || 'isolated'}</div>
                            <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
                                <span style="font-size:11.5px;color:var(--text-tertiary);display:flex;align-items:center;gap:5px;">
                                    ⏱ <span style="font-family:monospace;color:var(--accent);font-weight:700;font-size:12px;">${scheduleText}</span>
                                </span>
                                <span style="font-size:11.5px;color:var(--text-tertiary);">${job.payload?.kind || 'system'}</span>
                            </div>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;">
                            <span style="font-size:10px;background:${isActive ? 'var(--success-dim)' : 'var(--bg-card)'};color:${isActive ? 'var(--success)' : 'var(--text-tertiary)'};border:1px solid ${isActive ? 'rgba(34,197,94,0.2)' : 'var(--border)'};padding:4px 12px;border-radius:20px;font-weight:700;white-space:nowrap;">
                                ${isActive ? '● ACTIVO' : '○ INACTIVO'}
                            </span>
                            <span style="font-size:10.5px;color:var(--text-tertiary);font-family:monospace;">${job.id ? job.id.substring(0, 8) : '...'}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        if (historyContainer) {
            historyContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);">Histórico não disponível via API</div>';
        }
    } catch (e) {
        console.error('Failed to load cron jobs:', e);
        const container = document.getElementById('cron-container');
        if (container) container.innerHTML = `
            <div style="padding:40px 20px;text-align:center;color:var(--text-tertiary);">
                <div style="font-size:15px;">Erro ao carregar cron jobs</div>
                <div style="font-size:12px;margin-top:8px;">Tenta novamente mais tarde</div>
            </div>
        `;
    }
}

// ============================================================
//  INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    renderTasks();
    renderCronJobs();
    
    // Update sidebar counts
    fetch('data/tasks.json?t=' + Date.now())
        .then(r => r.json())
        .then(tasks => {
            const pending = tasks ? tasks.filter(t => t.status !== 'completed').length : 0;
            const badge = document.querySelector('.bnav-item[data-page="tasks"] .bnav-badge');
            if (badge) badge.textContent = pending;
        })
        .catch(() => {});
});
