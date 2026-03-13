/* ─── NAVIGATION ─── */
function showPage(id) {
  ['landing-page','login-page','register-page','calendar-page'].forEach(p => {
    const el = document.getElementById(p);
    if (el) el.style.display = 'none';
  });
  const t = document.getElementById(id);
  if (t) { t.style.display = 'block'; window.scrollTo(0,0); }
  if (id === 'calendar-page') initCalendar();
}

let navOpen = false;
function toggleNav() {
  navOpen = !navOpen;
  document.getElementById('nav-drawer').classList.toggle('open', navOpen);
  document.getElementById('nav-toggle').textContent = navOpen ? '✕' : '☰';
}
function closeNav() {
  navOpen = false;
  document.getElementById('nav-drawer').classList.remove('open');
  document.getElementById('nav-toggle').textContent = '☰';
}
// Close nav when clicking outside
document.addEventListener('click', e => {
  if (navOpen && !e.target.closest('.nav') && !e.target.closest('.nav-drawer'))
    closeNav();
});

/* ─── AUTH ─── */
function togglePwd(id) {
  const i = document.getElementById(id);
  i.type = i.type === 'password' ? 'text' : 'password';
}

function goToCalendar() { showPage('calendar-page'); }

function registerAndGo() {
  const cb = document.getElementById('terms-cb');
  if (cb && !cb.checked) { cb.style.outline = '2px solid #EF4444'; return; }
  showPage('calendar-page');
}

// Password strength meter
const regPwd = document.getElementById('reg-pwd');
if (regPwd) {
  regPwd.addEventListener('input', () => {
    const v = regPwd.value;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    document.querySelectorAll('.strength-bar').forEach((b,i) => {
      b.className = 'strength-bar' + (i < s ? ` s${s}` : '');
    });
  });
}

/* ─── CALENDAR STATE ─── */
const HOUR_H = 64;
const DAYS_PT = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const TODAY = new Date(2026,2,5);

const COLORS = {
  purple:{ bg:'rgba(124,58,237,.22)', border:'#7C3AED', text:'#c4b5fd' },
  blue:  { bg:'rgba(59,130,246,.22)',  border:'#3B82F6', text:'#93c5fd' },
  green: { bg:'rgba(16,185,129,.22)',  border:'#10B981', text:'#6ee7b7' },
  rose:  { bg:'rgba(244,63,94,.22)',   border:'#F43F5E', text:'#fda4af' },
  amber: { bg:'rgba(245,158,11,.22)',  border:'#F59E0B', text:'#fcd34d' },
};

let state = {
  currentDate: new Date(2026,2,5),
  miniCalDate: new Date(2026,2,1),
  currentView: 'calendar',
  events: [
    {id:1,title:'Focus Time',      date:new Date(2026,2,3), startHour:14,endHour:15, color:'blue',   calendar:'Pessoal'},
    {id:2,title:'Daily Standup',   date:new Date(2026,2,5), startHour:9, endHour:10, color:'purple', calendar:'Equipe'},
    {id:3,title:'Sprint Review',   date:new Date(2026,2,6), startHour:15,endHour:17, color:'green',  calendar:'Projeto X'},
    {id:4,title:'Code Review',     date:new Date(2026,2,4), startHour:11,endHour:12, color:'amber',  calendar:'Projeto X'},
    {id:5,title:'Reunião de Equipe',date:new Date(2026,2,2),startHour:10,endHour:11, color:'rose',   calendar:'Equipe'},
  ],
  nextEventId: 6,
  teams: [
    {
      id:1, name:'Time de Desenvolvimento', desc:'Responsável pelo produto principal', color:'#7C3AED',
      members:[
        {name:'Ana Souza',   email:'ana@empresa.com.br',    role:'admin',  status:'online'},
        {name:'Bruno Lima',  email:'bruno@empresa.com.br',  role:'membro', status:'online'},
        {name:'Carla Mendes',email:'carla@empresa.com.br',  role:'membro', status:'away'},
        {name:'Diego Costa', email:'diego@empresa.com.br',  role:'viewer', status:'offline'},
      ]
    },
    {
      id:2, name:'Design & UX', desc:'Cuida da experiência e interface do produto', color:'#F43F5E',
      members:[
        {name:'Elena Ferreira',email:'elena@empresa.com.br', role:'admin',  status:'online'},
        {name:'Fábio Rocha',   email:'fabio@empresa.com.br', role:'membro', status:'offline'},
      ]
    },
    {
      id:3, name:'Marketing & Growth', desc:'Aquisição e retenção de clientes', color:'#10B981',
      members:[
        {name:'Gabriela Nunes',email:'gabi@empresa.com.br',  role:'admin',  status:'away'},
        {name:'Henrique Dias', email:'henri@empresa.com.br', role:'membro', status:'online'},
        {name:'Isabela Melo',  email:'isa@empresa.com.br',   role:'membro', status:'offline'},
      ]
    },
  ],
  nextTeamId: 4,
  selectedTeamColor: '#7C3AED',
};

