import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlertTriangle, ArrowUpRight, Bot, Boxes, Check, ChevronDown, CircleHelp,
  Cloud, Cpu, Database, ExternalLink, HardDrive, LayoutDashboard, LifeBuoy, ListFilter,
  LockKeyhole, Menu, MoreHorizontal, Plus, QrCode, RefreshCw, Rocket, Search, Server,
  Settings, ShieldCheck, SlidersHorizontal, TerminalSquare, Trash2, Wifi, X, Zap
} from 'lucide-react';
import './styles.css';

const initialServers = [
  { id: 'fra-01', name: 'Frankfurt Edge', host: 'fra-01.tdfhost.net', location: 'Frankfurt, DE', status: 'Online', bots: 4, cpu: 32, memory: 58, storage: 41, uptime: '14d 08h', version: 'v1.8.4', accent: 'mint' },
  { id: 'lon-02', name: 'London Core', host: 'lon-02.tdfhost.net', location: 'London, UK', status: 'Online', bots: 3, cpu: 47, memory: 63, storage: 38, uptime: '28d 12h', version: 'v1.8.4', accent: 'blue' },
  { id: 'ams-03', name: 'Amsterdam Lab', host: 'ams-03.tdfhost.net', location: 'Amsterdam, NL', status: 'Warning', bots: 2, cpu: 71, memory: 82, storage: 67, uptime: '6d 04h', version: 'v1.8.3', accent: 'amber' },
  { id: 'sin-04', name: 'Singapore Relay', host: 'sin-04.tdfhost.net', location: 'Singapore, SG', status: 'Offline', bots: 0, cpu: 0, memory: 0, storage: 29, uptime: '—', version: 'v1.8.4', accent: 'slate' }
];

const initialBots = [
  { id: 'tdf-support', name: 'TDF Support', server: 'fra-01', number: '+49 151 8832 0401', state: 'Connected', health: 'Healthy', uptime: '3d 11h', last: 'Just now', color: 'purple' },
  { id: 'orders-eu', name: 'Orders EU', server: 'fra-01', number: '+49 151 8832 0402', state: 'Connected', health: 'Healthy', uptime: '14h 22m', last: '2m ago', color: 'blue' },
  { id: 'alerts-core', name: 'Alerts Core', server: 'lon-02', number: '+44 7400 112 908', state: 'Connected', health: 'Healthy', uptime: '8d 03h', last: '4m ago', color: 'orange' },
  { id: 'sales-relay', name: 'Sales Relay', server: 'lon-02', number: '+44 7400 112 909', state: 'Reconnecting', health: 'Attention', uptime: '—', last: '11m ago', color: 'pink' },
  { id: 'nl-community', name: 'NL Community', server: 'ams-03', number: '+31 6 8812 7741', state: 'Connected', health: 'Healthy', uptime: '2d 01h', last: '6m ago', color: 'green' },
  { id: 'beta-lab', name: 'Beta Lab', server: 'ams-03', number: '+31 6 8812 7742', state: 'Stopped', health: 'Idle', uptime: '—', last: '2h ago', color: 'slate' }
];

const logs = [
  ['DEPLOY', 'TDF Support deployed to Frankfurt Edge', '2 min ago', 'good'],
  ['CONNECT', 'Orders EU session refreshed successfully', '6 min ago', 'good'],
  ['WARN', 'Sales Relay is attempting to reconnect', '11 min ago', 'warn'],
  ['SERVER', 'Amsterdam Lab agent reported high memory', '18 min ago', 'warn'],
  ['ACTION', 'Operator restarted Alerts Core', '34 min ago', 'neutral'],
  ['SECURITY', 'API token rotated for London Core', '1h ago', 'good']
];

