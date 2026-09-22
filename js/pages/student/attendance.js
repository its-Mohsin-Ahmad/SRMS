/* =============================================================================
   SRMS - Attendance Page  (js/pages/student/attendance.js)
   Overall metrics, donut chart, per-subject cards, attendance log and warnings.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;
  var C = global.SRMS_CHARTS;

  function attendancePage(host, ctx) {
    var D = global.SRMS_DATA;
    var sum = D.attendanceSummary || { present:0, absent:0, late:0, excused:0, total:0, percentage:0, required:75 };
    var subs = D.subjectAttendance || [];
    var risk = subs.filter(function (s) { return s.percentage < sum.required; });
    var avg = U.avg(subs, 'percentage');

    host.innerHTML =
      UI.pageHead({ title:'Attendance', subtitle:'Full attendance record with subject-wise breakdown and eligibility tracking.',
        actions:'<button class="btn btn-outline" id="at-report"><i class="fas fa-file-arrow-down"></i> Download Report</button>' +
                '<button class="btn btn-primary" id="at-apply"><i class="fas fa-envelope-open-text"></i> Apply for Leave</button>' }) +

      (risk.length ? '<div class="mb-16">' + UI.alert({ tone:'warning', title:'Attendance below requirement',
        message:'You are below the ' + sum.required + ' percent requirement in ' + risk.length + ' course' + (risk.length > 1 ? 's' : '') + ': ' + risk.map(function (r) { return r.code; }).join(', ') + '. Attend the remaining classes to stay eligible for the final examination.' }) + '</div>' :
        '<div class="mb-16">' + UI.alert({ tone:'success', title:'Attendance requirement met', message:'Your attendance is above the required ' + sum.required + ' percent in every course. Keep up the consistency.' }) + '</div>') +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Overall Attendance', value:U.fmtPct(sum.percentage), icon:'fa-user-check', tone:'blue',
          note:sum.present + ' of ' + sum.total + ' classes attended', trend:{ dir: sum.percentage >= sum.required ? 'up' : 'down', value: sum.percentage >= sum.required ? 'Eligible' : 'At risk' } }) +
        UI.statCard({ title:'Present', value:sum.present, suffix:'classes', icon:'fa-circle-check', tone:'green', note:Math.round((sum.present / sum.total) * 100) + '% of total classes' }) +
        UI.statCard({ title:'Absent', value:sum.absent, suffix:'classes', icon:'fa-circle-xmark', tone:'red', note:Math.round((sum.absent / sum.total) * 100) + '% of total classes' }) +
        UI.statCard({ title:'Late / Excused', value:sum.late + ' / ' + sum.excused, suffix:'classes', icon:'fa-clock', tone:'yellow', note:'Late arrivals and approved leaves' }) +
      '</div>' +

      '<div class="grid grid-side-main mb-16">' +
        '<div class="grid" style="gap:18px">' +
          UI.card({ title:'Attendance Distribution', icon:'fa-chart-pie', subtitle:'Present, absent, late and excused classes',
            body:'<div class="donut-wrap"><canvas id="at-donut" class="chart-h-260"></canvas>' +
              '<div class="donut-center"><strong>' + sum.percentage + '%</strong><span>Present</span></div></div>' +
              UI.legendRows([
                { label:'Present', value:sum.present, color:'#22C55E' },
                { label:'Absent',  value:sum.absent,  color:'#EF4444' },
                { label:'Late',    value:sum.late,    color:'#F59E0B' },
                { label:'Excused', value:sum.excused, color:'#8B5CF6' }
              ]) }) +
          UI.card({ title:'Weekly Trend', icon:'fa-chart-area', subtitle:'Attendance percentage per teaching week',
            body:'<div class="chart-box chart-h-260"><canvas id="at-trend"></canvas></div>' }) +
        '</div>' +

        '<div class="grid" style="gap:18px">' +
          UI.card({ title:'Eligibility Status', icon:'fa-shield-halved',
            body:'<div class="state-block state-block-sm" style="padding:8px 0">' +
              '<div class="state-ico ' + (risk.length ? 'error' : 'success') + '"><i class="fas ' + (risk.length ? 'fa-triangle-exclamation' : 'fa-circle-check') + '"></i></div>' +
              '<h3>' + (risk.length ? 'Not eligible in ' + risk.length + ' course' + (risk.length > 1 ? 's' : '') : 'Fully eligible') + '</h3>' +
              '<p>' + (risk.length ? 'Minimum ' + sum.required + '% attendance is required to sit in the final examination.' : 'You meet the attendance requirement across all enrolled courses.') + '</p></div>' +
            '<div class="divider"></div>' + UI.meterList([
              { label:'Average attendance', value:U.fmtPct(avg), percent:avg, tone: avg >= 90 ? 'green' : avg >= 80 ? '' : 'yellow' },
              { label:'Courses tracked', value:subs.length, percent:100, tone:'purple' },
              { label:'Requirement', value:sum.required + '%', percent:sum.required, tone:'' }
            ]) }) +
          UI.card({ title:'Attendance Log', icon:'fa-list-check', subtitle:'Most recent class records',
            body:'<div id="at-log"></div>' }) +
        '</div>' +
      '</div>' +

      UI.card({ title:'Subject-wise Attendance', icon:'fa-book-open', subtitle:'Attendance percentage per enrolled course',
        body:'<div class="grid grid-3" id="at-subjects"></div>' });

    /* -------------------------------------------------- SUBJECT CARDS */
    document.getElementById('at-subjects').innerHTML = subs.map(function (s) {
      var tone = s.percentage >= 90 ? 'green' : s.percentage >= 80 ? 'blue' : s.percentage >= 75 ? 'yellow' : 'red';
      var status = s.percentage >= 90 ? 'Excellent' : s.percentage >= 80 ? 'Good' : s.percentage >= 75 ? 'Satisfactory' : 'Below Requirement';
      return '<div class="card card-hover"><div class="flex-between mb-12"><div><h3 style="font-size:14.4px">' + U.esc(s.name) + '</h3>' +
        '<p class="text-mute text-xs mt-4">' + U.esc(s.code) + '</p></div>' + UI.badge(status, tone) + '</div>' +
        '<div class="stat-value" style="font-size:26px">' + s.percentage + '<small>%</small></div>' +
        '<div class="mt-12">' + UI.progress(s.percentage, tone) + '</div>' +
        '<div class="kpi-strip" style="margin-top:14px"><div class="kpi-cell"><div class="kpi-label">Held</div><div class="kpi-val">' + s.held + '</div></div>' +
        '<div class="kpi-cell"><div class="kpi-label">Present</div><div class="kpi-val text-green">' + s.present + '</div></div>' +
        '<div class="kpi-cell"><div class="kpi-label">Absent</div><div class="kpi-val text-red">' + s.absent + '</div></div>' +
        '<div class="kpi-cell"><div class="kpi-label">Late</div><div class="kpi-val text-yellow">' + s.late + '</div></div></div></div>';
    }).join('');

    /* ------------------------------------------------------- LOG LIST */
    var logs = (D.attendanceLog || []).slice(0, 8);
    document.getElementById('at-log').innerHTML = logs.length ? '<div class="list-simple">' + logs.map(function (l) {
      var tone = l.status === 'Present' ? 'green' : l.status === 'Absent' ? 'red' : l.status === 'Late' ? 'yellow' : 'purple';
      return '<div class="list-row"><span class="resource-ico badge-' + tone + '" style="width:36px;height:36px;font-size:13px;border-radius:10px"><i class="fas ' +
        (l.status === 'Present' ? 'fa-check' : l.status === 'Absent' ? 'fa-xmark' : l.status === 'Late' ? 'fa-clock' : 'fa-file-shield') + '"></i></span>' +
        '<div class="list-row-main"><strong>' + U.esc(l.course) + '</strong><span>' + U.fmtDate(l.date) + ' \u00b7 ' + U.esc(l.slot) + '</span></div>' +
        UI.statusBadge(l.status) + '</div>';
    }).join('') + '</div>' : UI.emptyState({ small:true, icon:'fa-calendar-xmark', title:'No records', message:'Attendance logs will appear here.' });

    /* ------------------------------------------------------------ ACTIONS */
    document.getElementById('at-report').addEventListener('click', function () {
      var rows = subs.map(function (s) { return { Code:s.code, Course:s.name, Held:s.held, Present:s.present, Absent:s.absent, Late:s.late, Percentage:s.percentage + '%', Status:s.status }; });
      U.download('srms-attendance-report.csv', U.toCSV(rows, ['Code','Course','Held','Present','Absent','Late','Percentage','Status']), 'text/csv');
      UI.toast('success', 'Report downloaded', 'srms-attendance-report.csv saved successfully.');
    });

    document.getElementById('at-apply').addEventListener('click', function () {
      UI.modal({
        title:'Apply for Leave', subtitle:'Submit a leave request for approval by your advisor.',
        body:'<div class="form-grid">' +
          '<div class="form-group"><label class="field-label">Course</label><div class="input-wrap no-icon"><select id="lv-course">' +
            subs.map(function (s) { return '<option value="' + U.esc(s.code) + '">' + U.esc(s.code + ' - ' + s.name) + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Leave Type</label><div class="input-wrap no-icon"><select id="lv-type"><option>Medical</option><option>Family Emergency</option><option>Official Duty</option><option>Other</option></select></div></div>' +
          '<div class="form-group"><label class="field-label">From Date</label><div class="input-wrap no-icon"><input type="date" id="lv-from" value="' + U.todayISO() + '"></div></div>' +
          '<div class="form-group"><label class="field-label">To Date</label><div class="input-wrap no-icon"><input type="date" id="lv-to" value="' + U.todayISO() + '"></div></div>' +
          '<div class="form-group form-span-2"><label class="field-label">Reason</label><div class="input-wrap"><textarea id="lv-reason" placeholder="Explain the reason for your leave request..."></textarea></div></div>' +
        '</div><span class="field-error" id="lv-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="lv-submit"><i class="fas fa-paper-plane"></i> Submit Request</button>',
        onMount:function (m) {
          m.on('#lv-submit', 'click', function () {
            var reason = m.el.querySelector('#lv-reason').value.trim();
            var from = m.el.querySelector('#lv-from').value;
            var to = m.el.querySelector('#lv-to').value;
            var err = m.el.querySelector('#lv-error');
            if (!U.minLen(reason, 10)) { err.textContent = 'Please provide a reason of at least 10 characters.'; return; }
            if (U.daysBetween(from, to) < 0) { err.textContent = 'The end date cannot be before the start date.'; return; }
            err.textContent = '';
            m.close();
            UI.toast('success', 'Leave request submitted', 'Reference #LV-' + Math.floor(10000 + Math.random() * 89999) + '. Your advisor will review it shortly.');
          });
        }
      });
    });
  }

  function afterAttendance() {
    var D = global.SRMS_DATA;
    var sum = D.attendanceSummary || {};
    C.donut('at-donut', { cutout:'70%', legend:false, unit:' classes', data:[
      { label:'Present', value:sum.present || 0, color:'#22C55E' },
      { label:'Absent',  value:sum.absent  || 0, color:'#EF4444' },
      { label:'Late',    value:sum.late    || 0, color:'#F59E0B' },
      { label:'Excused', value:sum.excused || 0, color:'#8B5CF6' }
    ] });

    var A = D.analytics || {};
    var trend = A.attendanceAnalytics || { labels:[], present:[] };
    C.line('at-trend', {
      labels:trend.labels, legend:false, min:70, max:100, unit:'%',
      datasets:[{ label:'Attendance', data:trend.present, color:'#1677E8' }]
    });
  }

  R.add('attendance', 'student', { title:'Attendance', crumbs:['Academic','Attendance'], render:attendancePage, afterRender:afterAttendance });
})(window);
