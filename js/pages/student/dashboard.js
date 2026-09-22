/* =============================================================================
   SRMS - Student Dashboard  (js/pages/student/dashboard.js)
   Hero, statistic cards, recent results, notice board, quick access and the
   performance / CGPA / attendance visualisations.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  var CATEGORY_ICON = {
    Examination:'fa-file-pen', Results:'fa-square-poll-vertical', Academic:'fa-graduation-cap',
    Library:'fa-book', Scholarship:'fa-hand-holding-dollar', General:'fa-calendar-day', Events:'fa-trophy'
  };
  var CATEGORY_TONE = {
    Examination:'red', Results:'red', Academic:'blue', Library:'purple', Scholarship:'green', General:'yellow', Events:'teal'
  };

  function studentDashboard(host, ctx) {
    var D = global.SRMS_DATA;
    var sp = D.studentProfile;
    var A = D.analytics || {};
    var perf = A.studentPerformance || { overall:0, breakdown:[] };

    var enrolled = (D.courses || []).filter(function (c) { return c.semester === sp.semester; }).length;
    var examsDone = (D.exams || []).filter(function (e) { return e.status === 'Completed'; }).length;
    var pendingAssignments = (D.assignments || []).filter(function (a) { return a.status === 'Pending'; }).length;
    var noticeCount = (D.notices || []).filter(function (n) { return n.unread; }).length;
    var notices = (D.notices || []).slice(0, 4);
    var semGpa = (D.cgpaTrend && D.cgpaTrend.gpa) ? D.cgpaTrend.gpa[D.cgpaTrend.gpa.length - 1] : sp.cgpa;

    host.innerHTML =
      /* ------------------------------------------------------------- HERO */
      '<section class="card-hero mb-16">' +
        '<div class="hero-inner">' +
          '<div class="hero-text">' +
            '<h2 class="hero-greet">' + U.greeting() + ', ' + U.esc(sp.fullName.split(' ')[0]) + ' <span class="wave">\ud83d\udc4b</span></h2>' +
            '<p class="hero-sub">Stay updated with your academic journey. Here is a snapshot of your performance for the ' + U.esc(sp.semesterLabel) + ' of ' + U.esc(sp.program) + '.</p>' +
            '<div class="hero-meta">' +
              '<span class="hero-chip"><i class="fas fa-id-badge"></i> ' + U.esc(sp.id) + '</span>' +
              '<span class="hero-chip"><i class="fas fa-building-columns"></i> ' + U.esc(sp.department) + '</span>' +
              '<span class="hero-chip"><i class="fas fa-layer-group"></i> Section ' + U.esc(sp.section) + ' \u00b7 Batch ' + U.esc(sp.batch) + '</span>' +
              '<span class="hero-chip"><i class="fas fa-user-tie"></i> Advisor: ' + U.esc(sp.advisor) + '</span>' +
            '</div>' +
            '<div class="hero-actions">' +
              '<button class="btn btn-primary" data-go="results"><i class="fas fa-chart-line"></i> View Results</button>' +
              '<button class="btn btn-outline" data-go="timetable"><i class="fas fa-calendar-week"></i> Class Timetable</button>' +
              '<button class="btn btn-outline" data-go="downloads"><i class="fas fa-download"></i> Result Card</button>' +
            '</div>' +
          '</div>' +
          '<div class="hero-art" aria-hidden="true"><i class="fas fa-graduation-cap"></i></div>' +
        '</div>' +
      '</section>' +

      /* -------------------------------------------------------- STAT CARDS */
      '<div class="grid grid-stats mb-16">' +
        UI.statCard({ title:'Current CGPA', value:U.fmtGpa(sp.cgpa), suffix:'/ 4.00', icon:'fa-award', tone:'blue',
          note:'Semester GPA ' + U.fmtGpa(semGpa), trend:{ dir:'up', value:'+0.15' } }) +
        UI.statCard({ title:'Courses Enrolled', value:enrolled, suffix:'courses', icon:'fa-book-open', tone:'purple',
          note:'18 credit hours this semester', trend:{ dir:'flat', value:'Stable' } }) +
        UI.statCard({ title:'Exams Completed', value:examsDone, suffix:'exams', icon:'fa-file-pen', tone:'green',
          note:'6 final exams upcoming', trend:{ dir:'up', value:'On track' } }) +
        UI.statCard({ title:'Overall Rank', value:'<span>' + sp.rank + '</span> <small>/ ' + sp.totalStudentsInBatch + '</small>', icon:'fa-ranking-star', tone:'yellow',
          note:'Top ' + Math.round((sp.rank / sp.totalStudentsInBatch) * 100) + '% of the batch', trend:{ dir:'up', value:'\u2191 3' } }) +
        UI.statCard({ title:'Attendance', value:U.fmtPct(sp.attendanceOverall), icon:'fa-user-check', tone:'teal',
          note:'Required minimum is 75%', trend:{ dir: sp.attendanceOverall >= 75 ? 'up' : 'down', value: sp.attendanceOverall >= 75 ? 'Safe' : 'At risk' } }) +
        UI.statCard({ title:'Credits Completed', value:'<span>' + sp.creditsCompleted + '</span> <small>/ ' + sp.totalCredits + '</small>', icon:'fa-certificate', tone:'pink',
          note:Math.round((sp.creditsCompleted / sp.totalCredits) * 100) + '% of the degree completed', trend:{ dir:'up', value:'+18' } }) +
      '</div>' +

      /* ---------------------------------------------- RESULTS + NOTICES */
      '<div class="grid grid-main-side mb-16">' +
        '<div class="card card-flush">' +
          '<div class="card-head" style="padding:20px 20px 0;margin-bottom:14px">' +
            '<div><h3><i class="fas fa-chart-line"></i> Recent Results</h3><p>Your most recent assessments across all active courses.</p></div>' +
            '<div class="card-head-actions"><button class="btn btn-ghost btn-sm" data-go="results">View All Results <i class="fas fa-arrow-right"></i></button></div>' +
          '</div>' +
          '<div style="padding:0 20px 20px" id="recent-results-table"></div>' +
        '</div>' +
        '<div class="card card-flush">' +
          '<div class="card-head" style="padding:20px 20px 0;margin-bottom:14px">' +
            '<div><h3><i class="fas fa-bullhorn"></i> Notice Board</h3><p>Latest circulars from the university.</p></div>' +
            '<div class="card-head-actions"><button class="btn btn-ghost btn-sm" data-go="notices">View All' + (noticeCount ? ' <span class="badge badge-red">' + noticeCount + '</span>' : '') + '</button></div>' +
          '</div>' +
          '<div style="padding:0 20px 20px">' + notices.map(function (n) {
            var tone = CATEGORY_TONE[n.category] || 'blue';
            var icon = CATEGORY_ICON[n.category] || 'fa-bullhorn';
            return '<button class="notice-item' + (n.unread ? ' unread' : '') + '" data-go="notices">' +
              '<span class="notice-ico badge-' + tone + '"><i class="fas ' + icon + '"></i></span>' +
              '<span class="notice-body"><span class="notice-title">' + U.esc(n.title) + '</span>' +
              '<span class="notice-desc">' + U.esc(n.description) + '</span>' +
              '<span class="notice-meta"><time><i class="fas fa-calendar"></i> ' + U.fmtDate(n.date) + '</time>' + UI.badge(n.category, 'gray') + (n.pinned ? UI.badge('Pinned', 'blue', 'fa-thumbtack') : '') + '</span></span></button>';
          }).join('') + '</div>' +
        '</div>' +
      '</div>';

    /* ------------------------------------- PERFORMANCE / CGPA / ATTENDANCE */
    var perfBlock = document.createElement('div');
    perfBlock.className = 'grid grid-3 mb-16';
    perfBlock.innerHTML =
      UI.card({ title:'Performance Overview', icon:'fa-chart-pie', subtitle:'Grade distribution across your cohort',
        body:'<div class="donut-wrap"><canvas id="chart-student-perf" class="chart-h-240"></canvas>' +
          '<div class="donut-center"><strong>' + U.fmtPct(perf.overall) + '</strong><span>Overall</span></div></div>' +
          UI.legendRows((perf.breakdown || []).map(function (b) { return { label:b.label, value:b.value, color:b.color, count:b.count }; })) }) +
      UI.card({ title:'CGPA Progression', icon:'fa-arrow-trend-up', subtitle:'Semester GPA versus cumulative GPA',
        body:'<div class="chart-box chart-h-240"><canvas id="chart-cgpa-trend"></canvas></div>' +
          UI.kpiStrip([
            { label:'Best Semester', value:U.fmtGpa(Math.max.apply(null, (D.cgpaTrend && D.cgpaTrend.gpa) || [sp.cgpa])) },
            { label:'Cumulative', value:U.fmtGpa(sp.cgpa), color:'#1557B0' },
            { label:'Credits Done', value:sp.creditsCompleted + '/' + sp.totalCredits }
          ]) }) +
      UI.card({ title:'Attendance Snapshot', icon:'fa-user-check', subtitle:'Presence across active courses',
        body:'<div class="chart-box chart-h-240"><canvas id="chart-attendance-mini"></canvas></div>' +
          '<div class="alert alert-' + (sp.attendanceOverall >= 75 ? 'success' : 'warning') + ' mt-16">' +
            '<i class="fas ' + (sp.attendanceOverall >= 75 ? 'fa-circle-check' : 'fa-triangle-exclamation') + ' alert-ico"></i>' +
            '<div class="alert-body">' + (sp.attendanceOverall >= 75 ? 'Your attendance meets the university requirement. Keep it up.' : 'Your attendance is below the 75 percent requirement. Attend upcoming classes to stay exam eligible.') + '</div></div>' });
    host.appendChild(perfBlock);

    /* ----------------------------------------------------- QUICK ACCESS */
    var quickBlock = document.createElement('div');
    quickBlock.className = 'card mb-16';
    quickBlock.innerHTML =
      '<div class="card-head"><div><h3><i class="fas fa-bolt"></i> Quick Access</h3><p>Jump straight to the sections you use most.</p></div></div>' +
      '<div class="quick-grid">' + [
        ['My Results','fa-chart-line','blue','results','Open results'],
        ['My Courses','fa-book-open','purple','courses',enrolled + ' enrolled'],
        ['Timetable','fa-calendar-week','teal','timetable','Weekly plan'],
        ['Attendance','fa-user-check','green','attendance',U.fmtPct(sp.attendanceOverall)],
        ['Downloads','fa-download','yellow','downloads','10 files'],
        ['Feedback','fa-comment','pink','feedback','Share view'],
        ['Assignments','fa-clipboard-check','blue','assignments',pendingAssignments + ' pending'],
        ['Library','fa-book','purple','library','10 titles']
      ].map(function (q) {
        return '<button class="quick-item" data-go="' + q[3] + '">' +
          '<span class="quick-ico badge-' + q[2] + '" style="border-radius:14px"><i class="fas ' + q[1] + '"></i></span>' +
          '<span class="quick-label">' + q[0] + '</span><small>' + q[4] + '</small></button>';
      }).join('') + '</div>';
    host.appendChild(quickBlock);

    /* -------------------------------------------- DEADLINES + EXAMS */
    var lower = document.createElement('div');
    lower.className = 'grid grid-2';
    lower.innerHTML =
      UI.card({ title:'Upcoming Deadlines', icon:'fa-clock', subtitle:'Assignments and submissions due soon',
        body:'<div id="deadline-list"></div>' }) +
      UI.card({ title:'Next Examinations', icon:'fa-file-pen', subtitle:'Final examination schedule for this semester',
        body:'<div id="exam-list"></div>' });
    host.appendChild(lower);

    /* -------------------------------------------------- RESULTS TABLE */
    var rCols = [
      { key:'subject', label:'Subject', render:function (r) { return '<span class="cell-strong">' + U.esc(r.subject) + '</span>'; } },
      { key:'code', label:'Course Code', render:function (r) { return '<span class="badge badge-blue">' + U.esc(r.code) + '</span>'; } },
      { key:'examType', label:'Exam Type' },
      { key:'grade', label:'Grade', className:'center', render:function (r) { return UI.gradePill(r.grade); } },
      { key:'marks', label:'Marks', className:'num', render:function (r) { return '<strong>' + r.marks + '</strong><span class="text-mute"> / ' + r.total + '</span>'; } },
      { key:'percentage', label:'Percentage', className:'num', render:function (r) { return U.fmtPct(r.percentage); } },
      { key:'date', label:'Date', render:function (r) { return '<span class="cell-mute">' + U.fmtDate(r.date) + '</span>'; } },
      { key:'status', label:'Status', render:function (r) { return UI.statusBadge(r.status); } }
    ];
    var recent = (D.recentResults || []).slice(0, 5);
    document.getElementById('recent-results-table').innerHTML =
      UI.table({ columns:rCols, rows:recent }) +
      UI.dataCards(recent, function (r) {
        return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(r.subject) + '</strong>' + UI.gradePill(r.grade) + '</div>' +
          '<div class="data-card-grid"><div><div class="dc-label">Code</div><div class="dc-value">' + U.esc(r.code) + '</div></div>' +
          '<div><div class="dc-label">Exam</div><div class="dc-value">' + U.esc(r.examType) + '</div></div>' +
          '<div><div class="dc-label">Marks</div><div class="dc-value">' + r.marks + ' / ' + r.total + ' (' + r.percentage + '%)</div></div>' +
          '<div><div class="dc-label">Date</div><div class="dc-value">' + U.fmtDate(r.date) + '</div></div></div>' +
          '<div class="flex-between">' + UI.statusBadge(r.status) + '<span class="text-xs text-mute">' + U.esc(r.course || r.subject) + '</span></div></div>';
      });

    /* ------------------------------------------------------- DEADLINES */
    var due = (D.assignments || []).filter(function (a) { return a.status === 'Pending'; })
      .sort(function (a, b) { return a.due.localeCompare(b.due); }).slice(0, 4);
    document.getElementById('deadline-list').innerHTML = due.length ? due.map(function (a) {
      var cd = U.countdown(a.due);
      var tone = cd.days <= 3 ? 'red' : cd.days <= 7 ? 'yellow' : 'blue';
      return '<div class="list-row"><span class="resource-ico badge-' + tone + '" style="width:40px;height:40px;font-size:15px;border-radius:12px"><i class="fas fa-clipboard-check"></i></span>' +
        '<div class="list-row-main"><strong>' + U.esc(a.title) + '</strong><span>' + U.esc(a.course) + ' \u00b7 due ' + U.fmtDate(a.due) + '</span></div>' +
        '<span class="badge badge-' + tone + '">' + U.esc(cd.text) + '</span></div>';
    }).join('') : UI.emptyState({ small:true, icon:'fa-circle-check', title:'All caught up', message:'No pending assignment submissions.' });

    /* ----------------------------------------------------------- EXAMS */
    var nxt = (D.exams || []).filter(function (e) { return e.status === 'Upcoming'; })
      .sort(function (a, b) { return a.date.localeCompare(b.date); }).slice(0, 4);
    document.getElementById('exam-list').innerHTML = nxt.length ? nxt.map(function (e) {
      var cd = U.countdown(e.date);
      var tone = cd.days <= 7 ? 'red' : 'yellow';
      return '<div class="list-row"><span class="resource-ico badge-red" style="width:40px;height:40px;font-size:15px;border-radius:12px"><i class="fas fa-file-pen"></i></span>' +
        '<div class="list-row-main"><strong>' + U.esc(e.course) + '</strong><span>' + U.fmtDate(e.date) + ' \u00b7 ' + U.esc(e.time) + ' \u00b7 ' + U.esc(e.room) + '</span></div>' +
        '<span class="badge badge-' + tone + '">' + U.esc(cd.text) + '</span></div>';
    }).join('') : UI.emptyState({ small:true, icon:'fa-mug-hot', title:'No upcoming exams', message:'Your examination schedule will appear here.' });

    /* ----------------------------------------------------- INTERACTION */
    host.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]');
      if (g && ctx.go) ctx.go(g.getAttribute('data-go'));
    });
  }

  /* ------------------------------------------------------- AFTER RENDER */
  function afterStudentDashboard(ctx) {
    var D = global.SRMS_DATA;
    var A = D.analytics || {};
    var perf = A.studentPerformance || { breakdown:[] };

    C.donut('chart-student-perf', { data:perf.breakdown || [], cutout:'72%', legend:false });

    var tr = D.cgpaTrend || { labels:[], gpa:[], cgpa:[] };
    C.line('chart-cgpa-trend', {
      labels:tr.labels, legend:true, min:2.5, max:4,
      datasets:[
        { label:'Semester GPA', data:tr.gpa,  color:'#1677E8' },
        { label:'CGPA',        data:tr.cgpa, color:'#8B5CF6', fill:false }
      ]
    });

    var sa = (D.subjectAttendance || []).slice(0, 6);
    C.bar('chart-attendance-mini', {
      labels: sa.map(function (s) { return s.code; }),
      legend:false, max:100, unit:'%',
      datasets:[{ label:'Attendance', data:sa.map(function (s) { return s.percentage; }),
        colors: sa.map(function (s) { return s.percentage >= 90 ? '#22C55E' : s.percentage >= 80 ? '#1677E8' : s.percentage >= 75 ? '#F59E0B' : '#EF4444'; }) }]
    });
  }

  R.add('dashboard', 'student', {
    title:'Dashboard', crumbs:['Main','Dashboard'],
    render:studentDashboard, afterRender:afterStudentDashboard
  });
})(window);