function isSameDay(a,b){ return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function getWeekStart(d){ const r=new Date(d); r.setDate(r.getDate()-r.getDay()); r.setHours(0,0,0,0); return r; }
function fmtDate(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function initials(name){ return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
function hslFromStr(str){ let h=0; for(let c of str) h=(h*31+c.charCodeAt(0))%360; return `hsl(${h},55%,48%)`; }

/* ─── INIT ─── */
let calInited = false;
function initCalendar() {
  if (!calInited) { setupModals(); setupSidebar(); calInited = true; }
  renderMiniCal();
  renderWeekView();
  renderTeams();
  document.getElementById('teams-badge').textContent = state.teams.length;
}

/* ─── VIEW SWITCH ─── */
function switchView(view) {
  state.currentView = view;
  const calEls = [document.getElementById('cal-header-row'), document.getElementById('cal-body-scroll')];
  const teamsView = document.getElementById('teams-view');
  const snavCal = document.getElementById('snav-cal');
  const snavTeams = document.getElementById('snav-teams');

  if (view === 'calendar') {
    calEls.forEach(e => e.style.display = '');
    teamsView.classList.remove('active');
    snavCal.classList.add('active'); snavTeams.classList.remove('active');
  } else {
    calEls.forEach(e => e.style.display = 'none');
    teamsView.classList.add('active');
    snavCal.classList.remove('active'); snavTeams.classList.add('active');
    renderTeams();
  }
}

/* ─── WEEK VIEW ─── */
function renderWeekView() {
  const ws = getWeekStart(state.currentDate);
  const end = new Date(ws); end.setDate(end.getDate()+6);
  document.getElementById('cal-title').textContent =
    ws.getMonth()===end.getMonth()
      ? `${MONTHS_PT[ws.getMonth()]} ${ws.getFullYear()}`
      : `${MONTHS_PT[ws.getMonth()].slice(0,3)} – ${MONTHS_PT[end.getMonth()].slice(0,3)} ${ws.getFullYear()}`;

  const hr = document.getElementById('cal-header-row');
  hr.innerHTML = '<div class="time-gutter-header"></div>';
  for (let d=0;d<7;d++) {
    const day = new Date(ws); day.setDate(day.getDate()+d);
    const col = document.createElement('div');
    col.className = 'cal-day-col'+(isSameDay(day,TODAY)?' today':'');
    col.innerHTML = `<div class="cal-day-name">${DAYS_PT[day.getDay()]}</div><div class="cal-day-num">${day.getDate()}</div>`;
    col.addEventListener('click', () => openModal({date:day, startHour:9}));
    hr.appendChild(col);
  }

  const body = document.getElementById('cal-body');
  body.innerHTML = '';
  const gutter = document.createElement('div'); gutter.className='time-gutter';
  for (let h=0;h<24;h++) {
    const l=document.createElement('div'); l.className='time-label'; l.style.height=HOUR_H+'px';
    l.textContent = h===0?'':`${String(h).padStart(2,'0')}:00`;
    gutter.appendChild(l);
  }
  body.appendChild(gutter);

  for (let d=0;d<7;d++) {
    const day = new Date(ws); day.setDate(day.getDate()+d);
    const isToday = isSameDay(day,TODAY);
    const col = document.createElement('div');
    col.className='cal-col'+(isToday?' today-col':'');
    col.style.height=(HOUR_H*24)+'px';
    for (let h=0;h<24;h++) {
      const cell=document.createElement('div'); cell.className='hour-cell';
      cell.style.top=(h*HOUR_H)+'px'; cell.style.height=HOUR_H+'px';
      cell.addEventListener('click', e=>{ if(e.target.closest('.cal-event'))return; openModal({date:day,startHour:h}); });
      col.appendChild(cell);
    }
    state.events.filter(ev=>isSameDay(ev.date,day)).forEach(ev=>col.appendChild(makeEventEl(ev)));
    if (isToday) {
      const nl=document.createElement('div'); nl.className='now-line';
      nl.style.top=(10*HOUR_H+30/60*HOUR_H)+'px';
      const dot=document.createElement('div'); dot.className='now-dot'; nl.appendChild(dot);
      col.appendChild(nl);
    }
    body.appendChild(col);
  }
  setTimeout(()=>{ const s=document.getElementById('cal-body-scroll'); if(s)s.scrollTop=HOUR_H*7.5; },50);
}

function makeEventEl(ev) {
  const c = COLORS[ev.color]||COLORS.purple;
  const dur = ev.endHour-ev.startHour;
  const el = document.createElement('div');
  el.className='cal-event'; el.dataset.id=ev.id;
  el.style.cssText=`top:${ev.startHour*HOUR_H+2}px;height:${dur*HOUR_H-4}px;background:${c.bg};border-left-color:${c.border};color:${c.text};`;
  el.innerHTML=`<div class="cal-event-time">${String(ev.startHour).padStart(2,'0')}:00 – ${String(ev.endHour).padStart(2,'0')}:00</div><div class="cal-event-title">${ev.title}</div><button class="cal-event-delete" onclick="deleteEvent(${ev.id},event)">✕</button>`;
  el.addEventListener('click',e=>{ if(e.target.closest('.cal-event-delete'))return; openModal({editId:ev.id}); });
  return el;
}

function deleteEvent(id,e) { e.stopPropagation(); state.events=state.events.filter(ev=>ev.id!==id); renderWeekView(); }

/* ─── MINI CALENDAR ─── */
function renderMiniCal() {
  const y=state.miniCalDate.getFullYear(), m=state.miniCalDate.getMonth();
  document.getElementById('mini-cal-title').textContent=`${MONTHS_PT[m]} ${y}`;
  const grid=document.getElementById('mini-cal-grid');
  const hdrs=Array.from(grid.querySelectorAll('.day-header'));
  grid.innerHTML=''; hdrs.forEach(h=>grid.appendChild(h));
  const fd=new Date(y,m,1).getDay(), dim=new Date(y,m+1,0).getDate(), pd=new Date(y,m,0).getDate();
  for(let i=fd-1;i>=0;i--){const d=document.createElement('div');d.className='day-num other-month';d.textContent=pd-i;grid.appendChild(d);}
  for(let i=1;i<=dim;i++){
    const d=document.createElement('div'), dt=new Date(y,m,i);
    const cl=['day-num'];
    if(isSameDay(dt,TODAY))cl.push('today');
    if(isSameDay(dt,state.currentDate))cl.push('selected');
    d.className=cl.join(' '); d.textContent=i;
    d.addEventListener('click',()=>{state.currentDate=new Date(y,m,i);renderWeekView();renderMiniCal();});
    grid.appendChild(d);
  }
  const rem=(fd+dim)%7===0?0:7-(fd+dim)%7;
  for(let i=1;i<=rem;i++){const d=document.createElement('div');d.className='day-num other-month';d.textContent=i;grid.appendChild(d);}
}
function miniCalPrev(){state.miniCalDate.setMonth(state.miniCalDate.getMonth()-1);renderMiniCal();}
function miniCalNext(){state.miniCalDate.setMonth(state.miniCalDate.getMonth()+1);renderMiniCal();}
function navPrev(){state.currentDate.setDate(state.currentDate.getDate()-7);renderWeekView();renderMiniCal();}
function navNext(){state.currentDate.setDate(state.currentDate.getDate()+7);renderWeekView();renderMiniCal();}
function navToday(){state.currentDate=new Date(2026,2,5);state.miniCalDate=new Date(2026,2,1);renderWeekView();renderMiniCal();}

/* ─── TEAMS ─── */
function renderTeams() {
  const container = document.getElementById('teams-scroll');
  if (!container) return;
  document.getElementById('teams-badge').textContent = state.teams.length;

  if (state.teams.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--dark-muted)">
      <div style="font-size:40px;margin-bottom:12px">👥</div>
      <div style="font-size:15px;font-weight:600;color:var(--dark-text);margin-bottom:8px">Nenhuma equipe ainda</div>
      <div style="font-size:13px">Clique em "Nova equipe" para começar.</div>
    </div>`;
    return;
  }

  container.innerHTML = '';
  state.teams.forEach(team => {
    const card = document.createElement('div');
    card.className = 'team-card';
    const statusMap = { online:'status-online', away:'status-away', offline:'status-offline' };
    const roleMap = { admin:'role-admin', membro:'role-membro', viewer:'role-viewer' };
    const roleLabel = { admin:'Admin', membro:'Membro', viewer:'Visualizador' };

    const membersHTML = team.members.map((m,idx)=>`
      <div class="member-row">
        <div class="member-status ${statusMap[m.status]||'status-offline'}"></div>
        <div class="member-avatar" style="background:${hslFromStr(m.name)}">${initials(m.name)}</div>
        <div class="member-info">
          <div class="member-name">${m.name}</div>
          <div class="member-email">${m.email}</div>
        </div>
        <span class="member-role ${roleMap[m.role]||'role-membro'}">${roleLabel[m.role]||m.role}</span>
        <div class="member-actions">
          <button class="btn-icon" title="Editar" onclick="editMember(${team.id},${idx})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="btn-icon danger" title="Remover" onclick="removeMember(${team.id},${idx})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>
        </div>
      </div>
    `).join('');

    const onlineCount = team.members.filter(m=>m.status==='online').length;

   card.innerHTML = `
  <div class="team-card-header">
    <div class="team-card-left">
      <div class="team-avatar" style="background:${team.color}">${team.name.slice(0,2).toUpperCase()}</div>
      <div>
        <div class="team-name">${team.name}</div>
        <div class="team-meta">${team.members.length} membro${team.members.length!==1?'s':''} · <span style="color:#10B981">● ${onlineCount} online</span></div>
      </div>
    </div>
    <div class="team-card-right">
      <div class="team-actions">
        <button class="btn-icon" title="Editar equipe" onclick="openTeamModal(${team.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="btn-icon danger" title="Excluir equipe" onclick="deleteTeam(${team.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
      </div>
    </div>
  </div>
  <button class="team-add-member" onclick="openMemberModal(${team.id})">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    Adicionar membro
  </button>
  <div class="team-members">${membersHTML}</div>
`;
    container.appendChild(card);
  });
}

/* ─── TEAM CRUD ─── */
function openTeamModal(id) {
  const editId = id || null;
  document.getElementById('team-edit-id').value = editId || '';
  if (editId) {
    const team = state.teams.find(t=>t.id===editId);
    if (!team) return;
    document.getElementById('team-modal-heading').textContent = 'Editar Equipe';
    document.getElementById('team-name').value = team.name;
    document.getElementById('team-desc').value = team.desc;
    state.selectedTeamColor = team.color;
  } else {
    document.getElementById('team-modal-heading').textContent = 'Nova Equipe';
    document.getElementById('team-name').value = '';
    document.getElementById('team-desc').value = '';
    state.selectedTeamColor = '#7C3AED';
  }
  document.querySelectorAll('.color-opt').forEach(el=>{
    el.classList.toggle('selected', el.dataset.color===state.selectedTeamColor);
  });
  openOverlay('team-modal-overlay');
  setTimeout(()=>document.getElementById('team-name').focus(),50);
}

function selectTeamColor(el) {
  document.querySelectorAll('.color-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedTeamColor = el.dataset.color;
}

function saveTeam() {
  const name = document.getElementById('team-name').value.trim();
  if (!name) { document.getElementById('team-name').classList.add('error'); return; }
  document.getElementById('team-name').classList.remove('error');
  const desc = document.getElementById('team-desc').value.trim();
  const editId = parseInt(document.getElementById('team-edit-id').value) || null;
  if (editId) {
    const t = state.teams.find(t=>t.id===editId);
    if (t) { t.name=name; t.desc=desc; t.color=state.selectedTeamColor; }
  } else {
    state.teams.push({ id:state.nextTeamId++, name, desc, color:state.selectedTeamColor, members:[] });
  }
  closeModal('team-modal-overlay');
  renderTeams();
}

function deleteTeam(id) {
  if (!confirm('Tem certeza que deseja excluir esta equipe?')) return;
  state.teams = state.teams.filter(t=>t.id!==id);
  renderTeams();
}

/* ─── MEMBER CRUD ─── */
function openMemberModal(teamId, editIdx) {
  document.getElementById('member-team-id').value = teamId;
  document.getElementById('member-edit-idx').value = editIdx !== undefined ? editIdx : '';
  if (editIdx !== undefined) {
    const team = state.teams.find(t=>t.id===teamId);
    const m = team.members[editIdx];
    document.getElementById('member-modal-heading').textContent = 'Editar Membro';
    document.getElementById('member-name').value = m.name;
    document.getElementById('member-email').value = m.email;
    document.getElementById('member-role').value = m.role;
    document.querySelector('#member-modal-overlay .modal-confirm-btn').textContent = 'Salvar';
  } else {
    document.getElementById('member-modal-heading').textContent = 'Adicionar Membro';
    document.getElementById('member-name').value = '';
    document.getElementById('member-email').value = '';
    document.getElementById('member-role').value = 'membro';
    document.querySelector('#member-modal-overlay .modal-confirm-btn').textContent = 'Adicionar';
  }
  openOverlay('member-modal-overlay');
  setTimeout(()=>document.getElementById('member-name').focus(),50);
}

function editMember(teamId, idx) { openMemberModal(teamId, idx); }

function saveMember() {
  const name = document.getElementById('member-name').value.trim();
  const email = document.getElementById('member-email').value.trim();
  if (!name) { document.getElementById('member-name').classList.add('error'); return; }
  document.getElementById('member-name').classList.remove('error');
  const teamId = parseInt(document.getElementById('member-team-id').value);
  const editIdx = document.getElementById('member-edit-idx').value;
  const team = state.teams.find(t=>t.id===teamId);
  if (!team) return;
  const member = { name, email, role: document.getElementById('member-role').value, status: 'offline' };
  if (editIdx !== '') {
    team.members[parseInt(editIdx)] = { ...team.members[parseInt(editIdx)], ...member };
  } else {
    team.members.push(member);
  }
  closeModal('member-modal-overlay');
  renderTeams();
}

function removeMember(teamId, idx) {
  const team = state.teams.find(t=>t.id===teamId);
  if (!team) return;
  if (!confirm(`Remover ${team.members[idx].name} da equipe?`)) return;
  team.members.splice(idx,1);
  renderTeams();
}

/* ─── EVENT MODAL ─── */
function setupModals() {
  ['modal-overlay','team-modal-overlay','member-modal-overlay'].forEach(id=>{
    document.getElementById(id).addEventListener('click', e=>{
      if(e.target.id===id) closeModal(id);
    });
  });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') ['modal-overlay','team-modal-overlay','member-modal-overlay'].forEach(closeModal); });

  const saveBtn = document.getElementById('modal-save');
  const delBtn = document.getElementById('modal-delete');
  saveBtn.onclick = saveEventDefault;
}

function openOverlay(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

let currentEventSaveFn = null;

function openModal(opts={}) {
  const ti=document.getElementById('modal-title');
  const di=document.getElementById('modal-date');
  const si=document.getElementById('modal-start');
  const ei=document.getElementById('modal-end');
  const ci=document.getElementById('modal-color');
  const cali=document.getElementById('modal-calendar');
  const delBtn=document.getElementById('modal-delete');
  const saveBtn=document.getElementById('modal-save');

  if (opts.editId) {
    const ev=state.events.find(e=>e.id===opts.editId); if(!ev)return;
    document.getElementById('modal-heading').textContent='Editar Evento';
    ti.value=ev.title; di.value=fmtDate(ev.date);
    si.value=ev.startHour; ei.value=ev.endHour;
    ci.value=ev.color; cali.value=ev.calendar;
    delBtn.style.display='flex';
    saveBtn.onclick=()=>saveEditEvent(opts.editId);
    delBtn.onclick=()=>{ deleteEvent(opts.editId,{stopPropagation:()=>{}}); closeModal('modal-overlay'); };
  } else {
    document.getElementById('modal-heading').textContent='Novo Evento';
    ti.value=''; di.value=opts.date?fmtDate(opts.date):fmtDate(TODAY);
    si.value=opts.startHour??9; ei.value=(opts.startHour??9)+1;
    ci.value='purple'; cali.value='Pessoal';
    delBtn.style.display='none';
    saveBtn.onclick=saveNewEvent;
  }
  openOverlay('modal-overlay');
  setTimeout(()=>ti.focus(),50);
}

function saveEventDefault() { saveNewEvent(); }

function saveNewEvent() {
  const title=document.getElementById('modal-title').value.trim();
  if(!title){document.getElementById('modal-title').classList.add('error');return;}
  document.getElementById('modal-title').classList.remove('error');
  const [y,m,d]=document.getElementById('modal-date').value.split('-').map(Number);
  const sh=parseInt(document.getElementById('modal-start').value);
  const eh=parseInt(document.getElementById('modal-end').value);
  if(eh<=sh){document.getElementById('modal-end').classList.add('error');return;}
  document.getElementById('modal-end').classList.remove('error');
  state.events.push({id:state.nextEventId++,title,date:new Date(y,m-1,d),startHour:sh,endHour:eh,color:document.getElementById('modal-color').value,calendar:document.getElementById('modal-calendar').value});
  closeModal('modal-overlay'); renderWeekView();
}

function saveEditEvent(id) {
  const title=document.getElementById('modal-title').value.trim(); if(!title)return;
  const [y,m,d]=document.getElementById('modal-date').value.split('-').map(Number);
  const sh=parseInt(document.getElementById('modal-start').value);
  const eh=parseInt(document.getElementById('modal-end').value); if(eh<=sh)return;
  const ev=state.events.find(e=>e.id===id);
  if(ev){ev.title=title;ev.date=new Date(y,m-1,d);ev.startHour=sh;ev.endHour=eh;ev.color=document.getElementById('modal-color').value;ev.calendar=document.getElementById('modal-calendar').value;}
  closeModal('modal-overlay'); renderWeekView();
}

/* ─── SIDEBAR ─── */
function setupSidebar() {
  const btn=document.getElementById('sidebar-toggle');
  const sb=document.getElementById('cal-sidebar');
  const ov=document.getElementById('sidebar-overlay');
  if(btn) btn.addEventListener('click',()=>{sb.classList.toggle('open');ov.classList.toggle('open');});
  if(ov) ov.addEventListener('click',()=>{sb.classList.remove('open');ov.classList.remove('open');});
}