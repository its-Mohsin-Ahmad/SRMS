/* =============================================================================
   SRMS - Exams Page  (js/pages/student/exams.js)
   Upcoming exams with live countdowns, completed exams, results and schedule.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  var ticker = null;

  function examTone(type) {
    return type === 'Final' ? 'red' : type === 'Midterm' ? 'blue' : type === 'Quiz' ? 'purple' : type === 'Practical' ? 'teal' : 'yellow';
  }

  function examsPage(host, ctx) {
    var D = global.SRMS_DATA;
    var all = D.exams || [];
    var upcoming = all.filter(function (e) { return e.status === 'Upcoming'; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    var completed = all.filter(function (e) { return e.status === 'Completed'; }).sort(function (a, b) { return b.date.localeCompare(a.date); });
    var avgMarks = completed.length ? Math.round(U.avg(completed, 'marks')) : 0;

    host.innerHTML =
      UI.pageHead({ title:'Examinations', subtitle:'Examination schedule, countdowns and published results for the current semester.',
        actions:'<button class="btn btn-outline" id="ex-download"><i class="fas fa-download"></i> Exam Schedule</button>' +
                '<button class="btn btn-outline" id="ex-admit"><i class="fas fa-id-card"></i> Admit Card</button>' +
                '<button class="btn btn-primary" id="ex-remind"><i class="fas fa-bell"></i> Set Reminders</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Upcoming Exams', value:upcoming.length, suffix:'exams', icon:'fa-hourglass-half', tone:'yellow', note:'Starting ' + (upcoming[0] ? U.fmtDate(upcoming[0].date) : '--') }) +
        UI.statCard({ title:'Completed Exams', value:completed.length, suffix:'exams', icon:'fa-circle-check', tone:'green', note:'Results published for all' }) +
        UI.statCard({ title:'Average Marks', value:avgMarks + '%', icon:'fa-chart-simple', tone:'blue', note:'Across completed exams' }) +
        UI.statCard({ title:'Best Subject', value:(completed.slice().sort(function (a, b) { return b.marks - a.marks; })[0] || {}).code || '--', icon:'fa-trophy', tone:'purple', note:'Highest score achieved' }) +
      '</div>' +

      (upcoming.length ? (function () {
        var n = upcoming[0];
        var cd = U.countdown(n.date);
        return '<div class="card-hero mb-16"><div class="hero-inner"><div class="hero-text">' +
          '<span class="badge badge-red"><i class="fas fa-circle-dot"></i> Next Examination</span>' +
          '<h2 class="hero-greet" style="margin-top:12px;font-size:22px">' + U.esc(n.course) + '</h2>' +
          '<p class="hero-sub">' + U.fmtDateLong(n.date) + ' at ' + U.esc(n.time) + ' \u00b7 ' + U.esc(n.room) + ' \u00b7 ' + U.esc(n.type) + ' examination</p>' +
          '<div class="hero-meta">' +
            '<span class="hero-chip"><i class="fas fa-id-badge"></i> ' + U.esc(n.code) + '</span>' +
            '<span class="hero-chip"><i class="fas fa-door-open"></i> ' + U.esc(n.room) + '</span>' +
            '<span class="hero-chip"><i class="fas fa-user-tie"></i> ' + U.esc(n.teacher) + '</span>' +
            '<span class="hero-chip"><i class="fas fa-clock"></i> Countdown: ' + U.esc(cd.text) + '</span>' +
          '</div></div>' +
          '<div class="hero-art" style="background:linear-gradient(150deg,#EF4444,#B91C1C)"><i class="fas fa-file-pen"></i></div></div></div>';
      })() : '') +

      UI.tabs('ex-tabs', [
        { key:'upcoming', label:'Upcoming Exams', icon:'fa-hourglass-half', count:upcoming.length, content:'<div id="ex-upcoming"></div>' },
        { key:'completed', label:'Completed Exams', icon:'fa-circle-check', count:completed.length, content:'<div id="ex-completed"></div>' },
        { key:'results', label:'Exam Results', icon:'fa-square-poll-vertical', content:'<div class="grid grid-side-main"><div id="ex-results"></div><div class="grid" style="gap:18px"><div class="card"><div class="card-head"><h3><i class="fas fa-chart-pie"></i> Grade Distribution</h3></div><div class="donut-wrap"><canvas id="ex-grade-donut" class="chart-h-240"></canvas></div></div>' +
          '<div class="card"><div class="card-head"><h3><i class="fas fa-chart-column"></i> Marks Comparison</h3></div><div class="chart-box chart-h-240"><canvas id="ex-marks-chart"></canvas></div></div></div></div>' },
        { key:'schedule', label:'Full Schedule', icon:'fa-calendar-days', content:'<div id="ex-schedule"></div>' }
      ]);

    /* ------------------------------------------------------ UPCOMING LIST */
    document.getElementById('ex-upcoming').innerHTML = upcoming.length ?
      '<div class="grid grid-2">' + upcoming.map(function (e) {
        var cd = U.countdown(e.date);
        return '<div class="card card-hover" data-exam="' + U.esc(e.id) + '"><div class="flex-between mb-12">' +
          '<span class="badge badge-' + examTone(e.type) + '">' + U.esc(e.type) + '</span>' +
          '<span class="badge badge-' + (cd.days <= 7 ? 'red' : cd.days <= 21 ? 'yellow' : 'gray') + '" data-countdown="' + U.esc(e.date) + '">' + U.esc(cd.text) + '</span></div>' +
          '<h3 style="font-size:15px">' + U.esc(e.course) + '</h3>' +
          '<p class="text-mute text-xs mt-4">' + U.esc(e.code) + ' \u00b7 ' + U.esc(e.teacher) + '</p>' +
          '<div class="resource-meta mt-12">' +
            '<div><span><i class="fas fa-calendar"></i> Date</span><strong>' + U.fmtDate(e.date) + '</strong></div>' +
            '<div><span><i class="fas fa-clock"></i> Time</span><strong>' + U.esc(e.time) + '</strong></div>' +
            '<div><span><i class="fas fa-door-open"></i> Venue</span><strong>' + U.esc(e.room) + '</strong></div>' +
            '<div><span><i class="fas fa-layer-group"></i> Section</span><strong>' + U.esc(e.section) + '</strong></div>' +
          '</div>' +
          '<div class="resource-foot"><button class="btn btn-outline btn-sm" data-exam-detail="' + U.esc(e.id) + '"><i class="fas fa-eye"></i> Details</button>' +
          '<button class="btn btn-ghost btn-sm" data-exam-prep="' + U.esc(e.code) + '"><i class="fas fa-book"></i> Preparation</button></div></div>';
      }).join('') + '</div>' : UI.emptyState({ icon:'fa-mug-hot', title:'No upcoming exams', message:'Your examination schedule will appear here once published.' });

    /* ----------------------------------------------------- COMPLETED LIST */
    document.getElementById('ex-completed').innerHTML = UI.table({
      columns:[
        { key:'course', label:'Course', render:function (e) { return '<span class="cell-strong">' + U.esc(e.course) + '</span><div class="cell-mute">' + U.esc(e.code) + '</div>'; } },
        { key:'type', label:'Exam Type', render:function (e) { return UI.badge(e.type, examTone(e.type)); } },
        { key:'date', label:'Date', render:function (e) { return U.fmtDate(e.date); } },
        { key:'marks', label:'Marks', className:'num', render:function (e) { return '<strong>' + e.marks + '</strong><span class="text-mute"> / ' + e.total + '</span>'; } },
        { key:'grade', label:'Grade', className:'center', render:function (e) { return UI.gradePill(e.grade); } },
        { key:'status', label:'Status', render:function (e) { return UI.statusBadge(e.status); } }
      ],
      rows:completed
    }) + UI.dataCards(completed, function (e) {
      return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(e.course) + '</strong>' + UI.gradePill(e.grade) + '</div>' +
        '<div class="data-card-grid"><div><div class="dc-label">Type</div><div class="dc-value">' + U.esc(e.type) + '</div></div>' +
        '<div><div class="dc-label">Date</div><div class="dc-value">' + U.fmtDate(e.date) + '</div></div>' +
        '<div><div class="dc-label">Marks</div><div class="dc-value">' + e.marks + ' / ' + e.total + '</div></div>' +
        '<div><div class="dc-label">Room</div><div class="dc-value">' + U.esc(e.room) + '</div></div></div>' + UI.statusBadge(e.status) + '</div>';
    });

    /* ------------------------------------------------------------ RESULTS */
    document.getElementById('ex-results').innerHTML = completed.length ? UI.table({
      columns:[
        { key:'course', label:'Course' },
        { key:'marks', label:'Marks', className:'num', render:function (e) { return e.marks + ' / ' + e.total; } },
        { key:'percentage', label:'Percentage', className:'num', render:function (e) { return U.fmtPct(Math.round((e.marks / e.total) * 100)); } },
        { key:'grade', label:'Grade', className:'center', render:function (e) { return UI.gradePill(e.grade); } }
      ],
      rows:completed
    }) : UI.emptyState({ small:true, icon:'fa-hourglass-half', title:'No published results', message:'Exam results appear here once published by the examination section.' });

    /* ----------------------------------------------------------- SCHEDULE */
    document.getElementById('ex-schedule').innerHTML = UI.table({
      columns:[
        { key:'code', label:'Course Code', render:function (e) { return '<span class="badge badge-blue">' + U.esc(e.code) + '</span>'; } },
        { key:'course', label:'Subject', render:function (e) { return '<span class="cell-strong">' + U.esc(e.course) + '</span>'; } },
        { key:'date', label:'Date', render:function (e) { return U.fmtDate(e.date); } },
        { key:'time', label:'Time' },
        { key:'room', label:'Room' },
        { key:'type', label:'Exam Type', render:function (e) { return UI.badge(e.type, examTone(e.type)); } },
        { key:'teacher', label:'Invigilator' },
        { key:'status', label:'Status', render:function (e) { return UI.statusBadge(e.status); } }
      ],
      rows: all.slice().sort(function (a, b) { return a.date.localeCompare(b.date); })
    }) + UI.dataCards(all, function (e) {
      return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(e.course) + '</strong>' + UI.statusBadge(e.status) + '</div>' +
        '<div class="data-card-grid"><div><div class="dc-label">Date</div><div class="dc-value">' + U.fmtDate(e.date) + '</div></div>' +
        '<div><div class="dc-label">Time</div><div class="dc-value">' + U.esc(e.time) + '</div></div>' +
        '<div><div class="dc-label">Room</div><div class="dc-value">' + U.esc(e.room) + '</div></div>' +
        '<div><div class="dc-label">Type</div><div class="dc-value">' + U.esc(e.type) + '</div></div></div></div>';
    });

    UI.bindTabs('ex-tabs', function (key) {
      if (key === 'results') refreshExamCharts();
    });

    /* ----------------------------------------------------------- COUNTDOWN */
    if (ticker) clearInterval(ticker);
    ticker = setInterval(function () {
      var nodes = U.qsa('[data-countdown]');
      if (!nodes.length) { clearInterval(ticker); ticker = null; return; }
      nodes.forEach(function (n) {
        var cd = U.countdown(n.getAttribute('data-countdown'));
        n.textContent = cd.text;
      });
    }, 60000);

    /* ------------------------------------------------------------- ACTIONS */
    document.getElementById('ex-download').addEventListener('click', function () {
      var rows = all.map(function (e) { return { Code:e.code, Course:e.course, Type:e.type, Date:e.date, Time:e.time, Room:e.room, Invigilator:e.teacher, Status:e.status }; });
      U.download('srms-exam-schedule.csv', U.toCSV(rows, ['Code','Course','Type','Date','Time','Room','Invigilator','Status']), 'text/csv');
      UI.toast('success', 'Schedule downloaded', 'srms-exam-schedule.csv saved successfully.');
    });

    document.getElementById('ex-admit').addEventListener('click', function () {
      var sp = D.studentProfile;
      UI.modal({ title:'Examination Admit Card', subtitle:'Print or save this card and bring it to every examination.', size:'lg',
        body:'<div class="card"><div class="flex-between mb-16"><div class="flex gap-12"><span class="sidebar-logo"><i class="fas fa-graduation-cap"></i></span>' +
          '<div><h3 style="letter-spacing:.1em">SRMS</h3><p class="text-mute text-xs">Student Result Management System</p></div></div>' +
          '<div class="text-right"><strong class="badge badge-blue">Fall 2026</strong><p class="text-mute text-xs mt-4">Examination Section</p></div></div>' +
          '<div class="divider"></div>' +
          '<div class="flex gap-16">' + UI.avatar(sp.fullName, 'lg') + '<dl class="info-grid" style="flex:1">' +
            '<div class="info-item"><dt>Student Name</dt><dd>' + U.esc(sp.fullName) + '</dd></div>' +
            '<div class="info-item"><dt>Student ID</dt><dd>' + U.esc(sp.id) + '</dd></div>' +
            '<div class="info-item"><dt>Program</dt><dd>' + U.esc(sp.program) + '</dd></div>' +
            '<div class="info-item"><dt>Semester</dt><dd>' + U.esc(sp.semesterLabel) + '</dd></div>' +
          '</dl></div>' +
          '<div class="divider"></div>' +
          '<p class="text-soft text-sm">Admit card verified for ' + upcoming.length + ' scheduled examinations. Minimum 75 percent attendance is required in each course.</p></div>',
        footer:'<button class="btn btn-outline" data-modal-close>Close</button><button class="btn btn-primary" id="admit-print"><i class="fas fa-print"></i> Print Admit Card</button>',
        onMount:function (m) { m.on('#admit-print', 'click', function () { m.close(); UI.toast('success', 'Admit card ready', 'The admit card has been prepared for printing.'); setTimeout(function () { window.print(); }, 400); }); }
      });
    });

    document.getElementById('ex-remind').addEventListener('click', function () {
      UI.toast('success', 'Reminders set', 'You will receive notifications 3 days before each examination.');
    });
  }

  function refreshExamCharts() {
    var D = global.SRMS_DATA;
    var completed = (D.exams || []).filter(function (e) { return e.status === 'Completed'; });
    var dist = U.groupBy(completed, 'grade');
    var colors = { 'A+':'#22C55E', 'A':'#16A34A', 'B+':'#1677E8', 'B':'#3B82F6', 'C+':'#F59E0B', 'C':'#D97706', 'D':'#8B5CF6', 'F':'#EF4444' };
    C.donut('ex-grade-donut', { cutout:'70%', legend:true, unit:' exams',
      data: Object.keys(dist).map(function (k) { return { label:k, value:dist[k].length, color:colors[k] || '#94A3B8' }; }) });

    C.bar('ex-marks-chart', {
      labels: completed.map(function (e) { return e.code; }),
      legend:false, max:100, unit:'%',
      datasets:[{ label:'Marks', data:completed.map(function (e) { return e.marks; }),
        colors: completed.map(function (e) { return e.marks >= 85 ? '#22C55E' : e.marks >= 75 ? '#1677E8' : e.marks >= 60 ? '#F59E0B' : '#EF4444'; }) }]
    });
  }

  R.add('exams', 'student', { title:'Examinations', crumbs:['Academic','Exams'], render:examsPage, afterRender:refreshExamCharts });
})(window);
