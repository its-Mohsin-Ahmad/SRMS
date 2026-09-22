/* =============================================================================
   SRMS - Results Page  (js/pages/student/results.js)
   Semester selector, full marks sheet, GPA / CGPA computation, CGPA progress
   visualisation plus downloadable and printable result card.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  var state = { semester:null, q:'' };

  function semResults() {
    var D = global.SRMS_DATA;
    var all = D.semesterResults || [];
    if (!state.semester) state.semester = all.length ? all[0].semester : 5;
    return all.filter(function (s) { return s.semester === state.semester; })[0] || all[0] || { courses:[], gpa:0, credits:0, label:'--' };
  }

  function overallStats() {
    var D = global.SRMS_DATA;
    var sp = D.studentProfile;
    var all = D.semesterResults || [];
    var completed = all.filter(function (s) { return s.status === 'Completed'; });
    var credits = U.sum(all, function (s) { return U.sum(s.courses, 'credits'); });
    var completedCredits = U.sum(completed, function (s) { return U.sum(s.courses, 'credits'); });
    var points = 0, creditSum = 0;
    all.forEach(function (s) {
      s.courses.forEach(function (c) { points += c.gp * c.credits; creditSum += c.credits; });
    });
    return {
      cgpa: creditSum ? points / creditSum : sp.cgpa,
      credits: credits,
      completedCredits: completedCredits,
      totalCredits: sp.totalCredits,
      semesters: all.length,
      bestGpa: all.length ? Math.max.apply(null, all.map(function (s) { return s.gpa; })) : 0
    };
  }

  function resultsPage(host, ctx) {
    var D = global.SRMS_DATA;
    var sp = D.studentProfile;
    var stats = overallStats();
    var sem = semResults();

    host.innerHTML =
      UI.pageHead({ title:'Academic Results', subtitle:'Semester-wise marks, grades and GPA progression with downloadable result card.',
        actions:'<button class="btn btn-outline" id="rs-print"><i class="fas fa-print"></i> Print Result</button>' +
                '<button class="btn btn-outline" id="rs-pdf"><i class="fas fa-file-pdf"></i> PDF Download</button>' +
                '<button class="btn btn-primary" id="rs-card"><i class="fas fa-download"></i> Result Card</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Semester GPA', value:U.fmtGpa(sem.gpa), suffix:'/ 4.00', icon:'fa-chart-line', tone:'blue', note:sem.label + ' \u00b7 ' + sem.status }) +
        UI.statCard({ title:'Overall CGPA', value:U.fmtGpa(stats.cgpa), suffix:'/ 4.00', icon:'fa-award', tone:'purple', note:'Across ' + stats.semesters + ' semesters', trend:{ dir:'up', value:'+0.15' } }) +
        UI.statCard({ title:'Total Credits', value:stats.credits, suffix:'credits', icon:'fa-clock', tone:'teal', note:stats.totalCredits + ' required for the degree' }) +
        UI.statCard({ title:'Completed Credits', value:stats.completedCredits, suffix:'credits', icon:'fa-certificate', tone:'green', note:Math.round((stats.completedCredits / stats.totalCredits) * 100) + '% of the degree' }) +
      '</div>' +

      '<div class="grid grid-main-side mb-16">' +
        '<div class="card card-flush">' +
          '<div class="table-toolbar" style="padding:18px 20px 0">' +
            '<div class="table-tools">' +
              UI.selectBox('rs-semester', (D.semesterResults || []).map(function (s) { return { value:s.semester, label:s.label + (s.status === 'In Progress' ? ' (In Progress)' : '') }; }), state.semester, 'Select semester') +
              UI.searchBox('rs-search', 'Search course or code...', state.q) +
            '</div>' +
            '<div class="card-head-actions"><span class="badge badge-blue">Grade Point Scale: 4.00</span></div>' +
          '</div>' +
          '<div style="padding:18px 20px 20px" id="rs-table"></div>' +
        '</div>' +

        '<div class="grid" style="gap:18px">' +
          UI.card({ title:'Semester Summary', icon:'fa-clipboard-list',
            body:'<div class="donut-wrap"><canvas id="rs-gpa-donut" class="chart-h-240"></canvas>' +
              '<div class="donut-center"><strong>' + U.fmtGpa(sem.gpa) + '</strong><span>Semester GPA</span></div></div>' +
              UI.kpiStrip([
                { label:'Courses', value:sem.courses.length },
                { label:'Credits', value:U.sum(sem.courses, 'credits') },
                { label:'Highest', value:Math.max.apply(null, sem.courses.map(function (c) { return c.marks; }).concat([0])) },
                { label:'Lowest', value:Math.min.apply(null, sem.courses.map(function (c) { return c.marks; }).concat([100])) }
              ]) }) +
          UI.card({ title:'CGPA Progression', icon:'fa-arrow-trend-up',
            body:'<div class="chart-box chart-h-240"><canvas id="rs-cgpa-chart"></canvas></div>' }) +
        '</div>' +
      '</div>' +

      UI.card({ title:'Semester-wise Performance', icon:'fa-table-list', subtitle:'GPA, credits and standing across every semester', className:'mb-16',
        body:'<div class="table-wrap"><table class="table"><thead><tr><th>Semester</th><th>Status</th><th>Courses</th><th>Credits</th><th>GPA</th><th>Standing</th><th></th></tr></thead><tbody>' +
          (D.semesterResults || []).map(function (s) {
            var tone = s.gpa >= 3.5 ? 'green' : s.gpa >= 3.0 ? 'blue' : s.gpa >= 2.5 ? 'yellow' : 'red';
            var standing = s.gpa >= 3.5 ? 'Excellent' : s.gpa >= 3.0 ? 'Good' : s.gpa >= 2.5 ? 'Satisfactory' : 'Needs Improvement';
            return '<tr' + (s.semester === state.semester ? ' style="background:#F8FBFF"' : '') + '><td class="cell-strong">' + s.label + '</td>' +
              '<td>' + UI.statusBadge(s.status) + '</td><td>' + s.courses.length + '</td><td>' + U.sum(s.courses, 'credits') + '</td>' +
              '<td><strong>' + U.fmtGpa(s.gpa) + '</strong></td><td>' + UI.badge(standing, tone) + '</td>' +
              '<td><button class="btn btn-ghost btn-xs" data-sem="' + s.semester + '"><i class="fas fa-eye"></i> View</button></td></tr>';
          }).join('') + '</tbody></table></div>' +
          UI.dataCards(D.semesterResults || [], function (s) {
            return '<div class="data-card"><div class="data-card-head"><strong>' + s.label + '</strong>' + UI.statusBadge(s.status) + '</div>' +
              '<div class="data-card-grid"><div><div class="dc-label">GPA</div><div class="dc-value">' + U.fmtGpa(s.gpa) + '</div></div>' +
              '<div><div class="dc-label">Credits</div><div class="dc-value">' + U.sum(s.courses, 'credits') + '</div></div>' +
              '<div><div class="dc-label">Courses</div><div class="dc-value">' + s.courses.length + '</div></div>' +
              '<div><div class="dc-label">Semester</div><div class="dc-value">#' + s.semester + '</div></div></div></div>';
          }) }) +

      UI.card({ title:'Grade Scale Reference', icon:'fa-scale-balanced',
        body:'<div class="table-wrap"><table class="table table-compact"><thead><tr><th>Percentage</th><th>Grade</th><th>Grade Point</th><th>Remarks</th></tr></thead><tbody>' +
          [['90 - 100','A+','4.00','Outstanding'],['85 - 89','A','4.00','Excellent'],['80 - 84','A-','3.67','Very Good'],
           ['75 - 79','B+','3.33','Good'],['70 - 74','B','3.00','Above Average'],['65 - 69','B-','2.67','Average'],
           ['60 - 64','C+','2.33','Below Average'],['55 - 59','C','2.00','Pass'],['50 - 54','D','1.00','Marginal Pass'],['Below 50','F','0.00','Fail']]
            .map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + UI.gradePill(r[1]) + '</td><td><strong>' + r[2] + '</strong></td><td class="cell-mute">' + r[3] + '</td></tr>'; }).join('') +
        '</tbody></table></div>' });

    /* -------------------------------------------------------- MARKS SHEET */
    function renderTable() {
      var sem2 = semResults();
      var host2 = document.getElementById('rs-table');
      var rows = sem2.courses.filter(function (c) {
        if (!state.q) return true;
        var q = state.q.toLowerCase();
        return (c.name + ' ' + c.code).toLowerCase().indexOf(q) > -1;
      });

      if (!rows.length) {
        host2.innerHTML = UI.emptyState({ small:true, icon:'fa-file-circle-xmark', title:'No results found', message:'No courses match the current search in this semester.' });
        return;
      }

      var cols = [
        { key:'name', label:'Course', render:function (c) { return '<span class="cell-strong">' + U.esc(c.name) + '</span><div class="cell-mute">' + U.esc(c.code) + '</div>'; } },
        { key:'credits', label:'Credit Hours', className:'center' },
        { key:'marks', label:'Marks', className:'num', render:function (c) { return '<strong>' + c.marks + '</strong><span class="text-mute"> / ' + c.total + '</span>'; } },
        { key:'grade', label:'Grade', className:'center', render:function (c) { return UI.gradePill(c.grade); } },
        { key:'gp', label:'Grade Point', className:'num', render:function (c) { return c.gp.toFixed(2); } },
        { key:'status', label:'Status', render:function (c) { return UI.statusBadge(c.status); } }
      ];

      var weighted = U.sum(rows, function (c) { return c.gp * c.credits; });
      var credits = U.sum(rows, 'credits');
      var gpa = credits ? weighted / credits : 0;

      var foot = '<tr style="background:#F8FBFF;font-weight:700"><td>Total</td><td class="center">' + credits + '</td><td class="num">' + U.sum(rows, 'marks') + ' / ' + U.sum(rows, 'total') + '</td>' +
        '<td class="center">--</td><td class="num">' + gpa.toFixed(2) + '</td><td>GPA ' + U.fmtGpa(gpa) + '</td></tr>';

      var tableHtml = '<div class="table-wrap"><table class="table"><thead><tr>' + cols.map(function (c) { return '<th>' + c.label + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (c) { return '<tr>' + cols.map(function (col) { return '<td class="' + (col.className || '') + '">' + (col.render ? col.render(c) : U.esc(c[col.key])) + '</td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody><tfoot>' + foot + '</tfoot></table></div>';

      var cardsHtml = UI.dataCards(rows, function (c) {
        return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(c.name) + '</strong>' + UI.gradePill(c.grade) + '</div>' +
          '<div class="data-card-grid"><div><div class="dc-label">Code</div><div class="dc-value">' + U.esc(c.code) + '</div></div>' +
          '<div><div class="dc-label">Credits</div><div class="dc-value">' + c.credits + '</div></div>' +
          '<div><div class="dc-label">Marks</div><div class="dc-value">' + c.marks + ' / ' + c.total + '</div></div>' +
          '<div><div class="dc-label">Grade Point</div><div class="dc-value">' + c.gp.toFixed(2) + '</div></div></div>' +
          '<div class="flex-between">' + UI.statusBadge(c.status) + '<strong class="badge badge-blue">GPA ' + U.fmtGpa(gpa) + '</strong></div></div>';
      });

      host2.innerHTML = tableHtml + cardsHtml;
    }

    /* ------------------------------------------------------------- WIRING */
    document.getElementById('rs-semester').addEventListener('change', function () {
      state.semester = Number(this.value);
      renderTable();
      refreshCharts();
      UI.toast('info', 'Semester changed', 'Showing results for ' + semResults().label + '.');
    });
    var rs = document.getElementById('rs-search');
    rs.addEventListener('input', U.debounce(function () { state.q = rs.value; renderTable(); }, 200));

    document.addEventListener('click', function handler(e) {
      var v = e.target.closest('[data-sem]');
      if (v && document.getElementById('rs-table')) {
        state.semester = Number(v.getAttribute('data-sem'));
        document.getElementById('rs-semester').value = String(state.semester);
        renderTable(); refreshCharts();
        window.scrollTo({ top:0, behavior:'smooth' });
      }
    });

    function resultCardText() {
      var s = semResults();
      var lines = [
        'SRMS - OFFICIAL RESULT CARD', '============================================',
        'Student Name : ' + sp.fullName, 'Student ID   : ' + sp.id,
        'Program      : ' + sp.program, 'Department   : ' + sp.department,
        'Semester     : ' + s.label, 'Batch        : ' + sp.batch,
        'Generated    : ' + U.fmtDateTime(new Date()), '',
        'COURSE WISE RESULT', '--------------------------------------------'
      ];
      s.courses.forEach(function (c) {
        lines.push(c.code + '  ' + c.name.substring(0, 30) + '  ' + c.marks + '/' + c.total + '  ' + c.grade + '  GP ' + c.gp.toFixed(2));
      });
      lines.push('--------------------------------------------');
      lines.push('Credits Earned : ' + U.sum(s.courses, 'credits'));
      lines.push('Semester GPA   : ' + U.fmtGpa(s.gpa));
      lines.push('Cumulative GPA : ' + U.fmtGpa(overallStats().cgpa));
      lines.push('');
      lines.push('This is a computer generated document from the SRMS portal.');
      return lines.join('\r\n');
    }

    function downloadCard() {
      U.download('srms-result-card-sem' + state.semester + '.txt', resultCardText());
      UI.toast('success', 'Result card ready', 'srms-result-card-sem' + state.semester + '.txt has been downloaded.');
    }

    ['rs-card','rs-pdf'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', function () {
        b.classList.add('is-loading');
        setTimeout(function () { b.classList.remove('is-loading'); downloadCard(); }, 700);
      });
    });

    var pr = document.getElementById('rs-print');
    if (pr) pr.addEventListener('click', function () {
      UI.toast('info', 'Preparing print view', 'The print dialog will open shortly.');
      setTimeout(function () { window.print(); }, 460);
    });

    /* ------------------------------------------------------------- CHARTS */
    function refreshCharts() {
      var s = semResults();
      var dist = U.groupBy(s.courses, function (c) { return c.grade.charAt(0); });
      var colors = { A:'#22C55E', B:'#1677E8', C:'#F59E0B', D:'#8B5CF6', F:'#EF4444' };
      C.donut('rs-gpa-donut', {
        cutout:'72%', legend:false, unit:' grades',
        data: Object.keys(dist).map(function (k) { return { label:k + ' grades', value:dist[k].length, color:colors[k] || '#94A3B8' }; })
      });
    }

    renderTable();
  }

  function afterResults() {
    refreshResultsCharts();
  }

  function refreshResultsCharts() {
    var D = global.SRMS_DATA;
    var s = semResults();
    var dist = U.groupBy(s.courses, function (c) { return c.grade.charAt(0); });
    var colors = { A:'#22C55E', B:'#1677E8', C:'#F59E0B', D:'#8B5CF6', F:'#EF4444' };
    C.donut('rs-gpa-donut', {
      cutout:'72%', legend:false, unit:' grades',
      data: Object.keys(dist).map(function (k) { return { label:k + ' grades', value:dist[k].length, color:colors[k] || '#94A3B8' }; })
    });

    var tr = D.cgpaTrend || { labels:[], gpa:[], cgpa:[] };
    C.line('rs-cgpa-chart', {
      labels:tr.labels, min:2.5, max:4, legend:true,
      datasets:[
        { label:'Semester GPA', data:tr.gpa,  color:'#1677E8' },
        { label:'CGPA',        data:tr.cgpa, color:'#8B5CF6', fill:false }
      ]
    });
  }

  R.add('results', 'student', { title:'Academic Results', crumbs:['Academic','Results'], render:resultsPage, afterRender:afterResults });
})(window);
