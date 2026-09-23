/* =============================================================================
   SRMS - Sidebar Component  (js/components/sidebar.js)
   Role-aware navigation, collapse / expand, mobile drawer, tooltips.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var store = { load:function(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}, save:function(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}} };
  var COLLAPSE_KEY = 'srms.sidebar.collapsed';

  var MENUS = {
    student: [
      { section:'Main', items:[
        { key:'dashboard',  label:'Dashboard',        icon:'fa-gauge-high' },
        { key:'profile',    label:'Profile',          icon:'fa-user' }
      ]},
      { section:'Academic', items:[
        { key:'courses',    label:'Courses',          icon:'fa-book-open' },
        { key:'results',    label:'Results',          icon:'fa-chart-line' },
        { key:'attendance', label:'Attendance',       icon:'fa-user-check' },
        { key:'exams',      label:'Exams',            icon:'fa-file-pen' },
        { key:'timetable',  label:'Timetable',        icon:'fa-calendar-week' },
        { key:'calendar',   label:'Academic Calendar',icon:'fa-calendar-days' }
      ]},
      { section:'Communication', items:[
        { key:'notices',       label:'Notice Board', icon:'fa-bullhorn', tag:'4', tagTone:'warn' },
        { key:'messages',      label:'Messages',     icon:'fa-comment-dots', tag:'3' },
        { key:'announcements', label:'Announcements',icon:'fa-tower-broadcast' }
      ]},
      { section:'Services', items:[
        { key:'downloads',   label:'Downloads',   icon:'fa-download' },
        { key:'assignments', label:'Assignments', icon:'fa-clipboard-check', tag:'3', tagTone:'warn' },
        { key:'library',     label:'Library',     icon:'fa-book' },
        { key:'feedback',    label:'Feedback',    icon:'fa-comment' }
      ]},
      { section:'Account', items:[
        { key:'settings', label:'Settings',       icon:'fa-sliders' },
        { key:'help',     label:'Help & Support', icon:'fa-circle-question' }
      ]}
    ],

    teacher: [
      { section:'Main', items:[
        { key:'dashboard', label:'Dashboard', icon:'fa-gauge-high' },
        { key:'profile',   label:'Profile',   icon:'fa-user' }
      ]},
      { section:'Teaching', items:[
        { key:'courses',     label:'My Courses',  icon:'fa-book-open' },
        { key:'students',    label:'Students',    icon:'fa-users' },
        { key:'attendance',  label:'Attendance',  icon:'fa-user-check' },
        { key:'assignments', label:'Assignments', icon:'fa-clipboard-check', tag:'5' }
      ]},
      { section:'Exams & Results', items:[
        { key:'exams',   label:'Exams',   icon:'fa-file-pen' },
        { key:'results', label:'Results', icon:'fa-square-poll-vertical', tag:'2', tagTone:'warn' },
        { key:'reports', label:'Reports', icon:'fa-chart-pie' }
      ]},
      { section:'Communication', items:[
        { key:'messages',      label:'Messages',      icon:'fa-comment-dots', tag:'2' },
        { key:'notices',       label:'Notices',       icon:'fa-bullhorn' },
        { key:'announcements', label:'Announcements', icon:'fa-tower-broadcast' }
      ]},
      { section:'Account', items:[
        { key:'timetable', label:'Timetable',      icon:'fa-calendar-week' },
        { key:'settings',  label:'Settings',       icon:'fa-sliders' },
        { key:'help',      label:'Help & Support', icon:'fa-circle-question' }
      ]}
    ],

    admin: [
      { section:'Main', items:[
        { key:'dashboard', label:'Dashboard', icon:'fa-gauge-high' },
        { key:'profile',   label:'Profile',   icon:'fa-user' }
      ]},
      { section:'Management', items:[
        { key:'students',    label:'Students',    icon:'fa-user-graduate' },
        { key:'teachers',    label:'Teachers',    icon:'fa-chalkboard-user' },
        { key:'departments', label:'Departments', icon:'fa-building-columns' },
        { key:'courses',     label:'Courses',     icon:'fa-book-open' },
        { key:'subjects',    label:'Subjects',    icon:'fa-layer-group' }
      ]},
      { section:'Academic', items:[
        { key:'results',    label:'Results',           icon:'fa-chart-line' },
        { key:'attendance', label:'Attendance',        icon:'fa-user-check' },
        { key:'exams',      label:'Exams',             icon:'fa-file-pen' },
        { key:'timetable',  label:'Timetable',         icon:'fa-calendar-week' },
        { key:'calendar',   label:'Academic Calendar', icon:'fa-calendar-days' }
      ]},
      { section:'Content', items:[
        { key:'notices',     label:'Notice Board', icon:'fa-bullhorn', tag:'8' },
        { key:'assignments', label:'Assignments',  icon:'fa-clipboard-check' },
        { key:'library',     label:'Library',      icon:'fa-book' }
      ]},
      { section:'System', items:[
        { key:'reports',      label:'Reports',         icon:'fa-chart-pie' },
        { key:'users',        label:'User Management', icon:'fa-users-gear' },
        { key:'settings',     label:'System Settings', icon:'fa-sliders' },
        { key:'audit',        label:'Audit Logs',      icon:'fa-shield-halved' },
        { key:'help',         label:'Help & Support',  icon:'fa-circle-question' }
      ]}
    ]
  };

  function menuFor(role) { return MENUS[role] || MENUS.student; }

  function render(role, activePage) {
    var nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    var menu = menuFor(role);

    nav.innerHTML = menu.map(function (group) {
      return '<div class="nav-section">' +
        '<div class="nav-section-title">' + U.esc(group.section) + '</div>' +
        group.items.map(function (it) {
          return '<button class="nav-item' + (it.key === activePage ? ' active' : '') + '" data-page="' + it.key + '" data-tooltip="' + U.esc(it.label) + '"' +
            (it.key === activePage ? ' aria-current="page"' : '') + '>' +
            '<i class="fas ' + it.icon + ' nav-ico"></i>' +
            '<span class="nav-label">' + U.esc(it.label) + '</span>' +
            (it.tag ? '<span class="nav-tag' + (it.tagTone === 'warn' ? ' warn' : '') + '">' + U.esc(it.tag) + '</span>' : '') +
          '</button>';
        }).join('') +
      '</div>';
    }).join('');
  }

  function setActive(activePage) {
    U.qsa('.nav-item').forEach(function (b) {
      var on = b.getAttribute('data-page') === activePage;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }

  function isCollapsed() { return store.load(COLLAPSE_KEY) === true; }

  function applyCollapse(collapsed) {
    var sb = document.getElementById('sidebar');
    if (!sb) return;
    sb.classList.toggle('collapsed', !!collapsed);
    var btn = document.getElementById('sidebar-collapse');
    if (btn) {
      btn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
      btn.setAttribute('title', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
      btn.innerHTML = '<i class="fas ' + (collapsed ? 'fa-angles-right' : 'fa-angles-left') + '"></i>';
    }
    store.save(COLLAPSE_KEY, !!collapsed);
  }

  function toggleCollapse() { applyCollapse(!isCollapsed()); }

  function openDrawer() {
    var sb = document.getElementById('sidebar'), ov = document.getElementById('sidebar-overlay');
    if (!sb) return;
    sb.classList.add('drawer-open');
    if (ov) ov.classList.add('show');
    var ham = document.getElementById('hamburger');
    if (ham) ham.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var first = sb.querySelector('.nav-item');
    if (first) first.focus();
  }

  function closeDrawer() {
    var sb = document.getElementById('sidebar'), ov = document.getElementById('sidebar-overlay');
    var ham = document.getElementById('hamburger');
    if (ham) ham.setAttribute('aria-expanded', 'false');
    if (sb) sb.classList.remove('drawer-open');
    if (ov) ov.classList.remove('show');
    document.body.style.overflow = '';
  }

  function isDrawerOpen() {
    var sb = document.getElementById('sidebar');
    return !!sb && sb.classList.contains('drawer-open');
  }

  var navigate = null;

  function isMobile() { return window.matchMedia('(max-width: 899px)').matches; }

  function init(role, onNavigate) {
    /* Refresh the route callback on each login without re-binding. */
    if (typeof onNavigate === 'function') navigate = onNavigate;

    /* Restore the proper mobile/desktop state on every login. */
    if (isMobile()) {
      var sb = document.getElementById('sidebar');
      if (sb) { sb.classList.remove('collapsed'); sb.classList.remove('drawer-open'); }
      var ov = document.getElementById('sidebar-overlay');
      if (ov) ov.classList.remove('show');
      var ham = document.getElementById('hamburger');
      if (ham) ham.setAttribute('aria-expanded', 'false');
      closeDrawer();
    } else {
      applyCollapse(isCollapsed());
    }

    /* Listeners are bound once.  Binding them again on every login stacked
       duplicate handlers -> double-toggle (collapse then instantly
       expand / open then instantly close) -> "still uncollapsible" and
       "sidebar not openable". */
    if (init._wired) return;
    init._wired = true;

    var nav = document.getElementById('sidebar-nav');
    if (nav) {
      nav.addEventListener('click', function (e) {
        var item = e.target.closest('.nav-item');
        if (!item) return;
        var page = item.getAttribute('data-page');
        if (isMobile()) closeDrawer();
        if (typeof navigate === 'function') navigate(page);
      });
      nav.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var item = e.target.closest('.nav-item');
        if (!item) return;
        e.preventDefault();
        if (typeof navigate === 'function') navigate(item.getAttribute('data-page'));
      });
    }

    var colBtn = document.getElementById('sidebar-collapse');
    if (colBtn) colBtn.addEventListener('click', toggleCollapse);

    var hamBtn = document.getElementById('hamburger');
    if (hamBtn) hamBtn.addEventListener('click', function () {
      if (isMobile()) { isDrawerOpen() ? closeDrawer() : openDrawer(); }
      else toggleCollapse();
    });

    var ov = document.getElementById('sidebar-overlay');
    if (ov) ov.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isDrawerOpen()) closeDrawer();
    });

    window.addEventListener('resize', U.debounce(function () {
      if (isMobile()) {
        var s = document.getElementById('sidebar');
        if (s) { s.classList.remove('collapsed'); s.classList.remove('drawer-open'); }
        var o = document.getElementById('sidebar-overlay');
        if (o) o.classList.remove('show');
        closeDrawer();
        var h = document.getElementById('hamburger');
        if (h) h.setAttribute('aria-expanded', 'false');
      } else {
        closeDrawer();
        applyCollapse(isCollapsed());
      }
    }, 160));
  }

  global.SRMS_SIDEBAR = {
    MENUS: MENUS, render:render, setActive:setActive, init:init,
    toggleCollapse:toggleCollapse, applyCollapse:applyCollapse, isCollapsed:isCollapsed,
    openDrawer:openDrawer, closeDrawer:closeDrawer, isMobile:isMobile, isDrawerOpen:isDrawerOpen
  };
})(window);
