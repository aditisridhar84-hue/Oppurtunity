// js/app.js
// =============================================
// OPPORTUNIQ — MAIN APPLICATION LOGIC
// =============================================

// ── State ─────────────────────────────────────
var state = {
  user: null,
  opportunities: [],
  applications: [],
  curFilter: 'all',
  curSort: 'match',
  curView: 'grid',
  curTrackerTab: 'all',
  modalOpp: null,
  searchTimer: null,
  appliedIds: new Set(),
  charts: {}
};

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Set today's date
  var now = new Date();
  var dateStr = now.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  var els = document.querySelectorAll('#today-date,#topbar-date');
  els.forEach(function(el) { el.textContent = (el.id === 'topbar-date' ? '📅 ' : '') + dateStr; });

  // Check auth
  if (Auth.isLoggedIn()) {
    verifyAndLaunch();
  } else {
    showScreen('login');
  }
});

async function verifyAndLaunch() {
  try {
    var res = await AuthAPI.me();
    state.user = res.user;
    Auth.setUser(res.user);
    launchApp();
  } catch(e) {
    Auth.removeToken();
    Auth.removeUser();
    showScreen('login');
  }
}

// ── Screen switching ──────────────────────────
function showScreen(name) {
  document.querySelectorAll('.auth-screen').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById('main-app').classList.remove('active');
  if (name === 'app') {
    document.getElementById('main-app').classList.add('active');
  } else {
    var el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
  }
}

// ── Auth handlers ─────────────────────────────
async function handleLogin() {
  var email = document.getElementById('login-email').value.trim();
  var pass  = document.getElementById('login-pass').value;
  var errEl = document.getElementById('login-error');
  var btn   = document.getElementById('login-btn');

  errEl.classList.remove('show');
  if (!email || !pass) { showError(errEl, 'Please enter email and password.'); return; }

  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    var res = await AuthAPI.login(email, pass);
    Auth.setToken(res.token);
    Auth.setUser(res.user);
    state.user = res.user;
    launchApp();
  } catch(e) {
    showError(errEl, e.message);
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

// Allow Enter key on login
document.getElementById('login-pass').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') handleLogin();
});
document.getElementById('login-email').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') handleLogin();
});

// Signup skills input
var signupSkills = [];
document.getElementById('su-skill-inp').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    var val = this.value.trim().replace(/,$/, '');
    if (val && !signupSkills.includes(val)) {
      signupSkills.push(val);
      renderSignupSkills();
    }
    this.value = '';
  }
});

function renderSignupSkills() {
  var box = document.getElementById('su-skills-box');
  var inp = document.getElementById('su-skill-inp');
  // Remove old chips
  box.querySelectorAll('.skill-chip').forEach(function(c) { c.remove(); });
  signupSkills.forEach(function(s, i) {
    var chip = document.createElement('span');
    chip.className = 'skill-chip';
    chip.textContent = s + ' ✕';
    chip.title = 'Click to remove';
    chip.onclick = function() { signupSkills.splice(i, 1); renderSignupSkills(); };
    box.insertBefore(chip, inp);
  });
}

