/* =============================================================================
   SRMS - Shared Pages  (js/pages/shared.js)
   Pages used by every role: Settings, Help & Support, Announcements,
   Notification Center and the Academic Calendar.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  /* ============================== SETTINGS ============================== */
  function settingsPage(host, ctx) {
    var user = ctx.user;
    var prefs = U.getPrefs();

    host.innerHTML =
      UI.pageHead({ title:'Settings', subtitle:'Manage your profile preferences, notifications and account security.' }) +
      '<div class="grid grid-main-side">' +
        '<div class="grid" style="gap:18px">' +
          UI.card({ title:'Profile Preferences', icon:'fa-sliders', subtitle:'These options are stored in your browser for the demo build.',
            body:'<div class="form-grid">' +
              '<div class="form-group"><label class="field-label">Display Name</label>' +
                '<div class="input-wrap no-icon"><input type="text" id="set-name" value="' + U.esc(user.name) + '"></div></div>' +
              '<div class="form-group"><label class="field-label">Email Address</label>' +
                '<div class="input-wrap no-icon"><input type="email" id="set-email" value="' + U.esc(user.email) + '"></div></div>' +
              '<div class="form-group"><label class="field-label">Preferred Language</label>' +
                '<div class="input-wrap no-icon"><select id="set-lang"><option>English</option><option>Urdu</option><option>Arabic</option></select></div></div>' +
              '<div class="form-group"><label class="field-label">Time Zone</label>' +
                '<div class="input-wrap no-icon"><select id="set-tz"><option>Asia/Karachi (GMT+5)</option><option>Asia/Dubai (GMT+4)</option><option>Europe/London (GMT+0)</option></select></div></div>' +
            '</div>' +
            '<div class="form-actions"><button class="btn btn-primary" id="set-save"><i class="fas fa-floppy-disk"></i> Save Preferences</button>' +
            '<button class="btn btn-outline" id="set-reset"><i class="fas fa-rotate-left"></i> Reset to Defaults</button></div>' }) +

          UI.card({ title:'Notification Preferences', icon:'fa-bell',
            body:'<div class="list-simple" id="notif-prefs">' +
              [['Result publications','fa-chart-line','When a new result is published for you',true],
               ['Exam reminders','fa-file-pen','Reminders 3 days before every exam',true],
               ['Attendance warnings','fa-user-clock','Alert when attendance falls below the required percentage',true],
               ['Assignment deadlines','fa-clipboard-check','Reminders 48 hours before a deadline',true],
               ['Notice board updates','fa-bullhorn','New university notices and circulars',false],
               ['Messages from faculty','fa-comment-dots','Direct messages from teachers and advisors',true]
              ].map(function (p, i) {
                return '<div class="list-row"><span class="resource-ico badge-blue" style="width:36px;height:36px;font-size:14px;border-radius:10px"><i class="fas ' + p[1] + '"></i></span>' +
                  '<div class="list-row-main"><strong>' + p[0] + '</strong><span>' + p[2] + '</span></div>' +
                  '<label class="checkbox-label"><input type="checkbox" data-pref="' + i + '"' + (p[3] ? ' checked' : '') + '><span class="checkbox-box"><i class="fas fa-check"></i></span></label></div>';
              }).join('') +
            '</div>' }) +

          UI.card({ title:'Appearance', icon:'fa-palette',
            body:'<div class="grid grid-2" style="gap:14px">' +
              '<div class="list-row"><div class="list-row-main"><strong>Compact density</strong><span>Reduce spacing across tables and cards</span></div>' +
                '<label class="checkbox-label"><input type="checkbox" id="set-dense"' + (document.body.classList.contains('dense') ? ' checked' : '') + '><span class="checkbox-box"><i class="fas fa-check"></i></span></label></div>' +
              '<div class="list-row"><div class="list-row-main"><strong>Animate charts</strong><span>Play chart entrance animations</span></div>' +
                '<label class="checkbox-label"><input type="checkbox" id="set-anim" checked><span class="checkbox-box"><i class="fas fa-check"></i></span></label></div>' +
            '</div>' }) +
        '</div>' +

        '<div class="grid" style="gap:18px">' +
          UI.card({ body:'<div class="text-center">' + UI.avatar(user.name, 'xl') +
            '<h3 class="mt-12">' + U.esc(user.name) + '</h3>' +
            '<p class="text-soft text-sm">' + U.esc(user.roleLabel) + '</p>' +
            '<div class="profile-tags">' + UI.badge(U.esc(user.identifier), 'blue') + UI.badge(user.role === 'student' ? 'Active' : 'Verified', 'green') + '</div></div>' +
            '<div class="profile-quick">' +
              '<button class="btn btn-outline btn-block" id="set-chpw"><i class="fas fa-key"></i> Change Password</button>' +
              '<button class="btn btn-outline btn-block" id="set-2fa"><i class="fas fa-shield-halved"></i> Two-Factor Auth</button>' +
              '<button class="btn btn-outline btn-block" id="set-sessions"><i class="fas fa-desktop"></i> Active Sessions</button>' +
            '</div>' }) +
          UI.card({ title:'Account Status', icon:'fa-circle-check',
            body:UI.meterList([
              { label:'Profile completeness', value:'92%', percent:92, tone:'green' },
              { label:'Security score',       value:'84%', percent:84, tone:'' },
              { label:'Data backup',          value:'100%', percent:100, tone:'green' }
            ]) }) +
        '</div>' +
      '</div>';

    var save = document.getElementById('set-save');
    if (save) save.addEventListener('click', function () {
      var n = document.getElementById('set-name').value.trim();
      var e = document.getElementById('set-email').value.trim();
      if (!U.isRequired(n)) { UI.toast('error', 'Name required', 'Display name cannot be empty.'); return; }
      if (!U.isEmail(e)) { UI.toast('error', 'Invalid email', 'Enter a valid email address.'); return; }
      UI.toast('success', 'Preferences saved', 'Your profile settings have been updated.');
    });

    var reset = document.getElementById('set-reset');
    if (reset) reset.addEventListener('click', function () {
      UI.confirm({ title:'Reset all preferences?', message:'This restores the default settings for your account.', tone:'warning', confirmText:'Reset',
        onConfirm:function () { UI.toast('success', 'Defaults restored', 'All preferences have been reset.'); } });
    });

    var dense = document.getElementById('set-dense');
    if (dense) dense.addEventListener('change', function () {
      document.body.classList.toggle('dense', dense.checked);
      var prefs2 = U.getPrefs(); prefs2.dense = dense.checked; U.setPrefs(prefs2);
      window.dispatchEvent(new Event('resize'));
    });

    var chpw = document.getElementById('set-chpw');
    if (chpw) chpw.addEventListener('click', function () { global.SRMS_APP.openChangePassword(); });

    var tfa = document.getElementById('set-2fa');
    if (tfa) tfa.addEventListener('click', function () {
      UI.modal({ title:'Two-Factor Authentication', subtitle:'Add an extra layer of security to your account.',
        body:UI.alert({ tone:'info', title:'Recommended', message:'Two-factor authentication significantly reduces the risk of unauthorised access.' }) +
          '<div class="form-group mt-16"><label for="tfa-phone">Mobile Number</label>' +
          '<div class="input-wrap"><i class="fas fa-mobile-screen input-icon"></i><input id="tfa-phone" placeholder="+92 300 0000000" value="' + U.esc(ctx.user.role === 'student' ? global.SRMS_DATA.studentProfile.phone : '') + '"></div></div>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="tfa-on">Enable 2FA</button>',
        onMount:function (m) { m.on('#tfa-on', 'click', function () { m.close(); UI.toast('success', '2FA enabled', 'Verification codes will be sent to your mobile number.'); }); } });
    });

    var sess = document.getElementById('set-sessions');
    if (sess) sess.addEventListener('click', function () {
      UI.modal({ title:'Active Sessions',
        body:'<div class="list-simple">' +
          [['Windows 11 \u00b7 Chrome','Current session','Karachi, Pakistan','Just now',true],
           ['Android \u00b7 Chrome','Mobile device','Karachi, Pakistan','2 hours ago',false],
           ['macOS \u00b7 Safari','Lab computer','Karachi, Pakistan','Yesterday',false]
          ].map(function (s) {
            return '<div class="list-row"><span class="resource-ico ' + (s[4] ? 'badge-green' : 'badge-gray') + '" style="width:38px;height:38px;font-size:14px;border-radius:11px"><i class="fas fa-desktop"></i></span>' +
              '<div class="list-row-main"><strong>' + s[0] + '</strong><span>' + s[1] + ' \u00b7 ' + s[2] + ' \u00b7 ' + s[3] + '</span></div>' +
              (s[4] ? UI.badge('Active', 'green') : '<button class="btn btn-outline btn-xs">Revoke</button>') + '</div>';
          }).join('') + '</div>',
        footer:'<button class="btn btn-outline" data-modal-close>Close</button><button class="btn btn-danger" id="sess-revoke">Revoke All Others</button>',
        onMount:function (m) { m.on('#sess-revoke', 'click', function () { m.close(); UI.toast('success', 'Sessions revoked', 'All other devices have been signed out.'); }); } });
    });
  }

  /* ========================== HELP & SUPPORT ========================== */
  var FAQS = [
    { q:'How is the CGPA calculated?', a:'Each course grade carries a grade point on a 4.0 scale. The CGPA is the credit-weighted average of grade points across all completed semesters.' },
    { q:'What is the minimum attendance requirement?', a:'Students must maintain at least 75 percent attendance in every course. Falling below this threshold makes you ineligible for the final examination.' },
    { q:'How do I download my result card?', a:'Open the Downloads page from the sidebar and choose Result Card, or use the Download button on the Results page.' },
    { q:'When are results published?', a:'Mid-semester results are published within two weeks of the exam. Final results are announced on the date listed in the academic calendar.' },
    { q:'How can I request a transcript?', a:'Submit a transcript request through the Downloads page. The registrar office processes requests within three working days.' },
    { q:'Who do I contact for fee issues?', a:'Contact the Finance Office through the Messages page. Include your student ID and fee voucher number for faster resolution.' }
  ];

  function helpPage(host, ctx) {
    host.innerHTML =
      UI.pageHead({ title:'Help & Support', subtitle:'Answers to common questions, plus direct channels to reach university departments.' }) +
      '<div class="grid grid-side-main">' +
        '<div class="grid" style="gap:18px">' +
          UI.card({ title:'Quick Contacts', icon:'fa-headset',
            body:'<div class="list-simple">' +
              [['Academic Office','fa-building-columns','academics@university.edu','Mon - Fri, 09:00 - 17:00','blue'],
               ['Examination Section','fa-file-pen','exams@university.edu','Mon - Sat, 09:00 - 16:00','red'],
               ['Finance Office','fa-receipt','finance@university.edu','Mon - Fri, 10:00 - 16:00','green'],
               ['IT Support','fa-laptop-code','itsupport@university.edu','24 / 7 helpdesk','purple'],
               ['Central Library','fa-book','library@university.edu','Mon - Sat, 08:00 - 22:00','teal']
              ].map(function (c) {
                return '<div class="list-row"><span class="resource-ico badge-' + c[4] + '" style="width:38px;height:38px;font-size:14px;border-radius:11px"><i class="fas ' + c[1] + '"></i></span>' +
                  '<div class="list-row-main"><strong>' + c[0] + '</strong><span>' + c[2] + ' \u00b7 ' + c[3] + '</span></div>' +
                  '<button class="btn btn-outline btn-xs" data-contact="' + U.esc(c[0]) + '"><i class="fas fa-paper-plane"></i> Message</button></div>';
              }).join('') + '</div>' }) +
          UI.card({ title:'Frequently Asked Questions', icon:'fa-circle-question',
            body:'<div id="faq-list">' + FAQS.map(function (f, i) {
              return '<div class="notice-item" data-faq="' + i + '" style="cursor:pointer"><span class="notice-ico badge-blue"><i class="fas fa-question"></i></span>' +
                '<div class="notice-body"><div class="notice-title">' + U.esc(f.q) + '</div>' +
                '<div class="notice-desc faq-answer" style="display:none">' + U.esc(f.a) + '</div></div>' +
                '<i class="fas fa-chevron-down text-mute" style="font-size:11px"></i></div>';
            }).join('') + '</div>' }) +
        '</div>' +
        '<div class="grid" style="gap:18px">' +
          UI.card({ title:'Raise a Support Ticket', icon:'fa-ticket',
            body:'<div class="form-group"><label class="field-label">Issue Category</label>' +
              '<div class="input-wrap no-icon"><select id="tk-cat"><option>Academic</option><option>Examination</option><option>Finance</option><option>Technical</option><option>Library</option><option>Other</option></select></div></div>' +
              '<div class="form-group mt-12"><label class="field-label">Subject</label>' +
              '<div class="input-wrap no-icon"><input id="tk-subject" placeholder="Brief summary of the issue"></div></div>' +
              '<div class="form-group mt-12"><label class="field-label">Description</label>' +
              '<div class="input-wrap"><textarea id="tk-desc" placeholder="Describe the issue in detail..."></textarea></div></div>' +
              '<div class="form-actions"><button class="btn btn-primary btn-block" id="tk-submit"><i class="fas fa-paper-plane"></i> Submit Ticket</button></div>' }) +
          UI.card({ title:'Response Targets', icon:'fa-stopwatch',
            body:UI.meterList([
              { label:'Technical issues',  value:'4 hours',  percent:90, tone:'green' },
              { label:'Academic queries',  value:'1 day',    percent:70, tone:'' },
              { label:'Finance requests',  value:'2 days',   percent:55, tone:'yellow' },
              { label:'Transcript issue',  value:'3 days',   percent:40, tone:'red' }
            ]) }) +
        '</div>' +
      '</div>';

    var faqList = document.getElementById('faq-list');
    if (faqList) faqList.addEventListener('click', function (e) {
      var item = e.target.closest('[data-faq]');
      if (!item) return;
      var ans = item.querySelector('.faq-answer');
      var icon = item.querySelector('.fa-chevron-down, .fa-chevron-up');
      var open = ans.style.display !== 'none';
      ans.style.display = open ? 'none' : 'block';
      if (icon) icon.className = 'fas ' + (open ? 'fa-chevron-down' : 'fa-chevron-up') + ' text-mute';
    });

    U.qsa('[data-contact]').forEach(function (b) {
      b.addEventListener('click', function () {
        UI.toast('info', 'Message started', 'A new conversation with ' + b.getAttribute('data-contact') + ' has been drafted.');
        if (ctx.go) ctx.go('messages');
      });
    });

    var submit = document.getElementById('tk-submit');
    if (submit) submit.addEventListener('click', function () {
      var s = document.getElementById('tk-subject').value.trim();
      var d = document.getElementById('tk-desc').value.trim();
      if (!U.isRequired(s)) { UI.toast('error', 'Subject required', 'Please enter a subject for your ticket.'); return; }
      if (!U.minLen(d, 12)) { UI.toast('error', 'Description too short', 'Please describe the issue in at least 12 characters.'); return; }
      UI.toast('success', 'Ticket submitted', 'Reference #TK-' + Math.floor(100000 + Math.random() * 899999) + '. The support team will respond shortly.');
      document.getElementById('tk-subject').value = ''; document.getElementById('tk-desc').value = '';
    });
  }

  /* ========================== ANNOUNCEMENTS ========================== */
  function announcementsPage(host, ctx) {
    var list = global.SRMS_DATA.announcements || [];
    host.innerHTML =
      UI.pageHead({ title:'Announcements', subtitle:'Official circulars and updates published by university departments.',
        actions:'<button class="btn btn-outline" id="ann-filter"><i class="fas fa-filter"></i> Filter</button>' }) +
      '<div class="grid grid-2">' + list.map(function (a) {
        return '<article class="card card-hover"><div class="flex gap-12">' +
          '<span class="resource-ico badge-' + a.tone + '" style="width:44px;height:44px;font-size:17px;border-radius:13px"><i class="fas fa-tower-broadcast"></i></span>' +
          '<div style="flex:1;min-width:0"><h3 style="font-size:14.2px">' + U.esc(a.title) + '</h3>' +
          '<p class="text-soft text-sm mt-4" style="line-height:1.6">' + U.esc(a.body) + '</p>' +
          '<div class="notice-meta"><time><i class="fas fa-calendar"></i> ' + U.fmtDate(a.date) + '</time>' + UI.badge(a.by, 'gray') + '</div></div></div></article>';
      }).join('') + '</div>';

    var f = document.getElementById('ann-filter');
    if (f) f.addEventListener('click', function () {
      UI.modal({ title:'Filter Announcements', size:'sm',
        body:'<div class="form-group"><label class="field-label">Publisher</label>' +
          '<div class="input-wrap no-icon"><select id="af-by"><option value="">All publishers</option>' + U.unique(list.map(function (a) { return a.by; })).map(function (b) { return '<option>' + U.esc(b) + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group mt-12"><label class="field-label">From date</label>' +
          '<div class="input-wrap no-icon"><input type="date" id="af-from"></div></div>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="af-apply">Apply Filter</button>',
        onMount:function (m) { m.on('#af-apply', 'click', function () { m.close(); UI.toast('info', 'Filter applied', 'Announcement list updated.'); }); } });
    });
  }

  /* ====================== NOTIFICATION CENTER ====================== */
  function notificationCenter(host, ctx) {
    var all = global.SRMS_DATA.notifications || [];
    var cats = ['All','Results','Exams','Attendance','Assignments','Notices','Messages','System'];
    var active = 'All';

    function render() {
      var list = active === 'All' ? all : all.filter(function (n) { return n.category === active; });
      var body = document.getElementById('nc-body');
      if (!body) return;
      if (!list.length) { body.innerHTML = UI.emptyState({ icon:'fa-bell-slash', title:'No notifications', message:'There are no notifications in this category.' }); return; }
      body.innerHTML = '<div class="list-simple">' + list.map(function (n) {
        return '<div class="list-row" style="align-items:flex-start">' +
          '<span class="notif-ico badge-' + n.tone + '"><i class="fas ' + n.icon + '"></i></span>' +
          '<div class="list-row-main"><strong>' + U.esc(n.title) + (n.unread ? ' ' + UI.badge('New', 'blue') : '') + '</strong>' +
          '<span style="display:block;margin-top:3px;line-height:1.55">' + U.esc(n.text) + '</span>' +
          '<span class="text-xs text-mute" style="display:block;margin-top:6px"><i class="fas fa-clock"></i> ' + U.esc(n.time) + ' \u00b7 ' + U.esc(n.category) + '</span></div>' +
          '<button class="icon-action" data-nc-read="' + n.id + '" aria-label="Mark as read"><i class="fas fa-check"></i></button></div>';
      }).join('') + '</div>';
      var unread = all.filter(function (n) { return n.unread; }).length;
      global.SRMS_NAVBAR.setBadge('notifications-count', unread);
    }

    host.innerHTML =
      UI.pageHead({ title:'Notification Center', subtitle:'Every alert from results, exams, attendance and system events in one place.',
        actions:'<button class="btn btn-outline" id="nc-readall"><i class="fas fa-check-double"></i> Mark all as read</button>' +
                '<button class="btn btn-primary" id="nc-prefs"><i class="fas fa-sliders"></i> Preferences</button>' }) +
      '<div class="card">' +
        '<div class="tabs" id="nc-tabs" role="tablist">' + cats.map(function (c) {
          var count = c === 'All' ? all.length : all.filter(function (n) { return n.category === c; }).length;
          return '<button class="tab' + (c === active ? ' active' : '') + '" data-cat="' + c + '">' + c + '<span class="tab-count">' + count + '</span></button>';
        }).join('') + '</div>' +
        '<div id="nc-body"></div>' +
      '</div>';

    document.getElementById('nc-tabs').addEventListener('click', function (e) {
      var t = e.target.closest('.tab');
      if (!t) return;
      active = t.getAttribute('data-cat');
      U.qsa('#nc-tabs .tab').forEach(function (x) { x.classList.toggle('active', x === t); });
      render();
    });

    document.getElementById('nc-body').addEventListener('click', function (e) {
      var b = e.target.closest('[data-nc-read]');
      if (!b) return;
      var id = b.getAttribute('data-nc-read');
      all.forEach(function (n) { if (n.id === id) n.unread = false; });
      render();
      global.SRMS_NAVBAR.renderNotifications();
      UI.toast('success', 'Marked as read', 'Notification moved out of your unread list.');
    });

    document.getElementById('nc-readall').addEventListener('click', function () {
      all.forEach(function (n) { n.unread = false; });
      render();
      global.SRMS_NAVBAR.renderNotifications();
      UI.toast('success', 'All read', 'Your notification list is now clear.');
    });

    document.getElementById('nc-prefs').addEventListener('click', function () {
      UI.toast('info', 'Notification preferences', 'Redirecting to the settings page.');
      if (ctx.go) ctx.go('settings');
    });

    render();
  }

  /* ======================== ACADEMIC CALENDAR ======================== */
  var EVENT_META = {
    exam:     { label:'Examination',        color:'#EF4444', icon:'fa-file-pen' },
    deadline: { label:'Assignment Deadline',color:'#F59E0B', icon:'fa-clipboard-check' },
    holiday:  { label:'Holiday',            color:'#22C55E', icon:'fa-umbrella-beach' },
    semester: { label:'Semester Milestone', color:'#1677E8', icon:'fa-flag-checkered' },
    result:   { label:'Result Declaration', color:'#8B5CF6', icon:'fa-square-poll-vertical' }
  };

  function calendarPage(host, ctx) {
    var today = new Date();
    var view = { y: today.getFullYear(), m: today.getMonth(), selected: U.todayISO() };
    var events = (global.SRMS_DATA.calendarEvents || []).slice();

    host.innerHTML =
      UI.pageHead({ title:'Academic Calendar', subtitle:'Examinations, assignment deadlines, holidays, results and semester milestones at a glance.',
        actions:'<button class="btn btn-outline" id="cal-today"><i class="fas fa-calendar-day"></i> Today</button>' +
                '<button class="btn btn-primary" id="cal-export"><i class="fas fa-file-export"></i> Export ICS</button>' }) +
      '<div class="grid grid-main-side">' +
        '<div class="calendar">' +
          '<div class="calendar-head">' +
            '<div class="calendar-title"><i class="fas fa-calendar-days text-blue"></i> <span id="cal-title"></span></div>' +
            '<div class="calendar-nav">' +
              '<button class="btn btn-outline btn-sm" id="cal-prev" aria-label="Previous month"><i class="fas fa-chevron-left"></i></button>' +
              '<button class="btn btn-outline btn-sm" id="cal-next" aria-label="Next month"><i class="fas fa-chevron-right"></i></button>' +
            '</div>' +
          '</div>' +
          '<div class="calendar-grid" id="cal-dow"></div>' +
          '<div class="calendar-grid" id="cal-grid"></div>' +
          '<div class="cal-legend" id="cal-legend"></div>' +
        '</div>' +
        '<div class="grid" style="gap:18px">' +
          UI.card({ title:'Events', icon:'fa-list-check', actions:'<span class="badge badge-blue" id="cal-count"></span>',
            body:'<div class="cal-events" id="cal-events"></div>' }) +
          UI.card({ title:'Upcoming 30 Days', icon:'fa-hourglass-half', body:'<div id="cal-upcoming"></div>' }) +
        '</div>' +
      '</div>';

    var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    document.getElementById('cal-dow').innerHTML = DOWS.map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('');
    document.getElementById('cal-legend').innerHTML = Object.keys(EVENT_META).map(function (k) {
      return '<span class="legend-item"><span class="legend-swatch" style="background:' + EVENT_META[k].color + '"></span>' + EVENT_META[k].label + '</span>';
    }).join('');

    function dayKey(y, m, d) { return y + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d; }

    function eventsOn(key) { return events.filter(function (e) { return e.date === key; }); }

    function draw() {
      document.getElementById('cal-title').textContent = MONTHS[view.m] + ' ' + view.y;
      var first = new Date(view.y, view.m, 1).getDay();
      var daysIn = new Date(view.y, view.m + 1, 0).getDate();
      var prevDays = new Date(view.y, view.m, 0).getDate();
      var cells = [];

      for (var i = first - 1; i >= 0; i--) {
        var dn = prevDays - i;
        cells.push({ d:dn, muted:true, key:dayKey(view.m === 0 ? view.y - 1 : view.y, view.m === 0 ? 11 : view.m - 1, dn) });
      }
      for (var d = 1; d <= daysIn; d++) cells.push({ d:d, muted:false, key:dayKey(view.y, view.m, d) });
      var trail = (7 - (cells.length % 7)) % 7;
      for (var t = 1; t <= trail; t++) cells.push({ d:t, muted:true, key:dayKey(view.m === 11 ? view.y + 1 : view.y, view.m === 11 ? 0 : view.m + 1, t) });

      var tKey = U.todayISO();
      document.getElementById('cal-grid').innerHTML = cells.map(function (c) {
        var evs = eventsOn(c.key);
        var dots = evs.slice(0, 4).map(function (e) { return '<span class="cal-dot" style="background:' + (EVENT_META[e.type] || EVENT_META.exam).color + '"></span>'; }).join('');
        return '<button class="cal-day' + (c.muted ? ' muted' : '') + (c.key === tKey ? ' today' : '') + (c.key === view.selected ? ' selected' : '') + '" data-day="' + c.key + '" aria-label="' + c.key + '">' +
          '<span class="cal-num">' + c.d + '</span><span class="cal-dots">' + dots + '</span></button>';
      }).join('');

      drawEventList();
    }

    function drawEventList() {
      var list = eventsOn(view.selected).sort(function (a, b) { return a.date.localeCompare(b.date); });
      document.getElementById('cal-count').textContent = list.length + (list.length === 1 ? ' event' : ' events');
      var host2 = document.getElementById('cal-events');
      host2.innerHTML = list.length ? list.map(function (e) {
        var meta = EVENT_META[e.type] || EVENT_META.exam;
        return '<div class="cal-event"><span class="cal-event-bar" style="background:' + meta.color + '"></span>' +
          '<span class="notif-ico badge-blue" style="background:' + meta.color + '1A;color:' + meta.color + '"><i class="fas ' + meta.icon + '"></i></span>' +
          '<span class="cal-event-body"><strong>' + U.esc(e.title) + '</strong><span>' + U.esc(e.detail) + '</span></span>' +
          UI.badge(meta.label, 'gray') + '</div>';
      }).join('') : UI.emptyState({ small:true, icon:'fa-calendar-xmark', title:'No events', message:'Nothing scheduled on ' + U.fmtDate(view.selected) + '.' });
    }

    function drawUpcoming() {
      var cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 30);
      var list = events.filter(function (e) { return U.toDate(e.date) >= new Date(new Date().setHours(0,0,0,0)) && U.toDate(e.date) <= cutoff; })
        .sort(function (a, b) { return a.date.localeCompare(b.date); }).slice(0, 6);
      document.getElementById('cal-upcoming').innerHTML = list.length ? UI.timeline(list.map(function (e) {
        var meta = EVENT_META[e.type] || EVENT_META.exam;
        return { title:e.title, text:e.detail, time:U.fmtDate(e.date) + ' \u00b7 ' + meta.label, tone:e.type === 'exam' ? '' : e.type === 'deadline' ? 'yellow' : e.type === 'result' ? 'purple' : 'green' };
      })) : UI.emptyState({ small:true, icon:'fa-mug-hot', title:'All clear', message:'No events scheduled in the next 30 days.' });
    }

    document.getElementById('cal-grid').addEventListener('click', function (e) {
      var b = e.target.closest('[data-day]');
      if (!b) return;
      view.selected = b.getAttribute('data-day');
      draw();
    });
    document.getElementById('cal-prev').addEventListener('click', function () {
      view.m--; if (view.m < 0) { view.m = 11; view.y--; } draw();
    });
    document.getElementById('cal-next').addEventListener('click', function () {
      view.m++; if (view.m > 11) { view.m = 0; view.y++; } draw();
    });
    document.getElementById('cal-today').addEventListener('click', function () {
      var n = new Date(); view.y = n.getFullYear(); view.m = n.getMonth(); view.selected = U.todayISO(); draw();
      UI.toast('info', 'Jumped to today', U.fmtDateLong(n));
    });
    document.getElementById('cal-export').addEventListener('click', function () {
      var ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//SRMS//Academic Calendar//EN\r\n' +
        events.map(function (e) {
          var d = e.date.replace(/-/g, '');
          return 'BEGIN:VEVENT\r\nUID:' + e.date + '-' + U.slug(e.title) + '@srms\r\nDTSTART;VALUE=DATE:' + d + '\r\nSUMMARY:' + e.title.replace(/,/g, '\\,') + '\r\nDESCRIPTION:' + e.detail.replace(/,/g, '\\,') + '\r\nEND:VEVENT';
        }).join('\r\n') + '\r\nEND:VCALENDAR';
      U.download('srms-academic-calendar.ics', ics, 'text/calendar');
      UI.toast('success', 'Calendar exported', 'srms-academic-calendar.ics downloaded successfully.');
    });

    draw();
    drawUpcoming();
  }

  /* ---------------------------------------------------------- REGISTRATION */
  R.addShared('settings', { title:'Settings', crumbs:['Account','Settings'], render:settingsPage });
  R.addShared('help', { title:'Help & Support', crumbs:['Account','Help & Support'], render:helpPage });
  R.addShared('announcements', { title:'Announcements', crumbs:['Communication','Announcements'], render:announcementsPage });
  R.addShared('notifications-center', { title:'Notification Center', crumbs:['Account','Notifications'], render:notificationCenter });
  R.addShared('calendar', { title:'Academic Calendar', crumbs:['Academic','Academic Calendar'], render:calendarPage });

  global.SRMS_SHARED = { settingsPage:settingsPage, helpPage:helpPage, announcementsPage:announcementsPage, notificationCenter:notificationCenter, calendarPage:calendarPage, EVENT_META:EVENT_META };
})(window);
