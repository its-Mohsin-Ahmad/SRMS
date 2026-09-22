/* =============================================================================
   SRMS - Weekly Timetable  (js/pages/student/timetable.js)
   Colour coded weekly schedule with day cards, list view and print support.
   Registered for student, teacher and admin roles.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var TONE_LABEL = { main:'Lecture', teal:'Lecture', lab:'Lab Session', break:'Break', exam:'Examination' };
  var TONE_BADGE = { main:'blue', teal:'teal', lab:'purple', break:'yellow', exam:'red' };

  function todayName() {
    var d = new Date().getDay();
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d];
  }

  function timetablePage(host, ctx) {
    var D = global.SRMS_DATA;
    var days = D.days || [];
    var tt = D.timetable || {};
    var today = todayName();

    var totalSessions = 0;
    days.forEach(function (d) { totalSessions += (tt[d] || []).length; });
    var lectureCount = 0, labCount = 0;
    days.forEach(function (d) {
      (tt[d] || []).forEach(function (s) {
        if (s.tone === 'lab') labCount++;
        else if (s.tone !== 'break') lectureCount++;
      });
    });

    host.innerHTML =
      UI.pageHead({ title:'Class Timetable', subtitle:'Weekly schedule for the ' + (ctx.role === 'student' ? (D.studentProfile.semesterLabel + ' \u00b7 Section ' + D.studentProfile.section) : 'current teaching plan') + '.',
        actions:'<button class="btn btn-outline" id="tt-list"><i class="fas fa-list"></i> List View</button>' +
                '<button class="btn btn-outline" id="tt-print"><i class="fas fa-print"></i> Print</button>' +
                '<button class="btn btn-primary" id="tt-export"><i class="fas fa-file-export"></i> Export Timetable</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Weekly Sessions', value:totalSessions, suffix:'classes', icon:'fa-calendar-week', tone:'blue', note:'Across ' + days.length + ' working days' }) +
        UI.statCard({ title:'Lectures', value:lectureCount, suffix:'sessions', icon:'fa-chalkboard', tone:'purple', note:'Theory classes this week' }) +
        UI.statCard({ title:'Lab Sessions', value:labCount, suffix:'sessions', icon:'fa-flask', tone:'teal', note:'Practical and lab work' }) +
        UI.statCard({ title:'Today', value:((tt[today] || []).length || 'No') + '', suffix:'classes', icon:'fa-calendar-day', tone:'green', note:today + ' schedule' }) +
      '</div>' +

      '<div class="card card-flush mb-16">' +
        '<div class="card-head" style="padding:20px 20px 0;margin-bottom:14px"><div><h3><i class="fas fa-calendar-week"></i> Weekly Grid</h3><p>Colour coded by session type. Scroll horizontally on smaller screens.</p></div>' +
        '<div class="card-head-actions"><button class="btn btn-ghost btn-sm" id="tt-today"><i class="fas fa-location-crosshairs"></i> Jump to Today</button></div></div>' +
        '<div style="padding:0 20px 20px">' +
          '<div class="timetable-grid" id="tt-grid"></div>' +
          '<div class="tt-colors">' + Object.keys(TONE_LABEL).map(function (k) {
            return '<span class="legend-item"><span class="legend-swatch" style="background:' + ({ main:'#1677E8', teal:'#14B8A6', lab:'#8B5CF6', break:'#F59E0B', exam:'#EF4444' }[k]) + '"></span>' + TONE_LABEL[k] + '</span>';
          }).join('') + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid grid-2">' +
        UI.card({ title:'Today\u2019s Schedule', icon:'fa-clock', subtitle:today + ' classes in chronological order',
          body:'<div id="tt-today-list"></div>' }) +
        UI.card({ title:'Weekly Load Analysis', icon:'fa-chart-simple', subtitle:'Number of sessions per day',
          body:'<div class="chart-box chart-h-260"><canvas id="tt-chart"></canvas></div>' })
      + '</div>';

    /* ------------------------------------------------------------ GRID */
    document.getElementById('tt-grid').innerHTML = days.map(function (d) {
      var slots = tt[d] || [];
      return '<div class="tt-column"><div class="tt-day-head' + (d === today ? ' today' : '') + '">' + d + '</div><div class="tt-slots">' +
        (slots.length ? slots.map(function (s) {
          return '<div class="tt-slot tt-c-' + (s.tone || 'main') + '" data-slot="' + U.esc(s.code) + '">' +
            '<div class="tt-slot-time"><i class="fas fa-clock"></i> ' + U.esc(s.time) + '</div>' +
            '<div class="tt-slot-course">' + U.esc(s.course) + '</div>' +
            '<div class="tt-slot-meta"><span><i class="fas fa-user-tie"></i> ' + U.esc(s.teacher) + '</span>' +
            '<span><i class="fas fa-location-dot"></i> ' + U.esc(s.room) + '</span></div></div>';
        }).join('') : '<div class="tt-empty"><i class="fas fa-mug-hot"></i><div class="mt-8">No classes</div></div>') +
      '</div></div>';
    }).join('');

    /* ------------------------------------------------------ TODAY LIST */
    var todaySlots = tt[today] || [];
    document.getElementById('tt-today-list').innerHTML = todaySlots.length ? '<div class="list-simple">' + todaySlots.map(function (s) {
      return '<div class="list-row"><span class="resource-ico badge-' + (TONE_BADGE[s.tone] || 'blue') + '" style="width:44px;height:44px;font-size:15px;border-radius:12px"><i class="fas ' +
        (s.tone === 'lab' ? 'fa-flask' : s.tone === 'break' ? 'fa-mug-hot' : 'fa-chalkboard') + '"></i></span>' +
        '<div class="list-row-main"><strong>' + U.esc(s.course) + '</strong><span>' + U.esc(s.time) + ' \u00b7 ' + U.esc(s.room) + ' \u00b7 ' + U.esc(s.teacher) + '</span></div>' +
        UI.badge(TONE_LABEL[s.tone] || 'Class', TONE_BADGE[s.tone] || 'blue') + '</div>';
    }).join('') + '</div>' : UI.emptyState({ small:true, icon:'fa-mug-hot', title:'No classes today', message:'Enjoy the break \u2014 no sessions are scheduled for ' + today + '.' });

    /* ----------------------------------------------------------- ACTIONS */
    document.getElementById('tt-today').addEventListener('click', function () {
      var el = document.querySelector('.tt-day-head.today');
      if (el) el.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
      UI.toast('info', 'Jumped to today', today + ' \u00b7 ' + todaySlots.length + ' session' + (todaySlots.length === 1 ? '' : 's'));
    });

    document.getElementById('tt-print').addEventListener('click', function () {
      UI.toast('info', 'Opening print view', 'Use your browser print dialog to save the timetable as PDF.');
      setTimeout(function () { window.print(); }, 400);
    });

    document.getElementById('tt-export').addEventListener('click', function () {
      var rows = [];
      days.forEach(function (d) { (tt[d] || []).forEach(function (s) { rows.push({ Day:d, Time:s.time, Course:s.course, Code:s.code, Teacher:s.teacher, Room:s.room, Type:TONE_LABEL[s.tone] || 'Class' }); }); });
      U.download('srms-timetable.csv', U.toCSV(rows, ['Day','Time','Course','Code','Teacher','Room','Type']), 'text/csv');
      UI.toast('success', 'Timetable exported', 'srms-timetable.csv saved successfully.');
    });

    document.getElementById('tt-list').addEventListener('click', function () {
      var rows = [];
      days.forEach(function (d) { (tt[d] || []).forEach(function (s) { rows.push({ Day:d, Time:s.time, Course:s.course, Teacher:s.teacher, Room:s.room }); }); });
      UI.modal({ title:'Full Weekly Schedule', subtitle:'Every session listed in chronological order', size:'lg',
        body:UI.table({ compact:true, columns:[
          { key:'Day', label:'Day' }, { key:'Time', label:'Time' },
          { key:'Course', label:'Course', render:function (r) { return '<span class="cell-strong">' + U.esc(r.Course) + '</span>'; } },
          { key:'Teacher', label:'Teacher' }, { key:'Room', label:'Room' }
        ], rows:rows }),
        footer:'<button class="btn btn-outline" data-modal-close>Close</button><button class="btn btn-primary" id="tt-modal-print"><i class="fas fa-print"></i> Print</button>',
        onMount:function (m) { m.on('#tt-modal-print', 'click', function () { m.close(); setTimeout(function () { window.print(); }, 300); }); }
      });
    });

    document.getElementById('tt-grid').addEventListener('click', function (e) {
      var s = e.target.closest('[data-slot]');
      if (!s) return;
      var code = s.getAttribute('data-slot');
      if (code === 'BREAK') { UI.toast('info', 'Break time', 'Take a short break and recharge.'); return; }
      if (global.SRMS_COURSE_DETAIL) { global.SRMS_COURSE_DETAIL(code); return; }
      UI.toast('info', 'Session details', code);
    });
  }

  function afterTimetable() {
    var D = global.SRMS_DATA;
    var days = D.days || [];
    var tt = D.timetable || {};
    global.SRMS_CHARTS.bar('tt-chart', {
      labels: days.map(function (d) { return d.substring(0, 3); }),
      legend:false, unit:' sessions',
      datasets:[{ label:'Sessions', data:days.map(function (d) { return (tt[d] || []).length; }), color:'#1677E8', hover:'#1557B0', maxBarThickness:44 }]
    });
  }

  var def = { title:'Class Timetable', crumbs:['Academic','Timetable'], render:timetablePage, afterRender:afterTimetable };
  R.add('timetable', 'student', def);
  R.add('timetable', 'teacher', { title:'My Timetable', crumbs:['Account','Timetable'], render:timetablePage, afterRender:afterTimetable });
  R.add('timetable', 'admin', { title:'Timetable', crumbs:['Academic','Timetable'], render:timetablePage, afterRender:afterTimetable });
})(window);
