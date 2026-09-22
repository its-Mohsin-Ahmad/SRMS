/* =============================================================================
   SRMS - Teacher Results Management  (js/pages/teacher/results.js)
   Course / exam / student selector with quiz, assignment, midterm and final
   mark entry, automatic total, percentage, grade and grade point calculation,
   plus draft save, publish confirmation and export.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  var WEIGHTS = { quiz:10, assignment:10, midterm:30, final:50 };
  var state = { course:'', exam:'Final', section:'A', q:'', page:1, per:8 };
  var drafts = {};
  var published = {};

  function courses() {
    var D = global.SRMS_DATA;
    return (D.courses || []).filter(function (c) { return c.teacher === D.teachers[0].name; });
  }

  function roster() {
    var D = global.SRMS_DATA;
    var list = (D.studentRoster || []).filter(function (s) { return s.dept === 'Computer Science' && s.section === state.section; });
    if (state.q) {
      var q = state.q.toLowerCase();
      list = list.filter(function (s) { return (s.name + ' ' + s.id).toLowerCase().indexOf(q) > -1; });
    }
    return list;
  }

  function seededMarks(id) {
    if (drafts[id]) return drafts[id];
    var seed = 0;
    String(id).split('').forEach(function (ch) { seed += ch.charCodeAt(0); });
    var quiz = 7 + (seed % 4);
    var assign = 7 + ((seed * 3) % 4);
    var mid = 20 + ((seed * 5) % 11);
    var fin = 33 + ((seed * 7) % 18);
    return { quiz:quiz, assignment:assign, midterm:mid, final:fin };
  }

  function compute(m) {
    var total = (+m.quiz || 0) + (+m.assignment || 0) + (+m.midterm || 0) + (+m.final || 0);
    var pct = total;
    var g = U.gradeFromMarks(pct);
    return { total:total, percentage:pct, grade:g.grade, gp:g.gp };
  }

  function resultsPage(host, ctx) {
    var myCourses = courses();
    if (!state.course && myCourses.length) state.course = myCourses[0].code;
    var rosterAll = (global.SRMS_DATA.studentRoster || []).filter(function (s) { return s.dept === 'Computer Science' && s.section === state.section; });

    host.innerHTML =
      UI.pageHead({ title:'Results Management', subtitle:'Enter, calculate, review and publish student marks for your courses.',
        actions:'<button class="btn btn-outline" id="tr-export"><i class="fas fa-file-export"></i> Export Results</button>' +
                '<button class="btn btn-outline" id="tr-draft"><i class="fas fa-floppy-disk"></i> Save Draft</button>' +
                '<button class="btn btn-primary" id="tr-publish"><i class="fas fa-cloud-arrow-up"></i> Publish Results</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Course', value:state.course || '--', suffix:'selected', icon:'fa-book-open', tone:'blue', note:(myCourses.filter(function (c) { return c.code === state.course; })[0] || {}).name || 'Select a course' }) +
        UI.statCard({ title:'Students', value:rosterAll.length, suffix:'in section', icon:'fa-users', tone:'purple', note:'Section ' + state.section + ' roster' }) +
        UI.statCard({ title:'Exam Type', value:state.exam, suffix:'assessment', icon:'fa-file-pen', tone:'yellow', note:'Weighted ' + (WEIGHTS[state.exam.toLowerCase()] || 50) + ' percent of the final grade' }) +
        UI.statCard({ title:'Published', value:Object.keys(published).length, suffix:'entries', icon:'fa-circle-check', tone:'green', note:draftsSavedCount() + ' draft entries pending' }) +
      '</div>' +

      '<div class="card card-flush mb-16">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' +
            UI.selectBox('tr-course', myCourses.map(function (c) { return { value:c.code, label:c.code + ' - ' + c.name }; }), state.course, 'Select course') +
            UI.selectBox('tr-exam', ['Quiz','Assignment','Midterm','Final'], state.exam, 'Select exam type') +
            UI.selectBox('tr-section', ['A','B','C'], state.section, 'Select section') +
            UI.searchBox('tr-search', 'Search student by name or ID...', state.q) +
          '</div>' +
          '<div class="card-head-actions">' +
            '<button class="btn btn-ghost btn-sm" id="tr-sample"><i class="fas fa-wand-magic-sparkles"></i> Sample Data</button>' +
            '<button class="btn btn-outline btn-sm" id="tr-clear"><i class="fas fa-eraser"></i> Clear All</button>' +
          '</div>' +
        '</div>' +
        '<div class="alert alert-info" style="margin:16px 20px 0"><i class="fas fa-circle-info alert-ico"></i>' +
          '<div class="alert-body"><strong>Mark weighting</strong>Quiz ' + WEIGHTS.quiz + ' \u00b7 Assignment ' + WEIGHTS.assignment + ' \u00b7 Midterm ' + WEIGHTS.midterm + ' \u00b7 Final ' + WEIGHTS.final + ' = 100 marks. Total, percentage, grade and grade point are calculated automatically as you type.</div></div>' +
        '<div style="padding:18px 20px 0" id="tr-body"></div>' +
        '<div id="tr-pagination" style="padding:0 20px 18px"></div>' +
      '</div>' +

      '<div class="grid grid-2">' +
        UI.card({ title:'Class Performance Summary', icon:'fa-chart-simple', subtitle:'Computed from the marks currently entered',
          body:'<div id="tr-summary"></div>' }) +
        UI.card({ title:'Grade Distribution', icon:'fa-chart-pie', subtitle:'Live distribution of computed grades',
          body:'<div class="donut-wrap"><canvas id="tr-donut" class="chart-h-260"></canvas></div><div id="tr-legend"></div>' })
      + '</div>';

    function draftsSavedCount() {
      return Object.keys(drafts).filter(function (k) { return !!drafts[k]; }).length;
    }

    function draw() {
      var list = roster();
      var info = U.paginate(list, state.page, state.per);
      var body = document.getElementById('tr-body');

      if (!list.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-user-slash', title:'No students found', message:'No students match the current section or search term.' });
        document.getElementById('tr-pagination').innerHTML = '';
        drawSummary();
        return;
      }

      body.innerHTML = '<div class="table-wrap"><table class="table table-compact"><thead><tr>' +
        '<th>Student</th><th class="center">Quiz<br><small class="text-mute">10</small></th><th class="center">Assignment<br><small class="text-mute">10</small></th>' +
        '<th class="center">Midterm<br><small class="text-mute">30</small></th><th class="center">Final<br><small class="text-mute">50</small></th>' +
        '<th class="center">Total</th><th class="center">%</th><th class="center">Grade</th><th class="center">GP</th></tr></thead><tbody>' +
        info.items.map(function (s) {
          var m = seededMarks(s.id);
          var c = compute(m);
          var done = !!published[s.id];
          return '<tr data-row="' + U.esc(s.id) + '"><td><div class="flex gap-8">' + UI.avatar(s.name, 'xs') +
            '<div><span class="cell-strong">' + U.esc(s.name) + '</span><div class="cell-mute">' + U.esc(s.id) + (done ? ' ' + UI.badge('Published', 'green') : '') + '</div></div></div></td>' +
            '<td class="center"><input class="mk-input" type="number" min="0" max="10" value="' + m.quiz + '" data-id="' + U.esc(s.id) + '" data-field="quiz" aria-label="Quiz marks"></td>' +
            '<td class="center"><input class="mk-input" type="number" min="0" max="10" value="' + m.assignment + '" data-id="' + U.esc(s.id) + '" data-field="assignment" aria-label="Assignment marks"></td>' +
            '<td class="center"><input class="mk-input" type="number" min="0" max="30" value="' + m.midterm + '" data-id="' + U.esc(s.id) + '" data-field="midterm" aria-label="Midterm marks"></td>' +
            '<td class="center"><input class="mk-input" type="number" min="0" max="50" value="' + m.final + '" data-id="' + U.esc(s.id) + '" data-field="final" aria-label="Final marks"></td>' +
            '<td class="center" data-cell="total"><strong>' + c.total + '</strong></td>' +
            '<td class="center" data-cell="pct">' + c.percentage + '%</td>' +
            '<td class="center" data-cell="grade">' + UI.gradePill(c.grade) + '</td>' +
            '<td class="center" data-cell="gp">' + c.gp.toFixed(2) + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        UI.dataCards(info.items, function (s) {
          var m = seededMarks(s.id); var c = compute(m);
          return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(s.name) + '</strong>' + UI.gradePill(c.grade) + '</div>' +
            '<div class="data-card-grid"><div><div class="dc-label">Student ID</div><div class="dc-value">' + U.esc(s.id) + '</div></div>' +
            '<div><div class="dc-label">Total</div><div class="dc-value">' + c.total + ' / 100</div></div>' +
            '<div><div class="dc-label">Percentage</div><div class="dc-value">' + c.percentage + '%</div></div>' +
            '<div><div class="dc-label">Grade Point</div><div class="dc-value">' + c.gp.toFixed(2) + '</div></div></div></div>';
        });

      document.getElementById('tr-pagination').innerHTML = UI.pagination(info);
      drawSummary();
    }

    function drawSummary() {
      var list = (global.SRMS_DATA.studentRoster || []).filter(function (s) { return s.dept === 'Computer Science' && s.section === state.section; });
      var marks = list.map(function (s) { return compute(seededMarks(s.id)); });
      var totals = marks.map(function (m) { return m.total; });
      var passing = marks.filter(function (m) { return m.percentage >= 50; }).length;
      var dist = U.groupBy(marks, function (m) { return m.grade.charAt(0); });

      document.getElementById('tr-summary').innerHTML = UI.kpiStrip([
        { label:'Average Marks', value: totals.length ? Math.round(U.avg(totals)) + '%' : '--', color:'#1677E8' },
        { label:'Highest', value: totals.length ? Math.max.apply(null, totals) + '%' : '--', color:'#22C55E' },
        { label:'Lowest', value: totals.length ? Math.min.apply(null, totals) + '%' : '--', color:'#EF4444' },
        { label:'Pass %', value: totals.length ? Math.round((passing / totals.length) * 100) + '%' : '--', color:'#8B5CF6' }
      ]) + '<div class="divider"></div>' + UI.meterList([
        { label:'Students above 85%', value:marks.filter(function (m) { return m.percentage >= 85; }).length + ' students', percent:(marks.filter(function (m) { return m.percentage >= 85; }).length / (marks.length || 1)) * 100, tone:'green' },
        { label:'Students 70-84%',     value:marks.filter(function (m) { return m.percentage >= 70 && m.percentage < 85; }).length + ' students', percent:(marks.filter(function (m) { return m.percentage >= 70 && m.percentage < 85; }).length / (marks.length || 1)) * 100, tone:'' },
        { label:'Students below 50%',  value:marks.filter(function (m) { return m.percentage < 50; }).length + ' students', percent:(marks.filter(function (m) { return m.percentage < 50; }).length / (marks.length || 1)) * 100, tone:'red' }
      ]);

      var colors = { A:'#22C55E', B:'#1677E8', C:'#F59E0B', D:'#8B5CF6', F:'#EF4444' };
      var data = Object.keys(dist).map(function (k) { return { label:k + ' grades', value:dist[k].length, color:colors[k] || '#94A3B8' }; });
      C.donut('tr-donut', { cutout:'70%', legend:false, unit:' students', data:data });
      document.getElementById('tr-legend').innerHTML = UI.legendRows(data);
    }

    /* --------------------------------------------------------- MARK INPUT */
    document.getElementById('tr-body').addEventListener('input', function (e) {
      var inp = e.target.closest('.mk-input');
      if (!inp) return;
      var id = inp.getAttribute('data-id');
      var field = inp.getAttribute('data-field');
      var max = Number(inp.getAttribute('max'));
      var val = U.clamp(Number(inp.value) || 0, 0, max);
      if (String(val) !== inp.value && inp.value !== '') inp.value = val;

      if (!drafts[id]) drafts[id] = seededMarks(id);
      drafts[id][field] = val;

      var row = document.querySelector('tr[data-row="' + id + '"]');
      if (row) {
        var c = compute(drafts[id]);
        row.querySelector('[data-cell="total"]').innerHTML = '<strong>' + c.total + '</strong>';
        row.querySelector('[data-cell="pct"]').textContent = c.percentage + '%';
        row.querySelector('[data-cell="grade"]').innerHTML = UI.gradePill(c.grade);
        row.querySelector('[data-cell="gp"]').textContent = c.gp.toFixed(2);
      }
      drawSummary();
    });

    document.getElementById('tr-body').addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); }
    });

    /* ------------------------------------------------------------ WIRING */
    document.getElementById('tr-course').addEventListener('change', function () { state.course = this.value; draw(); });
    document.getElementById('tr-exam').addEventListener('change', function () { state.exam = this.value; UI.toast('info', 'Exam type changed', 'Entering marks for the ' + this.value + ' assessment.'); });
    document.getElementById('tr-section').addEventListener('change', function () { state.section = this.value; state.page = 1; draw(); });
    var si = document.getElementById('tr-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));

    document.getElementById('tr-sample').addEventListener('click', function () {
      roster().forEach(function (s) { drafts[s.id] = seededMarks(s.id); });
      draw();
      UI.toast('success', 'Sample data loaded', 'Representative marks have been filled for every student in this section.');
    });

    document.getElementById('tr-clear').addEventListener('click', function () {
      UI.confirm({ title:'Clear all entered marks?', message:'Every mark field in this section will be reset to zero. This cannot be undone.', tone:'danger', confirmText:'Clear Marks',
        onConfirm:function () {
          roster().forEach(function (s) { drafts[s.id] = { quiz:0, assignment:0, midterm:0, final:0 }; });
          draw();
          UI.toast('warning', 'Marks cleared', 'All mark fields have been reset to zero.');
        } });
    });

    document.getElementById('tr-draft').addEventListener('click', function () {
      UI.toast('success', 'Draft saved', draftsSavedCount() + ' student entries saved as a draft. Publish when you are ready.');
    });

    document.getElementById('tr-publish').addEventListener('click', function () {
      var list = roster();
      UI.confirm({
        title:'Publish results to students?',
        message:'Results for ' + state.exam + ' in ' + state.course + ' (section ' + state.section + ') will be visible to ' + list.length + ' students. Published results cannot be edited without administrator approval.',
        tone:'warning', confirmText:'Publish Now', cancelText:'Review Again',
        onConfirm:function () {
          list.forEach(function (s) { published[s.id] = true; });
          draw();
          UI.toast('success', 'Results published', list.length + ' student results for ' + state.course + ' are now live on the portal.');
        }
      });
    });

    document.getElementById('tr-export').addEventListener('click', function () {
      var list = roster();
      var rows = list.map(function (s) {
        var m = seededMarks(s.id); var c = compute(m);
        return { StudentID:s.id, Name:s.name, Course:state.course, Exam:state.exam, Quiz:m.quiz, Assignment:m.assignment, Midterm:m.midterm, Final:m.final, Total:c.total, Percentage:c.percentage + '%', Grade:c.grade, GradePoint:c.gp.toFixed(2) };
      });
      U.download('srms-results-' + state.course + '-' + state.section + '.csv',
        U.toCSV(rows, ['StudentID','Name','Course','Exam','Quiz','Assignment','Midterm','Final','Total','Percentage','Grade','GradePoint']), 'text/csv');
      UI.toast('success', 'Export complete', rows.length + ' result rows exported successfully.');
    });

    draw();
  }

  R.add('results', 'teacher', { title:'Results Management', crumbs:['Exams & Results','Results'], render:resultsPage });
  global.SRMS_TEACHER_RESULTS = { compute:compute, WEIGHTS:WEIGHTS };
})(window);