async function handleSignup() {
  var name   = document.getElementById('su-name').value.trim();
  var email  = document.getElementById('su-email').value.trim();
  var branch = document.getElementById('su-branch').value;
  var year   = document.getElementById('su-year').value;
  var cgpa   = parseFloat(document.getElementById('su-cgpa').value) || 0;
  var pass   = document.getElementById('su-pass').value;
  var errEl  = document.getElementById('signup-error');
  var sucEl  = document.getElementById('signup-success');
  var btn    = document.getElementById('signup-btn');

  errEl.classList.remove('show');
  sucEl.classList.remove('show');

  if (!name || !email || !branch || !year || !pass) {
    showError(errEl, 'Please fill in all required fields.');
    return;
  }
  if (pass.length < 6) { showError(errEl, 'Password must be at least 6 characters.'); return; }

  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    var res = await AuthAPI.signup({ name, email, password: pass, branch, year, cgpa, skills: signupSkills });
    Auth.setToken(res.token);
    Auth.setUser(res.user);
    state.user = res.user;
    sucEl.textContent = 'Account created! Launching your portal...';
    sucEl.classList.add('show');
    setTimeout(launchApp, 800);
  } catch(e) {
    showError(errEl, e.message);
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

function handleLogout() {
  Auth.removeToken();
  Auth.removeUser();
  state.user = null;
  state.applications = [];
  state.appliedIds = new Set();
  // Destroy charts
  Object.values(state.charts).forEach(function(c) { if (c) c.destroy(); });
  state.charts = {};
  showScreen('login');
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').classList.remove('show');
}

function showError(el, msg) { el.textContent = msg; el.classList.add('show'); }

// ── App launch ────────────────────────────────
function launchApp() {
  showScreen('app');
  updateSidebarUser();

  // Show admin nav if admin
  if (state.user && state.user.role === 'admin') {
    document.getElementById('admin-nav-section').style.display = '';
    document.getElementById('nav-admin').style.display = '';
    document.getElementById('nav-analytics').style.display = '';
  }

  // Load dashboard data
  loadDashboard();
}

// ── Sidebar user ──────────────────────────────
function updateSidebarUser() {
  var u = state.user;
  if (!u) return;
  var initials = u.name.split(' ').filter(Boolean).map(function(w) { return w[0].toUpperCase(); }).slice(0,2).join('');
  document.getElementById('sb-av').textContent = initials;
  document.getElementById('sb-name').textContent = u.name;
  document.getElementById('sb-role').textContent = (u.branch || '') + (u.year ? ' · ' + u.year : '');
  document.getElementById('hero-name').textContent = u.name.split(' ')[0];
}

// ── Navigation ────────────────────────────────
function goTo(page, el) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var pg = document.getElementById('page-' + page);
  if (pg) pg.classList.add('active');
  if (el) el.classList.add('active');
  var titles = {
    dashboard:'Dashboard', opportunities:'Browse Opportunities',
    tracker:'Application Tracker', alerts:'Smart Alerts',
    profile:'My Profile', admin:'Admin Panel', analytics:'Analytics'
  };
  document.getElementById('pg-title').textContent = titles[page] || page;
  closeSidebar();

  // Load page data on first visit
  if (page === 'opportunities') fetchOpportunities();
  if (page === 'tracker')       loadTracker();
  if (page === 'alerts')        loadAlerts();
  if (page === 'profile')       loadProfile();
  if (page === 'admin')         loadAdmin();
  if (page === 'analytics')     loadAnalytics();
}

// ── Sidebar mobile toggle ─────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

// ── View toggle ───────────────────────────────
function setView(v) {
  state.curView = v;
  document.getElementById('vg').classList.toggle('active', v === 'grid');
  document.getElementById('vl').classList.toggle('active', v === 'list');
  var g = document.getElementById('opp-grid');
  if (g) { if (v === 'list') g.classList.add('lv'); else g.classList.remove('lv'); }
}

// ── Toast ─────────────────────────────────────
function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || 'success');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('show'); }, 3400);
}

// ── Opportunity card renderer ─────────────────
var TAG_CLASS = { internship:'ti', scholarship:'ts', hackathon:'th', research:'tr', competition:'tr', govt:'tg', remote:'tm' };

function makeCard(o) {
  var card = document.createElement('div');
  var isUrgent = o.urgency === 'urgent' || o.urgency === 'critical';
  card.className = 'opp-card' + (isUrgent ? ' urg' : '');

  var tagsHtml = (o.tags || []).map(function(t) {
    return '<span class="tag ' + (TAG_CLASS[t] || 'tm') + '">' + t + '</span>';
  }).join('');

  var skillsHtml = (o.skillsRequired || []).slice(0,2).map(function(s) {
    return '<span class="tag tm">' + s + '</span>';
  }).join('');

  var matchHtml = o.matchScore != null
    ? '<div class="match-bar"><div class="match-lbl"><span style="color:var(--muted)">AI Match</span><span class="match-pct">' + o.matchScore + '%</span></div><div class="bar-track"><div class="bar-fill" style="width:' + o.matchScore + '%"></div></div></div>'
    : '';

  var urgencyPill = '';
  if (o.urgency === 'critical') urgencyPill = '<div class="urgency-pill critical">🔴 Critical</div>';
  else if (o.urgency === 'urgent') urgencyPill = '<div class="urgency-pill urgent">⚡ Apply Soon</div>';
  else if (o.urgency === 'soon')   urgencyPill = '<div class="urgency-pill soon">⏰ Closing Soon</div>';

  var dlClass = o.urgency === 'critical' ? 'dl critical' : (o.urgency === 'urgent' ? 'dl soon' : 'dl');

  var isApplied = state.appliedIds.has(o._id);
  var btnHtml = isApplied
    ? '<div class="btn-applied">✓ Applied</div>'
    : '<button class="btn-v" onclick="event.stopPropagation();openModal(\'' + o._id + '\')">View</button>';

  // Deadline display
  var dlText = o.deadlineDisplay || (o.deadline ? new Date(o.deadline).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : 'TBD');

  card.innerHTML =
    urgencyPill +
    '<div class="opp-hdr">' +
    '<div class="opp-logo" style="background:' + (o.bgColor||'#1e3a8a') + '22;border:1px solid ' + (o.bgColor||'#1e3a8a') + '44">' + (o.emoji||'🎯') + '</div>' +
    '<div style="flex:1;min-width:0"><div class="opp-title">' + o.title + '</div><div class="opp-co">' + o.company + '</div></div>' +
    '</div>' +
    '<div class="opp-tags">' + tagsHtml + skillsHtml + '</div>' +
    matchHtml +
    '<div class="opp-footer"><div class="' + dlClass + '">📅 ' + dlText + '</div>' + btnHtml + '</div>';

  card.onclick = function() { openModal(o._id); };
  return card;
}

