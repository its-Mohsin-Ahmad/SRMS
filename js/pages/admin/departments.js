/* =============================================================================
   SRMS - Admin Departments & Subjects  (js/pages/admin/departments.js)
   Department cards with statistics plus subject catalogue management.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  function departmentsPage(host, ctx) {
    var D = global.SRMS_DATA;
    var list = D.departments || [];

    host.innerHTML =
      UI.pageHead({ title:'Departments', subtitle:'Manage academic departments, faculty strength and programme offerings.',
        actions:'<button class="btn btn-outline" id="dp-export"><i class="fas fa-file-export"></i> Export</button>' +
                '<button class="btn btn-primary" id="dp-add"><i class="fas fa-plus"></i> Add Department</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Departments', value:list.length, suffix:'faculties', icon:'fa-building-columns', tone:'blue', note:'Active academic units' }) +
        UI.statCard({ title:'Total Students', value:U.fmtNum(U.sum(list, 'students')), icon:'fa-user-graduate', tone:'green', note:'Enrolled across departments' }) +
        UI.statCard({ title:'Total Faculty', value:U.sum(list, 'teachers'), icon:'fa-chalkboard-user', tone:'purple', note:'Teaching staff' }) +
        UI.statCard({ title:'Courses Offered', value:U.sum(list, 'courses'), suffix:'courses', icon:'fa-book-open', tone:'teal', note:'In the current catalogue' }) +
      '</div>' +

      UI.card({ title:'Departmental Comparison', icon:'fa-chart-column', subtitle:'Student capacity versus faculty strength', className:'mb-16',
        body:'<div class="chart-box chart-h-300"><canvas id="dp-chart"></canvas></div>' }) +

      '<div class="grid grid-3" id="dp-grid">' +
        list.map(function (d) {
          var tone = d.avgCgpa >= 3.4 ? 'green' : d.avgCgpa >= 3.2 ? 'blue' : 'yellow';
          return '<article class="card card-hover"><div class="flex-between mb-12">' +
            '<span class="sidebar-logo" style="width:40px;height:40px;font-size:17px;border-radius:12px;background:linear-gradient(140deg,' + d.color + ',' + d.color + 'AA)"><i class="fas fa-building-columns"></i></span>' +
            UI.badge(d.code, tone) + '</div>' +
            '<h3 style="font-size:14.6px">' + U.esc(d.name) + '</h3>' +
            '<div class="resource-meta mt-12">' +
              '<div><span>Students</span><strong>' + U.fmtNum(d.students) + '</strong></div>' +
              '<div><span>Faculty</span><strong>' + d.teachers + '</strong></div>' +
              '<div><span>Courses</span><strong>' + d.courses + '</strong></div>' +
              '<div><span>Avg CGPA</span><strong>' + U.fmtGpa(d.avgCgpa) + '</strong></div>' +
            '</div>' +
            '<div class="meter mt-12"><div class="meter-top"><strong>Attendance</strong><span>' + d.attendance + '%</span></div>' + UI.progress(d.attendance, d.attendance >= 88 ? 'green' : d.attendance >= 84 ? '' : 'yellow') + '</div>' +
            '<div class="meter mt-8"><div class="meter-top"><strong>Pass rate</strong><span>' + d.passRate + '%</span></div>' + UI.progress(d.passRate, 'purple') + '</div>' +
            '<div class="resource-foot"><button class="btn btn-outline btn-sm" data-dp-view="' + U.esc(d.id) + '"><i class="fas fa-eye"></i> Details</button>' +
            '<button class="btn btn-ghost btn-sm" data-dp-edit="' + U.esc(d.id) + '"><i class="fas fa-pen"></i> Edit</button></div></article>';
        }).join('') + '</div>';

    /* -------------------------------------------------------- CHART */
    C.bar('dp-chart', {
      labels:list.map(function (d) { return d.code; }),
      legend:true,
      datasets:[
        { label:'Students', data:list.map(function (d) { return d.students; }), color:'#1677E8' },
        { label:'Faculty \u00d7 10', data:list.map(function (d) { return d.teachers * 10; }), color:'#8B5CF6' },
        { label:'Courses \u00d7 10', data:list.map(function (d) { return d.courses * 10; }), color:'#14B8A6' }
      ]
    });

    /* ------------------------------------------------------- ACTIONS */
    function find(id) { return list.filter(function (d) { return d.id === id; })[0]; }

    function openForm(existing) {
      var isEdit = !!existing;
      var d = existing || { code:'', name:'', students:0, teachers:0, courses:0, avgCgpa:0, attendance:0, passRate:0, color:'#1677E8' };
      UI.modal({
        title:isEdit ? 'Edit Department' : 'Add Department', subtitle:'Configure the academic unit and its statistics.',
        body:'<div class="form-grid">' +
          '<div class="form-group"><label class="field-label">Code</label><div class="input-wrap no-icon"><input id="df-code" value="' + U.esc(d.code) + '" placeholder="e.g. CS"' + (isEdit ? ' readonly' : '') + '></div></div>' +
          '<div class="form-group"><label class="field-label">Department Name</label><div class="input-wrap no-icon"><input id="df-name" value="' + U.esc(d.name) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Students</label><div class="input-wrap no-icon"><input type="number" id="df-students" value="' + d.students + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Faculty</label><div class="input-wrap no-icon"><input type="number" id="df-teachers" value="' + d.teachers + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Courses</label><div class="input-wrap no-icon"><input type="number" id="df-courses" value="' + d.courses + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Average CGPA</label><div class="input-wrap no-icon"><input type="number" step="0.01" id="df-cgpa" value="' + d.avgCgpa + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Attendance %</label><div class="input-wrap no-icon"><input type="number" id="df-att" value="' + d.attendance + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Pass Rate %</label><div class="input-wrap no-icon"><input type="number" id="df-pass" value="' + d.passRate + '"></div></div>' +
        '</div><span class="field-error" id="df-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="df-save"><i class="fas fa-check"></i> ' + (isEdit ? 'Save Changes' : 'Create Department') + '</button>',
        onMount:function (m) {
          m.on('#df-save', 'click', function () {
            var code = m.el.querySelector('#df-code').value.trim().toUpperCase();
            var name = m.el.querySelector('#df-name').value.trim();
            var err = m.el.querySelector('#df-error');
            if (!/^[A-Z]{2,4}$/.test(code)) { err.textContent = 'Code must be 2-4 letters, e.g. CS.'; return; }
            if (!U.minLen(name, 3)) { err.textContent = 'Department name must be at least 3 characters.'; return; }
            err.textContent = '';
            var data = { code:code, name:name,
              students:Number(m.el.querySelector('#df-students').value) || 0,
              teachers:Number(m.el.querySelector('#df-teachers').value) || 0,
              courses:Number(m.el.querySelector('#df-courses').value) || 0,
              avgCgpa:Number(m.el.querySelector('#df-cgpa').value) || 0,
              attendance:Number(m.el.querySelector('#df-att').value) || 0,
              passRate:Number(m.el.querySelector('#df-pass').value) || 0,
              color:d.color, id:existing ? existing.id : 'DEP-' + (list.length + 1 < 10 ? '0' : '') + (list.length + 1) };
            if (isEdit) { Object.assign(existing, data); m.close(); UI.toast('success', 'Department updated', data.name + ' has been saved.'); }
            else { (global.SRMS_DATA.departments || []).push(data); m.close(); UI.toast('success', 'Department created', data.name + ' is now available for enrolment.'); }
            R.reRender({ role:ctx.role, user:ctx.user, go:ctx.go });
          });
        }
      });
    }

    host.addEventListener('click', function (e) {
      var v = e.target.closest('[data-dp-view]');
      if (v) {
        var d = find(v.getAttribute('data-dp-view'));
        if (!d) return;
        UI.modal({ title:d.name, subtitle:d.code + ' \u00b7 Faculty of ' + d.name, size:'lg',
          body:'<div class="kpi-strip"><div class="kpi-cell"><div class="kpi-label">Students</div><div class="kpi-val">' + U.fmtNum(d.students) + '</div></div>' +
            '<div class="kpi-cell"><div class="kpi-label">Faculty</div><div class="kpi-val">' + d.teachers + '</div></div>' +
            '<div class="kpi-cell"><div class="kpi-label">Courses</div><div class="kpi-val">' + d.courses + '</div></div>' +
            '<div class="kpi-cell"><div class="kpi-label">Avg CGPA</div><div class="kpi-val">' + U.fmtGpa(d.avgCgpa) + '</div></div></div>' +
            '<div class="divider"></div>' +
            '<dl class="info-grid">' +
              '<div class="info-item"><dt>Attendance Rate</dt><dd>' + d.attendance + '%</dd></div>' +
              '<div class="info-item"><dt>Pass Rate</dt><dd>' + d.passRate + '%</dd></div>' +
              '<div class="info-item"><dt>Faculty Ratio</dt><dd>1 : ' + Math.round(d.students / (d.teachers || 1)) + '</dd></div>' +
              '<div class="info-item"><dt>HOD</dt><dd>' + U.esc((global.SRMS_DATA.teachers || []).filter(function (t) { return t.dept === d.name; })[0] ? (global.SRMS_DATA.teachers.filter(function (t) { return t.dept === d.name; })[0]).name : 'To be assigned') + '</dd></div>' +
            '</dl>',
          footer:'<button class="btn btn-outline" data-modal-close>Close</button><button class="btn btn-primary" id="dv-edit"><i class="fas fa-pen"></i> Edit Department</button>',
          onMount:function (m) { m.on('#dv-edit', 'click', function () { m.close(); openForm(d); }); }
        });
        return;
      }
      var ed = e.target.closest('[data-dp-edit]');
      if (ed) { openForm(find(ed.getAttribute('data-dp-edit'))); }
    });

    document.getElementById('dp-add').addEventListener('click', function () { openForm(null); });
    document.getElementById('dp-export').addEventListener('click', function () {
      U.download('srms-departments.csv', U.toCSV(list.map(function (d) {
        return { Code:d.code, Name:d.name, Students:d.students, Faculty:d.teachers, Courses:d.courses, AvgCGPA:U.fmtGpa(d.avgCgpa), Attendance:d.attendance + '%', PassRate:d.passRate + '%' };
      }), ['Code','Name','Students','Faculty','Courses','AvgCGPA','Attendance','PassRate']), 'text/csv');
      UI.toast('success', 'Export complete', list.length + ' departments exported.');
    });
  }

  /* ------------------------------------------------------------ SUBJECTS */
  function subjectsPage(host, ctx) {
    var D = global.SRMS_DATA;
    var subs = [];
    (D.courses || []).forEach(function (c) {
      (c.syllabus || []).forEach(function (u, i) {
        subs.push({ id:c.code + '-U' + (i + 1), course:c.code, courseName:c.name, unit:u, credits:c.credits, semester:c.semester, dept:c.dept, type:i % 3 === 0 ? 'Core' : i % 3 === 1 ? 'Elective' : 'Lab' });
      });
    });

    host.innerHTML =
      UI.pageHead({ title:'Subjects', subtitle:'Course units and subjects across the academic catalogue.',
        actions:'<button class="btn btn-outline" id="sb-export"><i class="fas fa-file-export"></i> Export</button>' }) +
      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' + UI.searchBox('sb-search', 'Search subjects or units...', '') +
            UI.selectBox('sb-type', ['All','Core','Elective','Lab'], 'All', 'Filter type') + '</div>' +
          '<div class="card-head-actions"><span class="badge badge-blue" id="sb-count">' + subs.length + ' units</span></div>' +
        '</div>' +
        '<div style="padding:18px 20px 20px" id="sb-body"></div>' +
      '</div>';

    function draw(q, type) {
      var out = subs.filter(function (s) {
        if (type !== 'All' && s.type !== type) return false;
        if (!q) return true;
        return (s.unit + ' ' + s.course + ' ' + s.courseName).toLowerCase().indexOf(q.toLowerCase()) > -1;
      });
      document.getElementById('sb-count').textContent = out.length + ' units';
      document.getElementById('sb-body').innerHTML = out.length ? UI.table({
        columns:[
          { key:'id', label:'Subject ID', render:function (s) { return '<span class="badge badge-gray">' + U.esc(s.id) + '</span>'; } },
          { key:'unit', label:'Subject / Unit', render:function (s) { return '<span class="cell-strong">' + U.esc(s.unit) + '</span>'; } },
          { key:'course', label:'Course', render:function (s) { return UI.badge(s.course, 'blue') + ' <span class="cell-mute">' + U.esc(s.courseName) + '</span>'; } },
          { key:'dept', label:'Department' },
          { key:'semester', label:'Semester', className:'center', render:function (s) { return s.semester + 'th'; } },
          { key:'credits', label:'Credits', className:'center' },
          { key:'type', label:'Type', render:function (s) { return UI.badge(s.type, s.type === 'Core' ? 'blue' : s.type === 'Lab' ? 'purple' : 'teal'); } }
        ], rows:out.slice(0, 40)
      }) + UI.dataCards(out.slice(0, 20), function (s) {
        return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(s.unit) + '</strong>' + UI.badge(s.type, 'blue') + '</div>' +
          '<div class="data-card-grid"><div><div class="dc-label">Course</div><div class="dc-value">' + U.esc(s.course) + '</div></div>' +
          '<div><div class="dc-label">Semester</div><div class="dc-value">' + s.semester + 'th</div></div>' +
          '<div><div class="dc-label">Credits</div><div class="dc-value">' + s.credits + '</div></div>' +
          '<div><div class="dc-label">Department</div><div class="dc-value">' + U.esc(s.dept) + '</div></div></div></div>';
      }) : UI.emptyState({ small:true, icon:'fa-layer-group', title:'No subjects found', message:'No units match the current search.' });
    }

    var si = document.getElementById('sb-search');
    si.addEventListener('input', U.debounce(function () { draw(si.value, document.getElementById('sb-type').value); }, 200));
    document.getElementById('sb-type').addEventListener('change', function () { draw(si.value, this.value); });
    document.getElementById('sb-export').addEventListener('click', function () {
      U.download('srms-subjects.csv', U.toCSV(subs, ['id','course','courseName','unit','dept','semester','credits','type']), 'text/csv');
      UI.toast('success', 'Export complete', subs.length + ' subject units exported.');
    });

    draw('', 'All');
  }

  R.add('departments', 'admin', { title:'Departments', crumbs:['Management','Departments'], render:departmentsPage });
  R.add('subjects', 'admin', { title:'Subjects', crumbs:['Management','Subjects'], render:subjectsPage });
})(window);
