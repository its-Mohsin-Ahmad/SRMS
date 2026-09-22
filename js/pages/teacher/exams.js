/* =============================================================================
   SRMS - Teacher Exams  (js/pages/teacher/exams.js)
   Exam schedule, invigilation duties, completed exam marks review and the
   ability to schedule new assessments.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  function examTone(type) {
    return type === 'Final' ? 'red' : type === 'Midterm' ? 'blue' : type === 'Quiz' ? 'purple' : type === 'Practical' ? 'teal' : 'yellow';
  }

  function examsPage(host, ctx) {
    var D = global.SRMS_DATA;
    var all = D.exams || [];
    var upcoming = all.filter(function (e) { return e.status === 'Upcoming'; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    var completed = all.filter(function (e) { return e.status === 'Completed'; });

    host.innerHTML =
      UI.pageHead({ title:'Examinations', subtitle:'Manage your examination schedule, review completed assessments and track invigilation duties.',
        actions:'<button class="btn btn-outline" id="tex-export"><i class="fas fa-file-export"></i> Export Schedule</button>' +
                '<button class="btn btn-primary" id="tex-new"><i class="fas fa-calendar-plus"></i> Schedule Exam</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Scheduled Exams', value:upcoming.length, suffix:'exams', icon:'fa-hourglass-half', tone:'yellow', note:'For your courses this semester' }) +
        UI.statCard({ title:'Completed', value:completed.length, suffix:'exams', icon:'fa-circle-check', tone:'green', note:'Results already published' }) +
        UI.statCard({ title:'Class Average', value:Math.round(U.avg(completed, 'marks')) + '%', icon:'fa-chart-simple', tone:'blue', note:'Across completed assessments' }) +
        UI.statCard({ title:'Pass Rate', value:U.fmtPct(Math.round((completed.filter(function (e) { return e.marks >= 50; }).length / (completed.length || 1)) * 100)), icon:'fa-arrow-up-right-dots', tone:'purple', note:'Students scoring 50% or above' }) +
      '</div>' +

      '<div class="grid grid-main-side mb-16">' +
        UI.card({ title:'Exam Schedule', icon:'fa-calendar-days', subtitle:'All assessments for your courses, chronological order',
          body:'<div class="table-wrap"><table class="table"><thead><tr><th>Course</th><th>Type</th><th>Date</th><th>Time</th><th>Room</th><th>Status</th><th></th></tr></thead><tbody>' +
            all.slice().sort(function (a, b) { return a.date.localeCompare(b.date); }).map(function (e) {
              var cd = U.countdown(e.date);
              return '<tr><td><span class="cell-strong">' + U.esc(e.course) + '</span><div class="cell-mute">' + U.esc(e.code) + '</div></td>' +
                '<td>' + UI.badge(e.type, examTone(e.type)) + '</td>' +
                '<td>' + U.fmtDate(e.date) + '</td><td>' + U.esc(e.time) + '</td><td>' + U.esc(e.room) + '</td>' +
                '<td>' + (e.status === 'Upcoming' ? UI.badge(cd.text, cd.days <= 7 ? 'red' : 'yellow') : UI.statusBadge(e.status)) + '</td>' +
                '<td><div class="action-group">' +
                  '<button class="icon-action" data-ex-edit="' + U.esc(e.id) + '" title="Edit exam" aria-label="Edit"><i class="fas fa-pen"></i></button>' +
                  '<button class="icon-action success" data-ex-results="' + U.esc(e.id) + '" title="Enter results" aria-label="Results"><i class="fas fa-square-poll-vertical"></i></button>' +
                '</div></td></tr>';
            }).join('') + '</tbody></table></div>' +
            UI.dataCards(all, function (e) {
              return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(e.course) + '</strong>' + UI.badge(e.type, examTone(e.type)) + '</div>' +
                '<div class="data-card-grid"><div><div class="dc-label">Date</div><div class="dc-value">' + U.fmtDate(e.date) + '</div></div>' +
                '<div><div class="dc-label">Time</div><div class="dc-value">' + U.esc(e.time) + '</div></div>' +
                '<div><div class="dc-label">Room</div><div class="dc-value">' + U.esc(e.room) + '</div></div>' +
                '<div><div class="dc-label">Status</div><div class="dc-value">' + U.esc(e.status) + '</div></div></div></div>';
            }) }) +
        '<div class="grid" style="gap:18px">' +
          UI.card({ title:'Marks Comparison', icon:'fa-chart-column', subtitle:'Completed exam averages',
            body:'<div class="chart-box chart-h-260"><canvas id="tex-marks"></canvas></div>' }) +
          UI.card({ title:'Next Examination', icon:'fa-bell',
            body: upcoming.length ? (function () {
              var n = upcoming[0]; var cd = U.countdown(n.date);
              return '<div class="state-block state-block-sm" style="padding:6px 0"><div class="state-ico error"><i class="fas fa-file-pen"></i></div>' +
                '<h3>' + U.esc(n.course) + '</h3><p>' + U.fmtDateLong(n.date) + ' at ' + U.esc(n.time) + '<br>' + U.esc(n.room) + ' \u00b7 ' + cd.text + '</p></div>';
            })() : UI.emptyState({ small:true, icon:'fa-mug-hot', title:'Nothing scheduled', message:'No upcoming examinations for your courses.' }) }) +
        '</div>' +
      '</div>';

    document.getElementById('tex-export').addEventListener('click', function () {
      var rows = all.map(function (e) { return { Code:e.code, Course:e.course, Type:e.type, Date:e.date, Time:e.time, Room:e.room, Status:e.status }; });
      U.download('srms-teacher-exam-schedule.csv', U.toCSV(rows, ['Code','Course','Type','Date','Time','Room','Status']), 'text/csv');
      UI.toast('success', 'Export complete', 'Exam schedule exported successfully.');
    });

    document.getElementById('tex-new').addEventListener('click', function () { examForm(null, ctx); });
    host.addEventListener('click', function (e) {
      var ed = e.target.closest('[data-ex-edit]');
      if (ed) { examForm(all.filter(function (x) { return x.id === ed.getAttribute('data-ex-edit'); })[0], ctx); return; }
      var rs = e.target.closest('[data-ex-results]');
      if (rs) { UI.toast('info', 'Result entry', 'Redirecting to the results management page.'); if (ctx.go) ctx.go('results'); }
    });

    function examForm(existing, ctx2) {
      var isEdit = !!existing;
      var courses = (D.courses || []).filter(function (c) { return c.teacher === D.teachers[0].name; });
      UI.modal({
        title:isEdit ? 'Edit Examination' : 'Schedule New Examination', subtitle:isEdit ? existing.code + ' \u00b7 ' + existing.course : 'Create an exam slot for one of your courses.',
        body:'<div class="form-grid">' +
          '<div class="form-group form-span-2"><label class="field-label">Course</label><div class="input-wrap no-icon"><select id="ex-course">' +
            courses.map(function (c) { return '<option value="' + U.esc(c.code) + '"' + (existing && existing.code === c.code ? ' selected' : '') + '>' + U.esc(c.code + ' - ' + c.name) + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Exam Type</label><div class="input-wrap no-icon"><select id="ex-type">' +
            ['Quiz','Assignment','Midterm','Final','Practical'].map(function (t) { return '<option' + (existing && existing.type === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Date</label><div class="input-wrap no-icon"><input type="date" id="ex-date" value="' + U.esc(existing ? existing.date : U.todayISO()) + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Start Time</label><div class="input-wrap no-icon"><input type="time" id="ex-time" value="09:00"></div></div>' +
          '<div class="form-group"><label class="field-label">Room</label><div class="input-wrap no-icon"><input id="ex-room" value="' + U.esc(existing ? existing.room : 'Hall A-01') + '"></div></div>' +
          '<div class="form-group"><label class="field-label">Section</label><div class="input-wrap no-icon"><select id="ex-sec"><option>A</option><option>B</option><option>C</option></select></div></div>' +
        '</div><span class="field-error" id="ex-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="ex-save"><i class="fas fa-check"></i> ' + (isEdit ? 'Update Exam' : 'Schedule Exam') + '</button>',
        onMount:function (m) {
          m.on('#ex-save', 'click', function () {
            var date = m.el.querySelector('#ex-date').value;
            if (!date) { m.el.querySelector('#ex-error').textContent = 'Please choose an exam date.'; return; }
            if (U.daysBetween(U.todayISO(), date) < 0 && !isEdit) { m.el.querySelector('#ex-error').textContent = 'Exam date cannot be in the past.'; return; }
            var code = m.el.querySelector('#ex-course').value;
            var course = courses.filter(function (c) { return c.code === code; })[0] || {};
            var payload = {
              course:course.name || code, code:code, type:m.el.querySelector('#ex-type').value,
              date:date, time:m.el.querySelector('#ex-time').value, room:m.el.querySelector('#ex-room').value.trim(),
              semester:course.semester || 5, section:m.el.querySelector('#ex-sec').value, teacher:D.teachers[0].name
            };
            if (isEdit) { Object.assign(existing, payload); UI.toast('success', 'Exam updated', payload.course + ' ' + payload.type + ' has been rescheduled.'); }
            else {
              payload.id = 'EX-' + Math.floor(600 + Math.random() * 399); payload.status = 'Upcoming';
              (global.SRMS_DATA.exams || []).push(payload);
              UI.confirm({ title:'Notify students?', message:'Students of ' + payload.section + ' can be alerted about this exam immediately.', tone:'info', confirmText:'Notify Students',
                onConfirm:function () { UI.toast('success', 'Exam scheduled and students notified', payload.course + ' on ' + U.fmtDate(payload.date) + '.'); } });
            }
            m.close();
            R.reRender({ role:ctx2.role, user:ctx2.user, go:ctx2.go });
          });
        }
      });
    }
  }

  function afterTeacherExams() {
    var D = global.SRMS_DATA;
    var completed = (D.exams || []).filter(function (e) { return e.status === 'Completed'; });
    C.bar('tex-marks', {
      labels: completed.map(function (e) { return e.code; }),
      legend:false, max:100, unit:'%',
      datasets:[{ label:'Marks', data:completed.map(function (e) { return e.marks; }),
        colors: completed.map(function (e) { return e.marks >= 85 ? '#22C55E' : e.marks >= 75 ? '#1677E8' : '#F59E0B'; }) }]
    });
  }

  R.add('exams', 'teacher', { title:'Examinations', crumbs:['Exams & Results','Exams'], render:examsPage, afterRender:afterTeacherExams });
})(window);