function renderGrid(id, list) {
  var g = document.getElementById(id);
  if (!g) return;
  g.innerHTML = '';
  if (!list || list.length === 0) {
    g.innerHTML = '<div class="empty-state"><div class="e-icon">🔍</div><p>No opportunities found.</p></div>';
    return;
  }
  list.forEach(function(o) { g.appendChild(makeCard(o)); });
  if (id === 'opp-grid' && state.curView === 'list') g.classList.add('lv');
}

// ── Dashboard ─────────────────────────────────
async function loadDashboard() {
  try {
    var res = await Promise.all([
      OppsAPI.getRecommended(),
      AppsAPI.getMyApps(),
      OppsAPI.getUrgent(),
      AnalyticsAPI.getMe()
    ]);

    var recommended = res[0].data || [];
    var myApps      = res[1].data || [];
    var urgent      = res[2].data || [];
    var myStats     = res[3].data || {};

    // Track applied IDs
    myApps.forEach(function(a) {
      if (a.opportunityId) state.appliedIds.add(a.opportunityId._id || a.opportunityId);
    });

    // Hero
    document.getElementById('hero-match-count').textContent = recommended.length + ' matches';
    document.getElementById('hero-sub').textContent =
      urgent.length + ' deadlines closing within 7 days. ' +
      (myStats.totalApplications || 0) + ' applications tracked.';

    // Stats
    document.getElementById('ds-matches').textContent  = recommended.length;
    document.getElementById('ds-apps').textContent     = myStats.totalApplications || 0;
    document.getElementById('ds-apps-sub').textContent = (myStats.statusBreakdown && myStats.statusBreakdown.pending || 0) + ' pending review';
    document.getElementById('ds-accepted').textContent = myStats.statusBreakdown && myStats.statusBreakdown.accepted || 0;
    document.getElementById('ds-rate').textContent     = (myStats.successRate || 0) + '%';
    document.getElementById('ds-urgent').textContent   = urgent.length;

    // Tracker badge
    if (myStats.totalApplications > 0) {
      var badge = document.getElementById('tracker-badge');
      badge.textContent = myStats.totalApplications;
      badge.style.display = '';
    }

    // Notification badge
    document.getElementById('notif-count').textContent = urgent.length;

    // Recommended cards
    renderGrid('dash-grid', recommended.slice(0, 3));

  } catch(e) {
    console.error('Dashboard error:', e);
    document.getElementById('dash-grid').innerHTML =
      '<div class="empty-state"><div class="e-icon">⚠️</div><p>' + e.message + '</p></div>';
  }
}

// ── Opportunities ─────────────────────────────
async function fetchOpportunities() {
  var grid = document.getElementById('opp-grid');
  grid.innerHTML = '<div class="loading-state"><div class="spinner"></div> Loading...</div>';

  var params = { type: state.curFilter === 'all' ? '' : state.curFilter, sort: state.curSort };
  var search = document.getElementById('s-inp') && document.getElementById('s-inp').value.trim();
  if (search) params.search = search;
  // Clean empty params
  Object.keys(params).forEach(function(k) { if (!params[k]) delete params[k]; });

  try {
    var res = await OppsAPI.getAll(params);
    state.opportunities = res.data || [];

    var banner = document.getElementById('opps-banner');
    banner.textContent = '✅ ' + res.count + ' verified live opportunities — updated ' + new Date().toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'});

    renderGrid('opp-grid', state.opportunities);
    if (state.curView === 'list') document.getElementById('opp-grid').classList.add('lv');
  } catch(e) {
    grid.innerHTML = '<div class="empty-state"><div class="e-icon">⚠️</div><p>' + e.message + '</p></div>';
  }
}

function debounceSearch() {
  clearTimeout(state.searchTimer);
  state.searchTimer = setTimeout(fetchOpportunities, 400);
}

function setFilter(f, el) {
  state.curFilter = f;
  document.querySelectorAll('.f-btn').forEach(function(b) { b.classList.remove('active'); });
  el.classList.add('active');
  fetchOpportunities();
}