function App() {
  const [servers, setServers] = useState(initialServers);
  const [bots, setBots] = useState(initialBots);
  const [activeNav, setActiveNav] = useState('Overview');
  const [selectedServer, setSelectedServer] = useState('all');
  const [selectedBot, setSelectedBot] = useState('tdf-support');
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [toast, setToast] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleBots = useMemo(() => bots.filter(bot => {
    const matchesServer = selectedServer === 'all' || bot.server === selectedServer;
    const haystack = `${bot.name} ${bot.number} ${bot.server}`.toLowerCase();
    return matchesServer && haystack.includes(query.toLowerCase());
  }), [bots, selectedServer, query]);

  const activeBot = bots.find(bot => bot.id === selectedBot) || bots[0];
  const onlineServers = servers.filter(s => s.status === 'Online').length;
  const connectedBots = bots.filter(b => b.state === 'Connected').length;
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };

  function toggleBot(bot) {
    const next = bot.state === 'Stopped' ? 'Connected' : 'Stopped';
    setBots(current => current.map(item => item.id === bot.id ? { ...item, state: next, health: next === 'Connected' ? 'Healthy' : 'Idle', last: 'Just now' } : item));
    notify(`${bot.name} ${next === 'Connected' ? 'started' : 'stopped'}`);
  }

  function addServer(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = String(data.get('name')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `server-${servers.length + 1}`;
    setServers(current => [...current, { id, name: data.get('name'), host: data.get('host'), location: data.get('location') || 'Unassigned', status: 'Online', bots: 0, cpu: 8, memory: 12, storage: 4, uptime: '0m', version: 'v1.8.4', accent: 'blue' }]);
    setShowAdd(false); notify('Server registered and agent check queued');
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><span>T</span><span>D</span><span>F</span></div><div><strong>TDF</strong><small>BOTOPS CONTROL</small></div><button className="close-mobile" onClick={() => setMobileOpen(false)}><X size={18}/></button></div>
      <div className="workspace-switch"><span className="workspace-dot"/><div><small>WORKSPACE</small><strong>TDF Production</strong></div><ChevronDown size={15}/></div>
      <nav className="nav-group"><p>CONTROL PLANE</p>{[['Overview', LayoutDashboard], ['Servers', Server], ['Bot deployments', Bot], ['Activity logs', Activity]].map(([label, Icon]) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => { setActiveNav(label); setMobileOpen(false); }}><Icon size={17}/><span>{label}</span>{label === 'Bot deployments' && <em>{bots.length}</em>}</button>)}</nav>
      <nav className="nav-group secondary"><p>OPERATE</p>{[['Deploy queue', Rocket], ['Credentials', LockKeyhole], ['Settings', Settings]].map(([label, Icon]) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => { setActiveNav(label); setMobileOpen(false); }}><Icon size={17}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-spacer"/><div className="support-card"><div className="support-icon"><LifeBuoy size={16}/></div><div><strong>Need a hand?</strong><span>Read the VPS runbook</span></div><ArrowUpRight size={14}/></div>
      <div className="user-card"><div className="avatar">MK</div><div><strong>Max K.</strong><span>Administrator</span></div><MoreHorizontal size={16}/></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={21}/></button><div className="crumb"><span>TDF Production</span><ChevronDown size={14}/><b>{activeNav}</b></div><div className="top-actions"><div className="system-status"><i/>All systems operational</div><button className="icon-button"><CircleHelp size={18}/></button><div className="top-avatar">MK</div></div></header>
      <div className="content">
        <section className="page-heading"><div><p className="eyebrow">THURSDAY · 16 OCT 2026</p><h1>Good evening, Max.</h1><p className="subhead">Here’s the current pulse across your bot infrastructure.</p></div><div className="heading-actions"><button className="button secondary-button" onClick={() => notify('Health checks queued for all online servers')}><RefreshCw size={16}/> Run health check</button><button className="button primary-button" onClick={() => setShowDeploy(true)}><Plus size={17}/> Deploy bot</button></div></section>
        <section className="metric-strip"><Metric label="SERVERS ONLINE" value={`${onlineServers}/${servers.length}`} detail="1 needs attention" icon={Server} tone="mint"/><Metric label="CONNECTED BOTS" value={`${connectedBots}/${bots.length}`} detail="2 sessions active today" icon={Bot} tone="blue"/><Metric label="MESSAGES TODAY" value="18,492" detail="+12.8% vs yesterday" icon={Activity} tone="purple"/><Metric label="AVG. UPTIME" value="99.94%" detail="Across all deployments" icon={Zap} tone="amber"/></section>
        <section className="section-header"><div><h2>Infrastructure</h2><p>Hosts available for bot deployment and operations.</p></div><button className="text-button" onClick={() => setShowAdd(true)}><Plus size={15}/> Add server</button></section>
        <section className="server-grid">{servers.map(server => <ServerCard key={server.id} server={server} onClick={() => { setSelectedServer(server.id); setActiveNav('Servers'); }} onDeploy={() => { setSelectedServer(server.id); setShowDeploy(true); }} />)}</section>
        <section className="work-grid">
          <div className="panel bots-panel"><div className="panel-heading"><div><h2>Bot deployments</h2><p>Manage instances across every server.</p></div><button className="icon-button"><SlidersHorizontal size={17}/></button></div><div className="toolbar"><div className="search"><Search size={16}/><input placeholder="Search bots or numbers" value={query} onChange={event => setQuery(event.target.value)}/></div><select value={selectedServer} onChange={event => setSelectedServer(event.target.value)}><option value="all">All servers</option>{servers.map(server => <option key={server.id} value={server.id}>{server.name}</option>)}</select></div><div className="bot-table"><div className="table-head"><span>BOT INSTANCE</span><span>SERVER</span><span>STATUS</span><span>LAST ACTIVITY</span><span/></div>{visibleBots.map(bot => <div className={`bot-row ${activeBot?.id === bot.id ? 'selected' : ''}`} key={bot.id} onClick={() => setSelectedBot(bot.id)}><div className="bot-identity"><div className={`bot-icon ${bot.color}`}><Bot size={16}/></div><div><strong>{bot.name}</strong><span>{bot.number}</span></div></div><div className="server-name"><span className={`tiny-status ${servers.find(s => s.id === bot.server)?.status === 'Online' ? 'online' : 'offline'}`}/>{servers.find(s => s.id === bot.server)?.name || bot.server}</div><div><StatusPill state={bot.state}/></div><span className="last-activity">{bot.last}</span><button className="row-more" onClick={event => { event.stopPropagation(); toggleBot(bot); }}>{bot.state === 'Stopped' ? <Zap size={15}/> : <MoreHorizontal size={17}/>}</button></div>)}</div></div>
          <aside className="panel detail-panel"><div className="detail-top"><div><span className="label">SELECTED BOT</span><h2>{activeBot?.name}</h2><p>{activeBot?.number}</p></div><button className="icon-button"><MoreHorizontal size={18}/></button></div><div className="connection-card"><div className="connection-header"><span>SESSION CONNECTION</span><StatusPill state={activeBot?.state}/></div>{activeBot?.state === 'Connected' ? <div className="connected-state"><div className="pulse-ring"><Check size={22}/></div><strong>Session is healthy</strong><span>Connected for {activeBot?.uptime}</span></div> : activeBot?.state === 'Reconnecting' ? <div className="reconnecting"><RefreshCw size={23}/><strong>Reconnecting…</strong><span>Last seen {activeBot?.last}</span><button className="link-button" onClick={() => notify('Reconnect command sent')}>Retry now</button></div> : <div className="qr-state"><div className="qr-code"><QrCode size={70}/></div><div><strong>Scan to connect</strong><span>Open WhatsApp → Linked devices</span><button className="link-button" onClick={() => notify('New QR code generated')}>Generate new QR</button></div></div>}</div><div className="detail-actions"><button className="button secondary-button" onClick={() => toggleBot(activeBot)}>{activeBot?.state === 'Stopped' ? <><Zap size={15}/> Start bot</> : <><TerminalSquare size={15}/> Restart bot</>}</button><button className="button primary-button" onClick={() => notify('Opening live logs…')}><Activity size={15}/> View logs</button></div><div className="mini-metrics"><MiniMetric label="MESSAGES" value="4,291"/><MiniMetric label="RESP. TIME" value="184ms"/><MiniMetric label="HEALTH" value={activeBot?.health || '—'}/></div></aside>
        </section>
        <section className="bottom-grid"><div className="panel resource-panel"><div className="panel-heading"><div><h2>Resource health</h2><p>Aggregated across online servers.</p></div><button className="period">Last 24h <ChevronDown size={14}/></button></div><div className="resource-content"><div className="bars">{[42,51,45,68,54,62,47,73,61,58,70,64,81,69,72,56,63,76,68,74,67,80,71,65].map((height, index) => <div key={index} className="bar-wrap"><div className={`bar ${height > 75 ? 'hot' : ''}`} style={{height: `${height}%`}}/></div>)}</div><div className="resource-legend"><Legend icon={Cpu} label="CPU" value="38%"/><Legend icon={Database} label="MEMORY" value="61%"/><Legend icon={HardDrive} label="STORAGE" value="44%"/></div></div></div><div className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest control-plane events.</p></div><button className="text-button" onClick={() => setActiveNav('Activity logs')}>View all <ArrowUpRight size={14}/></button></div><div className="activity-list">{logs.slice(0, 5).map(([type, text, time, tone]) => <div className="activity-item" key={text}><div className={`activity-dot ${tone}`}/><div><strong>{text}</strong><span>{type} · {time}</span></div></div>)}</div></div></section>
      </div>
    </main>
    {showAdd && <Modal title="Register a server" onClose={() => setShowAdd(false)}><form className="modal-form" onSubmit={addServer}><label>Server name<input name="name" placeholder="e.g. Paris Edge" required/></label><label>Public hostname or IP<input name="host" placeholder="server.example.com" required/></label><label>Location<input name="location" placeholder="e.g. Paris, FR"/></label><div className="notice"><ShieldCheck size={16}/> The agent token is generated after registration and never shown again.</div><div className="modal-actions"><button type="button" className="button secondary-button" onClick={() => setShowAdd(false)}>Cancel</button><button className="button primary-button"><Plus size={16}/> Register server</button></div></form></Modal>}
    {showDeploy && <Modal title="Deploy a bot" onClose={() => setShowDeploy(false)}><form className="modal-form" onSubmit={event => { event.preventDefault(); setShowDeploy(false); notify('Deployment queued — follow progress in Deploy queue'); }}><label>Bot name<input placeholder="e.g. Customer Care" required/></label><label>Target server<select defaultValue={selectedServer === 'all' ? servers[0].id : selectedServer}>{servers.map(server => <option key={server.id} value={server.id}>{server.name} · {server.host}</option>)}</select></label><label>Runtime adapter<select defaultValue="baileys"><option value="baileys">Baileys adapter</option><option value="waha">WAHA adapter</option><option value="custom">Custom API adapter</option></select></label><label>Environment profile<select defaultValue="production"><option>Production</option><option>Staging</option><option>Development</option></select></label><div className="deploy-steps"><span><i>1</i> Validate server</span><span><i>2</i> Pull runtime image</span><span><i>3</i> Start and pair session</span></div><div className="modal-actions"><button type="button" className="button secondary-button" onClick={() => setShowDeploy(false)}>Cancel</button><button className="button primary-button"><Rocket size={16}/> Queue deployment</button></div></form></Modal>}
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
  </div>;
}

function Metric({label, value, detail, icon: Icon, tone}) { return <div className="metric"><div className={`metric-icon ${tone}`}><Icon size={18}/></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }
function ServerCard({server, onClick, onDeploy}) { return <div className="server-card" onClick={onClick}><div className="server-card-top"><div className={`server-icon ${server.accent}`}><Server size={18}/></div><div className="server-title"><strong>{server.name}</strong><span>{server.host}</span></div><button className="card-more" onClick={event => { event.stopPropagation(); onDeploy(); }}><Rocket size={15}/></button></div><div className="server-status"><span className={`status-dot ${server.status.toLowerCase()}`}/>{server.status}<span className="server-location">{server.location}</span></div><div className="resource-lines"><ResourceLine label="CPU" value={server.cpu} color={server.cpu > 65 ? 'amber' : 'mint'}/><ResourceLine label="MEM" value={server.memory} color={server.memory > 75 ? 'amber' : 'blue'}/><ResourceLine label="SSD" value={server.storage} color="purple"/></div><div className="server-footer"><span><Bot size={13}/> {server.bots} bots</span><span><Wifi size={13}/> {server.uptime}</span><span>{server.version}</span></div></div>; }
function ResourceLine({label, value, color}) { return <div className="resource-line"><span>{label}</span><div className="line-track"><i className={color} style={{width: `${value}%`}}/></div><b>{value}%</b></div>; }
function StatusPill({state}) { return <span className={`status-pill ${state?.toLowerCase().replace(' ', '-')}`}><i/>{state}</span>; }
function MiniMetric({label,value}) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function Legend({icon: Icon,label,value}) { return <div><Icon size={15}/><span>{label}</span><strong>{value}</strong></div>; }
function Modal({title,onClose,children}) { return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="modal"><div className="modal-heading"><div><span className="eyebrow">TDF BOTOPS</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose}><X size={18}/></button></div>{children}</div></div>; }

createRoot(document.getElementById('root')).render(<App />);
