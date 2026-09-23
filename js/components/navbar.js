/* =============================================================================
   SRMS - Navbar Component  (js/components/navbar.js)
   Page title + breadcrumb, global search, notifications, messages, profile menu.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var D = null;
  var state = { role:'student', user:null, notifFilter:'all' };
  var navigate = null;

  /* -------------------------------------------------------------- SEARCH */
  function searchIndex(role) {
    var D = global.SRMS_DATA;
    var idx = [];
    (D.courses || []).forEach(function (c) {
      idx.push({ group:'Courses', title:c.name, sub:c.code + ' \u00b7 ' + c.teacher, icon:'fa-book-open', page:'courses', keywords:c.code + ' ' + c.name + ' ' + c.teacher });
    });
    (D.studentRoster || []).slice(0, 40).forEach(function (s) {
      if (role === 'student' && s.id !== D.studentProfile.id) return;
      idx.push({ group:'Students', title:s.name, sub:s.id + ' \u00b7 ' + s.dept, icon:'fa-user-graduate', page: role === 'student' ? 'profile' : 'students', keywords:s.id + ' ' + s.name + ' ' + s.email });
    });
    (D.teachers || []).forEach(function (t) {
      idx.push({ group:'Teachers', title:t.name, sub:t.id + ' \u00b7 ' + t.dept, icon:'fa-chalkboard-user', page:'teachers', keywords:t.id + ' ' + t.name + ' ' + t.designation });
    });
    (D.recentResults || []).forEach(function (r) {
      idx.push({ group:'Results', title:r.subject, sub:r.code + ' \u00b7 ' + r.examType + ' \u00b7 ' + r.grade, icon:'fa-chart-line', page:'results', keywords:r.code + ' ' + r.subject + ' ' + r.grade });
    });
    (D.notices || []).forEach(function (n) {
      idx.push({ group:'Notices', title:n.title, sub:n.category + ' \u00b7 ' + U.fmtDate(n.date), icon:'fa-bullhorn', page:'notices', keywords:n.title + ' ' + n.category });
    });
    (D.assignments || []).forEach(function (a) {
      idx.push({ group:'Assignments', title:a.title, sub:a.code + ' \u00b7 due ' + U.fmtDate(a.due), icon:'fa-clipboard-check', page:'assignments', keywords:a.title + ' ' + a.code + ' ' + a.course });
    });
    (D.exams || []).forEach(function (e) {
      idx.push({ group:'Exams', title:e.course + ' ' + e.type, sub:e.date + ' \u00b7 ' + e.room, icon:'fa-file-pen', page:'exams', keywords:e.code + ' ' + e.course + ' ' + e.type });
    });
    (D.books || []).forEach(function (b) {
      idx.push({ group:'Library', title:b.title, sub:b.author + ' \u00b7 ' + b.category, icon:'fa-book', page:'library', keywords:b.title + ' ' + b.author + ' ' + b.isbn });
    });
    return idx;
  }

  function renderSearch(term) {
    var panel = document.getElementById('search-results');
    if (!panel) return;
    var t = String(term || '').trim().toLowerCase();
    if (t.length < 2) { panel.hidden = true; panel.innerHTML = ''; return; }

    var idx = searchIndex(state.role);
    var hits = idx.filter(function (i) { return i.keywords.toLowerCase().indexOf(t) > -1 || i.title.toLowerCase().indexOf(t) > -1; }).slice(0, 24);

    if (!hits.length) {
      panel.innerHTML = '<div class="search-empty"><i class="fas fa-magnifying-glass"></i>No results found for <strong>' + U.esc(term) + '</strong></div>';
      panel.hidden = false;
      return;
    }

    var groups = U.groupBy(hits, 'group');
    panel.innerHTML = Object.keys(groups).map(function (g) {
      return '<div class="search-group-title">' + U.esc(g) + '</div>' + groups[g].map(function (h) {
        return '<button class="search-result" data-goto-page="' + h.page + '" data-search="' + U.esc(h.title) + '">' +
          '<span class="search-result-ico"><i class="fas ' + h.icon + '"></i></span>' +
          '<span class="search-result-txt"><strong>' + U.esc(h.title) + '</strong><span>' + U.esc(h.sub) + '</span></span>' +
          '<i class="fas fa-arrow-right text-mute" style="font-size:11px"></i></button>';
      }).join('');
    }).join('');
    panel.hidden = false;
  }

  /* ------------------------------------------------------- NOTIFICATIONS */
  function renderNotifications() {
    var host = document.getElementById('notifications-panel-body');
    if (!host) return;
    var all = (global.SRMS_DATA.notifications || []);
    var list = state.notifFilter === 'all' ? all : all.filter(function (n) { return n.category === state.notifFilter; });
    if (!list.length) { host.innerHTML = UI.emptyState({ small:true, icon:'fa-bell-slash', title:'No notifications', message:'You have no notifications in this category.' }); return; }
    host.innerHTML = list.map(function (n) {
      return '<button class="notif-item' + (n.unread ? ' unread' : '') + '" data-notif="' + n.id + '" data-goto="notifications-center">' +
        '<span class="notif-ico badge-' + n.tone + '"><i class="fas ' + n.icon + '"></i></span>' +
        '<span class="notif-txt"><strong>' + U.esc(n.title) + '</strong><p>' + U.esc(n.text) + '</p><time>' + U.esc(n.time) + '</time></span>' +
      '</button>';
    }).join('');
    var unread = all.filter(function (n) { return n.unread; }).length;
    setBadge('notifications-count', unread);
  }

  function renderMessages() {
    var host = document.getElementById('messages-panel-body');
    if (!host) return;
    var list = (global.SRMS_DATA.messages || []).slice(0, 5);
    if (!list.length) { host.innerHTML = UI.emptyState({ small:true, icon:'fa-comment-slash', title:'No messages', message:'Your inbox is empty.' }); return; }
    host.innerHTML = list.map(function (m) {
      return '<button class="notif-item' + (m.unread ? ' unread' : '') + '" data-thread="' + m.id + '" data-goto="messages">' +
        '<span class="notif-ico badge-' + m.tone + '">' + U.initials(m.from) + '</span>' +
        '<span class="notif-txt"><strong>' + U.esc(m.from) + '</strong><p>' + U.esc(m.subject) + '</p><time>' + U.esc(U.timeAgo(m.time)) + '</time></span>' +
      '</button>';
    }).join('');
    var unread = (global.SRMS_DATA.messages || []).filter(function (m) { return m.unread; }).length;
    setBadge('messages-count', unread);
  }

  function setBadge(id, count) {
    var b = document.getElementById(id);
    if (!b) return;
    if (count > 0) { b.textContent = count > 99 ? '99+' : String(count); b.classList.remove('hide'); }
    else b.classList.add('hide');
  }

  /* ----------------------------------------------------------- DROPDOWNS */
  function closeAllDropdowns(except) {
    [['notifications-btn','notifications-panel'], ['messages-btn','messages-panel'], ['profile-trigger','profile-panel']].forEach(function (pair) {
      if (except && pair[1] === except) return;
      var p = document.getElementById(pair[1]), b = document.getElementById(pair[0]);
      if (p) p.hidden = true;
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  function toggleDropdown(btnId, panelId) {
    var btn = document.getElementById(btnId), panel = document.getElementById(panelId);
    if (!btn || !panel) return;
    var willOpen = panel.hidden;
    closeAllDropdowns(panelId);
    panel.hidden = !willOpen;
    btn.setAttribute('aria-expanded', String(willOpen));
  }

  /* ----------------------------------------------------------------- RENDER */
  function mountUser(user) {
    state.user = user;
    var name = user.name, roleLabel = user.roleLabel, email = user.email;
    var ini = U.initials(name);

    function fillAvatar(id) {
      var a = document.getElementById(id);
      if (a) a.innerHTML = U.esc(ini);
    }
    fillAvatar('navbar-avatar'); fillAvatar('sidebar-avatar'); fillAvatar('panel-avatar');

    var el;
    if ((el = document.getElementById('navbar-user-name'))) el.textContent = name;
    if ((el = document.getElementById('navbar-user-role'))) el.textContent = roleLabel;
    if ((el = document.getElementById('sidebar-user-name'))) el.textContent = name;
    if ((el = document.getElementById('sidebar-user-role'))) el.textContent = roleLabel;
    if ((el = document.getElementById('panel-user-name'))) el.textContent = name;
    if ((el = document.getElementById('panel-user-email'))) el.textContent = email;
  }

  function setPage(title, crumbs) {
    var t = document.getElementById('page-title');
    if (t) t.textContent = title;
    var bc = document.getElementById('breadcrumb');
    if (bc) {
      var parts = (crumbs || ['Dashboard']);
      bc.innerHTML = parts.map(function (p, i) {
        return i === parts.length - 1 ? '<strong>' + U.esc(p) + '</strong>' : U.esc(p) + ' <i class="fas fa-chevron-right"></i>';
      }).join(' ');
    }
    document.title = title + ' \u00b7 SRMS';
  }

  function init(role, user, onNavigate) {
    state.role = role;
    navigate = onNavigate;
    mountUser(user);
    renderNotifications();
    renderMessages();

    /* Listeners bind once; re-login (logout -> sign in) only refreshes state above. */
    if (init._wired) return;
    init._wired = true;

    document.getElementById('notifications-btn').addEventListener('click', function () { toggleDropdown('notifications-btn', 'notifications-panel'); });
    document.getElementById('messages-btn').addEventListener('click', function () { toggleDropdown('messages-btn', 'messages-panel'); });
    document.getElementById('profile-trigger').addEventListener('click', function () { toggleDropdown('profile-trigger', 'profile-panel'); });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.dropdown-anchor')) closeAllDropdowns();
      if (!e.target.closest('.navbar-search')) {
        var sp = document.getElementById('search-results');
        if (sp) sp.hidden = true;
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeAllDropdowns(); var sp = document.getElementById('search-results'); if (sp) sp.hidden = true; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        var inp = document.getElementById('global-search');
        if (inp) { inp.focus(); inp.select(); }
      }
    });

    /* Search wiring */
    var search = document.getElementById('global-search');
    if (search) {
      search.addEventListener('input', U.debounce(function () { renderSearch(search.value); }, 180));
      search.addEventListener('focus', function () { if (search.value.trim().length >= 2) renderSearch(search.value); });
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var first = document.querySelector('.search-result');
          if (first) first.click();
        }
      });
    }
    var panel = document.getElementById('search-results');
    if (panel) panel.addEventListener('click', function (e) {
      var r = e.target.closest('[data-goto-page]');
      if (!r) return;
      panel.hidden = true;
      if (search) search.value = '';
      if (typeof navigate === 'function') navigate(r.getAttribute('data-goto-page'));
    });

    /* Notification filter tabs */
    var tabs = document.getElementById('notif-tabs');
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var b = e.target.closest('.drop-tab');
        if (!b) return;
        state.notifFilter = b.getAttribute('data-filter');
        U.qsa('.drop-tab', tabs).forEach(function (t) { t.classList.toggle('active', t === b); });
        renderNotifications();
      });
    }

    var markAll = document.getElementById('mark-all-read');
    if (markAll) markAll.addEventListener('click', function () {
      (global.SRMS_DATA.notifications || []).forEach(function (n) { n.unread = false; });
      renderNotifications();
      UI.toast('success', 'Notifications cleared', 'All notifications marked as read.');
    });

    /* Dropdown body clicks route through the app router */
    document.getElementById('notifications-panel-body').addEventListener('click', function (e) {
      var n = e.target.closest('[data-goto]');
      if (!n) return;
      var id = n.getAttribute('data-notif');
      var item = (global.SRMS_DATA.notifications || []).filter(function (x) { return x.id === id; })[0];
      if (item) item.unread = false;
      renderNotifications();
      closeAllDropdowns();
      if (typeof navigate === 'function') navigate(n.getAttribute('data-goto'));
    });

    document.getElementById('messages-panel-body').addEventListener('click', function (e) {
      var m = e.target.closest('[data-goto]');
      if (!m) return;
      closeAllDropdowns();
      if (typeof navigate === 'function') navigate(m.getAttribute('data-goto'));
    });

    document.getElementById('profile-panel').addEventListener('click', function (e) {
      var b = e.target.closest('[data-goto]');
      if (!b) return;
      closeAllDropdowns();
      if (typeof navigate === 'function') navigate(b.getAttribute('data-goto'));
    });

    /* Density toggle */
    var density = document.getElementById('density-btn');
    if (density) density.addEventListener('click', function () {
      document.body.classList.toggle('dense');
      var on = document.body.classList.contains('dense');
      var prefs = U.getPrefs(); prefs.dense = on; U.setPrefs(prefs);
      UI.toast('info', 'Layout density', on ? 'Compact layout enabled.' : 'Comfortable layout restored.');
      window.dispatchEvent(new Event('resize'));
    });

    var prefs = U.getPrefs();
    if (prefs.dense) document.body.classList.add('dense');
  }

  global.SRMS_NAVBAR = { init:init, setPage:setPage, mountUser:mountUser, closeAllDropdowns:closeAllDropdowns, setBadge:setBadge, renderNotifications:renderNotifications, renderMessages:renderMessages };
})(window);