function setSort(s, el) {
  state.curSort = s;
  document.querySelectorAll('.sort-btn').forEach(function(b) { b.classList.remove('active'); });
  el.classList.add('active');
  fetchOpportunities();
}

// ── Modal ─────────────────────────────────────
async function openModal(id) {
  try {
    var res = await OppsAPI.getById(id);
    var o = res.data;
    state.modalOpp = o;

    var dlText = o.deadlineDisplay || (o.deadline ? new Date(o.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : 'TBD');
    var tagsHtml = (o.tags||[]).map(function(t){ return '<span class="tag '+(TAG_CLASS[t]||'tm')+'">'+t+'</span>'; }).join('');
    var skillsHtml = (o.skillsRequired||[]).map(function(s){ return '<span class="tag tm">'+s+'</span>'; }).join('');
    var isApplied = state.appliedIds.has(o._id);

    document.getElementById('modal-body').innerHTML =
      '<div style="display:flex;align-items:flex-start;gap:13px;margin-bottom:14px">' +
      '<div class="opp-logo" style="background:'+(o.bgColor||'#1e3a8a')+'22;border:1px solid '+(o.bgColor||'#1e3a8a')+'44;width:52px;height:52px;font-size:26px;flex-shrink:0">'+(o.emoji||'🎯')+'</div>' +
      '<div><div style="font-family:Syne,sans-serif;font-size:18px;font-weight:700;line-height:1.3">'+o.title+'</div>' +
      '<div style="color:var(--muted);font-size:12px;margin-top:2px">'+o.company+'</div></div></div>' +
      '<p style="font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:13px">'+o.description+'</p>' +
      '<div class="tag-list">'+tagsHtml+skillsHtml+'</div>' +
      '<div class="i-row"><span class="i-key">Stipend / Award</span><span class="i-val" style="color:var(--accent3)">'+o.stipend+'</span></div>' +
      '<div class="i-row"><span class="i-key">Deadline</span><span class="i-val">'+dlText+'</span></div>' +
      (o.matchScore != null ? '<div class="i-row"><span class="i-key">AI Match Score</span><span class="m-badge">✓ '+o.matchScore+'% Match</span></div>' : '') +
      '<div class="i-row"><span class="i-key">Eligibility</span><span class="i-val" style="font-size:11px;color:var(--muted);text-align:right">'+(o.eligibility||'See official page')+'</span></div>' +
      '<div class="i-row"><span class="i-key">Official Source</span><a href="'+(o.applyUrl||'#')+'" target="_blank" class="url-lnk">🔗 '+( o.source||o.applyUrl||'View')+'</a></div>' +
      '<div class="v-box">Verified active. Click Apply Now to record your application and open the official source page.</div>';

    var applyBtn = document.getElementById('m-apply-btn');
    if (isApplied) {
      applyBtn.textContent = '✓ Already Applied';
      applyBtn.disabled = true;
      applyBtn.style.opacity = '0.6';
    } else {
      applyBtn.textContent = 'Apply Now →';
      applyBtn.disabled = false;
      applyBtn.style.opacity = '';
    }

    document.getElementById('modal-ov').classList.add('open');
  } catch(e) {
    showToast('Could not load opportunity: ' + e.message, 'error');
  }
}

function closeModal() { document.getElementById('modal-ov').classList.remove('open'); }
document.getElementById('modal-ov').onclick = function(e) { if (e.target === this) closeModal(); };

document.getElementById('m-apply-btn').onclick = async function() {
  if (!state.modalOpp) return;
  var btn = this;
  btn.disabled = true;
  btn.textContent = 'Applying...';

  try {
    await AppsAPI.apply(state.modalOpp._id);
    state.appliedIds.add(state.modalOpp._id);

    // Open official URL
    if (state.modalOpp.applyUrl && state.modalOpp.applyUrl !== '#') {
      window.open(state.modalOpp.applyUrl, '_blank');
    }

    btn.textContent = '✓ Applied!';
    showToast('Application submitted and tracked!', 'success');

    // Refresh tracker badge
    var badge = document.getElementById('tracker-badge');
    badge.textContent = parseInt(badge.textContent || 0) + 1;
    badge.style.display = '';

    setTimeout(closeModal, 1200);
  } catch(e) {
    showToast(e.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Apply Now →';
  }
};

// ── Tracker ───────────────────────────────────
async function loadTracker() {
  var list = document.getElementById('t-list');
  list.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

  try {
    var res = await AppsAPI.getMyApps();
    state.applications = res.data || [];
    renderTrackerList(state.applications);

    // Update summary
    var total = state.applications.length;
    var accepted = state.applications.filter(function(a) { return a.status === 'accepted'; }).length;
    var rate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    document.getElementById('tracker-summary').textContent =
      total + ' application' + (total !== 1 ? 's' : '') + ' tracked';
    document.getElementById('tracker-hint').textContent =
      rate + '% success rate · ' + accepted + ' accepted';
    document.getElementById('profile-pct').textContent = rate + '%';

  } catch(e) {
    list.innerHTML = '<div class="empty-state"><div class="e-icon">⚠️</div><p>' + e.message + '</p></div>';
  }
}

function renderTrackerList(apps) {
  var list = document.getElementById('t-list');
  list.innerHTML = '';

  if (!apps.length) {
    list.innerHTML = '<div class="empty-state"><div class="e-icon">📋</div><p>No applications yet. Start applying!</p></div>';
    return;
  }

  apps.forEach(function(a) {
    var opp = a.opportunityId || {};
    var item = document.createElement('div');
    item.className = 't-item';
    var date = new Date(a.appliedAt).toLocaleDateString('en-IN', {day:'numeric',month:'short'});
    item.innerHTML =
      '<div class="s-dot ' + a.status + '"></div>' +
      '<div class="t-info">' +
        '<div class="t-title">' + (opp.title || 'Unknown') + '</div>' +
        '<div class="t-co">' + (opp.company || '—') + ' · Applied ' + date + ' · Match: ' + (a.matchScore || 0) + '%</div>' +
      '</div>' +
      '<div class="s-badge ' + a.status + '">' + a.status.charAt(0).toUpperCase() + a.status.slice(1) + '</div>';
    list.appendChild(item);
  });
}

function setTab(tab, el) {
  state.curTrackerTab = tab;
  document.querySelectorAll('.t-tab').forEach(function(b) { b.classList.remove('active'); });
  el.classList.add('active');
  var filtered = tab === 'all' ? state.applications : state.applications.filter(function(a) { return a.status === tab; });
  renderTrackerList(filtered);
}

// ── Alerts ────────────────────────────────────
async function loadAlerts() {
  try {
    var res = await Promise.all([OppsAPI.getUrgent(), AppsAPI.getMyApps()]);
    var urgent = res[0].data || [];
    var myApps = res[1].data || [];

    // Urgent closing
    var urgEl = document.getElementById('al-urg');
    urgEl.innerHTML = '';
    if (urgent.length === 0) {
      urgEl.innerHTML = '<div class="empty-state" style="padding:20px"><p>No urgent deadlines right now.</p></div>';
    } else {
      urgent.forEach(function(o) {
        var days = o.daysLeft || Math.ceil((new Date(o.deadline) - new Date()) / 86400000);
        var dlText = o.deadlineDisplay || new Date(o.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
        urgEl.innerHTML +=
          '<div class="a-item urg">' +
          '<div class="a-ico">⚡</div>' +
          '<div class="a-txt">' +
            '<div class="a-title">' + o.title + ' — closes ' + dlText + '</div>' +
            '<div class="a-sub">' + o.company + ' · ' + o.stipend + (o.matchScore != null ? ' · ' + o.matchScore + '% match' : '') + '</div>' +
          '</div>' +
          '<div class="a-time">' + days + 'd left</div>' +
          '</div>';
      });
    }

    // Application updates
    var updEl = document.getElementById('al-upd');
    updEl.innerHTML = '';
    if (myApps.length === 0) {
      updEl.innerHTML = '<div class="empty-state" style="padding:20px"><p>No applications yet.</p></div>';
    } else {
      myApps.forEach(function(a) {
        var opp = a.opportunityId || {};
        var icons = { applied:'📬', pending:'⏳', accepted:'✅', rejected:'❌' };
        var classes = { applied:'', pending:'', accepted:'new', rejected:'' };
        var date = new Date(a.appliedAt).toLocaleDateString('en-IN', {day:'numeric',month:'short'});
        updEl.innerHTML +=
          '<div class="a-item ' + (classes[a.status]||'') + '">' +
          '<div class="a-ico">' + (icons[a.status]||'📋') + '</div>' +
          '<div class="a-txt">' +
            '<div class="a-title">' + (opp.title||'—') + ' — ' + a.status.charAt(0).toUpperCase()+a.status.slice(1) + '</div>' +
            '<div class="a-sub">' + (opp.company||'—') + ' · Match score: ' + (a.matchScore||0) + '%</div>' +
          '</div>' +
          '<div class="a-time">' + date + '</div>' +
          '</div>';
      });
    }

    // Update notif count
    document.getElementById('notif-count').textContent = urgent.length;

  } catch(e) {
    console.error('Alerts error:', e);
  }
}

// ── Profile ───────────────────────────────────
async function loadProfile() {
  try {
    var res = await UsersAPI.getProfile();
    var u = res.data;
    state.user = u;
    Auth.setUser(u);

    // Fill form
    document.getElementById('inp-name').value     = u.name || '';
    document.getElementById('inp-email').value    = u.email || '';
    document.getElementById('inp-cgpa').value     = u.cgpa || '';
    document.getElementById('inp-interests').value = u.interests || '';

    setSelectValue('inp-branch', u.branch);
    setSelectValue('inp-year',   u.year);
    setSelectValue('inp-income', u.incomeCategory);

    // Skills
    renderProfileSkills(u.skills || []);

    // Update profile card
    syncProfileUI();

    // My analytics
    var statsRes = await AnalyticsAPI.getMe();
    var s = statsRes.data || {};
    document.getElementById('pc-match-badge').textContent = (s.avgMatchScore || 0) + '% Avg Match';

  } catch(e) {
    showToast('Could not load profile: ' + e.message, 'error');
  }
}

function renderProfileSkills(skills) {
  var box = document.getElementById('skills-box');
  box.innerHTML = '';
  skills.forEach(function(s) {
    var tag = document.createElement('span');
    tag.className = 'sk-tag';
    tag.textContent = s + ' ✕';
    tag.onclick = function() { tag.remove(); };
    box.appendChild(tag);
  });
}

function addProfileSkill() {
  var inp = document.getElementById('sk-inp');
  var val = inp.value.trim();
  if (!val) return;
  var tag = document.createElement('span');
  tag.className = 'sk-tag';
  tag.textContent = val + ' ✕';
  tag.onclick = function() { tag.remove(); };
  document.getElementById('skills-box').appendChild(tag);
  inp.value = '';
}

document.getElementById('sk-inp').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') addProfileSkill();
});

function syncProfileUI() {
  var name   = document.getElementById('inp-name').value.trim();
  var branch = document.getElementById('inp-branch').value;
  var year   = document.getElementById('inp-year').value;
  var initials = name.split(' ').filter(Boolean).map(function(w){ return w[0].toUpperCase(); }).slice(0,2).join('') || '?';
  var roleText = (branch.split(' ')[0] || '') + (year ? ' · ' + year : '');

  document.getElementById('sb-av').textContent   = initials;
  document.getElementById('sb-name').textContent = name || 'Your Name';
  document.getElementById('sb-role').textContent = roleText;
  document.getElementById('big-av').textContent  = initials;
  document.getElementById('pc-name').textContent = name || 'Your Name';
  document.getElementById('pc-contact').textContent = document.getElementById('inp-email').value || '—';
  document.getElementById('pc-branch').textContent  = roleText;
  document.getElementById('hero-name').textContent  = name.split(' ')[0] || 'there';
}

async function saveProfile() {
  var btn = document.getElementById('profile-save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  // Collect skills from DOM
  var skills = Array.from(document.getElementById('skills-box').querySelectorAll('.sk-tag'))
    .map(function(t) { return t.textContent.replace(/\s*✕\s*$/, '').trim(); })
    .filter(Boolean);

  var payload = {
    name:            document.getElementById('inp-name').value.trim(),
    branch:          document.getElementById('inp-branch').value,
    year:            document.getElementById('inp-year').value,
    cgpa:            parseFloat(document.getElementById('inp-cgpa').value) || 0,
    skills:          skills,
    interests:       document.getElementById('inp-interests').value,
    incomeCategory:  document.getElementById('inp-income').value
  };

  try {
    var res = await UsersAPI.updateProfile(payload);
    state.user = res.data;
    Auth.setUser(res.data);
    updateSidebarUser();
    showToast(res.message || 'Profile saved!', 'success');
  } catch(e) {
    showToast('Save failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save and Recalculate Matches';
  }
}

// Resume upload
document.getElementById('resume-drop').addEventListener('dragover', function(e) {
  e.preventDefault();
  this.classList.add('dragover');
});
document.getElementById('resume-drop').addEventListener('dragleave', function() {
  this.classList.remove('dragover');
});
document.getElementById('resume-drop').addEventListener('drop', function(e) {
  e.preventDefault();
  this.classList.remove('dragover');
  var file = e.dataTransfer.files[0];
  if (file) uploadResume({ files: [file] });
});

async function uploadResume(input) {
  var file = input.files && input.files[0];
  if (!file) return;

  var drop = document.getElementById('resume-drop');
  drop.innerHTML = '<div class="rd-icon"><div class="spinner"></div></div><p>Analyzing resume with AI...</p>';

  try {
    var res = await ResumeAPI.upload(file);
    var skills = res.skills || [];

    // Show result
    var resultEl = document.getElementById('resume-result');
    var skillsEl = document.getElementById('resume-skills');
    skillsEl.innerHTML = '';
    skills.forEach(function(s) {
      skillsEl.innerHTML += '<span class="tag th">' + s + '</span>';
    });
    resultEl.classList.add('show');

    // Auto-add to profile skills box
    skills.forEach(function(s) {
      var existing = Array.from(document.getElementById('skills-box').querySelectorAll('.sk-tag'))
        .map(function(t) { return t.textContent.replace(/\s*✕$/, '').trim().toLowerCase(); });
      if (!existing.includes(s.toLowerCase())) {
        var tag = document.createElement('span');
        tag.className = 'sk-tag';
        tag.textContent = s + ' ✕';
        tag.onclick = function() { tag.remove(); };
        document.getElementById('skills-box').appendChild(tag);
      }
    });

    drop.innerHTML = '<div class="rd-icon">✅</div><p>Resume parsed! ' + skills.length + ' skills extracted.</p>';
    showToast(res.message, 'success');

  } catch(e) {
    drop.innerHTML = '<div class="rd-icon">📄</div><p>Click or drag your resume PDF here</p>';
    showToast('Resume upload failed: ' + e.message, 'error');
  }
  input.value = '';
}

// ── Admin ─────────────────────────────────────
async function loadAdmin() {
  if (!state.user || state.user.role !== 'admin') return;
  try {
    var res = await Promise.all([OppsAPI.getAll({ limit: 50 }), AnalyticsAPI.getAdmin()]);
    var opps  = res[0].data || [];
    var stats = res[1].data || {};

    // Stats block
    var s = stats.summary || {};
    document.getElementById('admin-stats').innerHTML =
      '<div style="display:flex;flex-direction:column;gap:9px">' +
      adminStatRow('Total Students', s.totalUsers || 0, 'var(--accent)') +
      adminStatRow('Total Applications', s.totalApplications || 0, '#a78bfa') +
      adminStatRow('Active Listings', s.totalOpportunities || 0, 'var(--accent3)') +
      adminStatRow('Success Rate', (s.successRate || 0) + '%', 'var(--warn)') +
      '</div>';

    // Listings
    var list = document.getElementById('admin-list');
    list.innerHTML = '';
    opps.forEach(function(o) {
      var dlText = o.deadlineDisplay || new Date(o.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
      var item = document.createElement('div');
      item.className = 't-item';
      item.innerHTML =
        '<div style="font-size:18px;width:26px;text-align:center;flex-shrink:0">' + (o.emoji||'🎯') + '</div>' +
        '<div class="t-info"><div class="t-title">' + o.title + '</div>' +
        '<div class="t-co">' + o.company + ' · ' + dlText + '</div></div>' +
        '<span class="tag ' + (TAG_CLASS[o.type]||'tm') + '">' + o.type + '</span>' +
        '<button class="btn-out" style="padding:4px 10px;font-size:11px;flex-shrink:0" onclick="adminRemoveOpp(\'' + o._id + '\',this)">Remove</button>';
      list.appendChild(item);
    });

  } catch(e) {
    showToast('Admin load error: ' + e.message, 'error');
  }
}

function adminStatRow(label, val, color) {
  return '<div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid var(--border)">' +
    '<span style="color:var(--muted)">' + label + '</span>' +
    '<span style="font-weight:700;color:' + color + '">' + val + '</span></div>';
}

async function adminAddOpportunity() {
  var payload = {
    title:         document.getElementById('adm-title').value.trim(),
    company:       document.getElementById('adm-company').value.trim(),
    type:          document.getElementById('adm-type').value,
    stipend:       document.getElementById('adm-stipend').value.trim(),
    deadline:      document.getElementById('adm-deadline').value,
    skillsRequired: document.getElementById('adm-skills').value.split(',').map(function(s){ return s.trim(); }).filter(Boolean),
    applyUrl:      document.getElementById('adm-url').value.trim(),
    description:   document.getElementById('adm-desc').value.trim()
  };
  if (!payload.title || !payload.company || !payload.deadline) {
    showToast('Title, company and deadline are required.', 'error');
    return;
  }
  try {
    await OppsAPI.create(payload);
    showToast('Opportunity published and live!', 'success');
    loadAdmin();
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
  }
}

async function adminRemoveOpp(id, btn) {
  btn.disabled = true;
  try {
    await OppsAPI.remove(id);
    showToast('Listing removed.', 'info');
    btn.closest('.t-item').remove();
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
    btn.disabled = false;
  }
}

// ── Analytics (Chart.js) ──────────────────────
async function loadAnalytics() {
  if (!state.user || state.user.role !== 'admin') return;
  try {
    var res = await AnalyticsAPI.getAdmin();
    var data = res.data;
    var charts = data.charts;
    var summary = data.summary;

    // Summary stats
    document.getElementById('an-users').textContent = summary.totalUsers || 0;
    document.getElementById('an-apps').textContent  = summary.totalApplications || 0;
    document.getElementById('an-opps').textContent  = summary.totalOpportunities || 0;
    document.getElementById('an-rate').textContent  = (summary.successRate || 0) + '%';

    var colors = ['#4f8aff','#7c3aed','#06d6a0','#f59e0b','#ef4444','#a78bfa'];
    var chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#e8edf7', font: { size: 11 } } } }
    };

    // Destroy old charts
    Object.values(state.charts).forEach(function(c) { if (c) c.destroy(); });

    // Branch bar chart
    state.charts.branch = new Chart(document.getElementById('chart-branch'), {
      type: 'bar',
      data: {
        labels: charts.applicationsByBranch.labels,
        datasets: [{ label: 'Applications', data: charts.applicationsByBranch.data, backgroundColor: '#4f8aff88', borderColor: '#4f8aff', borderWidth: 1 }]
      },
      options: { ...chartDefaults, scales: { x: { ticks: { color: '#6b7a99' }, grid: { color: '#1e2a44' } }, y: { ticks: { color: '#6b7a99' }, grid: { color: '#1e2a44' } } } }
    });

    // Match distribution bar
    state.charts.match = new Chart(document.getElementById('chart-match'), {
      type: 'bar',
      data: {
        labels: charts.matchDistribution.labels,
        datasets: [{ label: 'Students', data: charts.matchDistribution.data, backgroundColor: colors.map(function(c){ return c+'88'; }), borderColor: colors, borderWidth: 1 }]
      },
      options: { ...chartDefaults, scales: { x: { ticks: { color: '#6b7a99' }, grid: { color: '#1e2a44' } }, y: { ticks: { color: '#6b7a99' }, grid: { color: '#1e2a44' } } } }
    });

    // Type doughnut
    state.charts.type = new Chart(document.getElementById('chart-type'), {
      type: 'doughnut',
      data: {
        labels: charts.applicationsByType.labels,
        datasets: [{ data: charts.applicationsByType.data, backgroundColor: colors, borderColor: '#0d1120', borderWidth: 2 }]
      },
      options: { ...chartDefaults }
    });

    // Time line chart
    state.charts.time = new Chart(document.getElementById('chart-time'), {
      type: 'line',
      data: {
        labels: charts.applicationsOverTime.labels,
        datasets: [{ label: 'Applications', data: charts.applicationsOverTime.data, borderColor: '#4f8aff', backgroundColor: '#4f8aff22', fill: true, tension: 0.4 }]
      },
      options: { ...chartDefaults, scales: { x: { ticks: { color: '#6b7a99' }, grid: { color: '#1e2a44' } }, y: { ticks: { color: '#6b7a99' }, grid: { color: '#1e2a44' } } } }
    });

  } catch(e) {
    showToast('Analytics error: ' + e.message, 'error');
  }
}

// ── Notifications ─────────────────────────────
function toggleNotif() {
  document.getElementById('notif-panel').classList.toggle('open');
  loadNotifications();
}

async function loadNotifications() {
  var list = document.getElementById('notif-list');
  try {
    var res = await OppsAPI.getUrgent();
    var urgent = res.data || [];
    list.innerHTML = '';
    if (urgent.length === 0) {
      list.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:12px">No urgent deadlines.</div>';
    } else {
      urgent.slice(0, 5).forEach(function(o) {
        var days = Math.ceil((new Date(o.deadline) - new Date()) / 86400000);
        list.innerHTML += '<div class="n-item"><strong>' + o.title + '</strong><br>' + o.company + ' — ' + days + ' day' + (days!==1?'s':'') + ' left</div>';
      });
    }
  } catch(e) {
    list.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:12px">Could not load notifications.</div>';
  }
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('#notif-panel') && !e.target.closest('.icon-btn')) {
    document.getElementById('notif-panel').classList.remove('open');
  }
});

// ── Helpers ───────────────────────────────────
function setSelectValue(id, value) {
  var sel = document.getElementById(id);
  if (!sel || !value) return;
  for (var i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === value || sel.options[i].text === value) {
      sel.selectedIndex = i;
      break;
    }
  }
}
