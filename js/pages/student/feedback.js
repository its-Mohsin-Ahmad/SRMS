/* =============================================================================
   SRMS - Feedback  (js/pages/student/feedback.js)
   Teacher, course, system and general feedback with a 5-star rating widget and
   a history of submitted responses.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { type:'Teacher Feedback', rating:0, target:'' };

  var TYPES = [
    { key:'Teacher Feedback', icon:'fa-chalkboard-user', tone:'blue',   desc:'Rate teaching quality, clarity and availability.' },
    { key:'Course Feedback',  icon:'fa-book-open',       tone:'purple', desc:'Share your view on course content and workload.' },
    { key:'System Feedback',  icon:'fa-laptop-code',     tone:'teal',   desc:'Report portal usability and performance issues.' },
    { key:'General Feedback', icon:'fa-comment-dots',    tone:'yellow', desc:'Any other suggestion for the university.' }
  ];

  function targetsFor(type) {
    var D = global.SRMS_DATA;
    if (type === 'Teacher Feedback') return D.teachers.map(function (t) { return { value:t.name, label:t.name + ' \u00b7 ' + t.dept }; });
    if (type === 'Course Feedback') return D.courses.map(function (c) { return { value:c.code + ' - ' + c.name, label:c.code + ' - ' + c.name }; });
    if (type === 'System Feedback') return [{ value:'SRMS Portal', label:'SRMS Student Portal' }, { value:'Mobile View', label:'Mobile Experience' }, { value:'Reports', label:'Reports and Downloads' }];
    return [{ value:'Academic Office', label:'Academic Office' }, { value:'Examination Section', label:'Examination Section' }, { value:'Library', label:'Central Library' }, { value:'Administration', label:'University Administration' }];
  }

  function feedbackPage(host, ctx) {
    var D = global.SRMS_DATA;
    var history = D.feedbackRecords || [];
    var avgRating = history.length ? U.avg(history, 'rating') : 0;

    host.innerHTML =
      UI.pageHead({ title:'Feedback', subtitle:'Your feedback helps improve teaching quality, course design and the portal experience.',
        actions:'<button class="btn btn-outline" id="fb-history"><i class="fas fa-clock-rotate-left"></i> My Feedback History</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Feedback Submitted', value:history.length, suffix:'responses', icon:'fa-comment-check', tone:'blue', note:'Across all categories' }) +
        UI.statCard({ title:'Average Rating Given', value:U.fmtGpa(avgRating), suffix:'/ 5.00', icon:'fa-star', tone:'yellow', note:'Your overall rating pattern' }) +
        UI.statCard({ title:'Reviewed', value:history.filter(function (h) { return h.status === 'Reviewed'; }).length, suffix:'responses', icon:'fa-circle-check', tone:'green', note:'Acknowledged by departments' }) +
        UI.statCard({ title:'Pending Action', value:history.filter(function (h) { return h.status === 'Submitted'; }).length, suffix:'responses', icon:'fa-hourglass-half', tone:'purple', note:'Under review by the committee' }) +
      '</div>' +

      '<div class="grid grid-main-side">' +
        '<div class="card">' +
          '<div class="card-head"><div><h3><i class="fas fa-comment-pen"></i> Submit New Feedback</h3><p>Choose a category, pick a target and share your experience.</p></div></div>' +

          '<div class="grid grid-4 mb-16" id="fb-types">' + TYPES.map(function (t) {
            return '<button class="feedback-tile' + (t.key === state.type ? ' selected' : '') + '" data-fb-type="' + t.key + '">' +
              '<span class="feedback-tile-ico badge-' + t.tone + '"><i class="fas ' + t.icon + '"></i></span>' +
              '<strong style="display:block;font-size:13px">' + t.key + '</strong>' +
              '<span class="text-mute text-xs" style="display:block;margin-top:5px;line-height:1.5">' + t.desc + '</span></button>';
          }).join('') + '</div>' +

          '<div class="form-grid">' +
            '<div class="form-group"><label class="field-label">Feedback Target</label><div class="input-wrap no-icon"><select id="fb-target"></select></div></div>' +
            '<div class="form-group"><label class="field-label">Rating</label>' + UI.rating('fb-rating', state.rating) +
              '<span class="helper-text" id="fb-rating-label">Select a rating from 1 to 5 stars</span></div>' +
            '<div class="form-group form-span-2"><label class="field-label">Your Feedback</label>' +
              '<div class="input-wrap"><textarea id="fb-comment" placeholder="Describe your experience, what worked well and what could be improved..."></textarea></div>' +
              '<span class="helper-text">Minimum 15 characters. Your response is anonymous to the recipient.</span></div>' +
            '<div class="form-group form-span-2"><label class="checkbox-label"><input type="checkbox" id="fb-anon"><span class="checkbox-box"><i class="fas fa-check"></i></span> Submit this feedback anonymously</label></div>' +
          '</div>' +
          '<span class="field-error" id="fb-error"></span>' +
          '<div class="form-actions"><button class="btn btn-primary" id="fb-submit"><i class="fas fa-paper-plane"></i> Submit Feedback</button>' +
          '<button class="btn btn-outline" id="fb-reset"><i class="fas fa-rotate-left"></i> Clear Form</button></div>' +
        '</div>' +

        '<div class="grid" style="gap:18px">' +
          UI.card({ title:'Rating Guide', icon:'fa-circle-info',
            body:'<div class="list-simple">' + [
              ['5 stars', 'Exceptional \u2014 exceeded expectations', 'green'],
              ['4 stars', 'Excellent \u2014 strong experience', 'blue'],
              ['3 stars', 'Good \u2014 meets expectations', 'teal'],
              ['2 stars', 'Fair \u2014 needs improvement', 'yellow'],
              ['1 star',  'Poor \u2014 serious concerns', 'red']
            ].map(function (r) {
              return '<div class="list-row"><span class="resource-ico badge-' + r[2] + '" style="width:34px;height:34px;font-size:13px;border-radius:10px"><i class="fas fa-star"></i></span>' +
                '<div class="list-row-main"><strong>' + r[0] + '</strong><span>' + r[1] + '</span></div></div>';
            }).join('') + '</div>' }) +
          UI.card({ title:'How Your Feedback Is Used', icon:'fa-lightbulb',
            body:UI.timeline([
              { title:'Submitted', text:'Your response is recorded against the selected category.', tone:'green' },
              { title:'Reviewed', text:'The quality assurance cell reviews every response within 7 days.', tone:'yellow' },
              { title:'Actioned', text:'Recurring themes drive measurable improvements each semester.', tone:'purple' }
            ]) }) +
        '</div>' +
      '</div>';

    /* -------------------------------------------------- TARGET SELECT */
    function fillTargets() {
      var sel = document.getElementById('fb-target');
      var opts = targetsFor(state.type);
      sel.innerHTML = opts.map(function (o) { return '<option value="' + U.esc(o.value) + '">' + U.esc(o.label) + '</option>'; }).join('');
      state.target = opts.length ? opts[0].value : '';
    }
    fillTargets();
    UI.bindRating('fb-rating', function (v) {
      state.rating = v;
      var labels = ['', 'Poor', 'Fair', 'Good', 'Excellent', 'Exceptional'];
      document.getElementById('fb-rating-label').textContent = v + ' of 5 \u2014 ' + labels[v];
    });

    document.getElementById('fb-types').addEventListener('click', function (e) {
      var t = e.target.closest('[data-fb-type]');
      if (!t) return;
      state.type = t.getAttribute('data-fb-type');
      U.qsa('#fb-types .feedback-tile').forEach(function (x) { x.classList.toggle('selected', x === t); });
      fillTargets();
    });

    document.getElementById('fb-target').addEventListener('change', function () { state.target = this.value; });

    document.getElementById('fb-submit').addEventListener('click', function () {
      var comment = document.getElementById('fb-comment').value.trim();
      var err = document.getElementById('fb-error');
      var rating = Number(document.getElementById('fb-rating').getAttribute('data-rating'));
      if (!rating) { err.textContent = 'Please select a star rating before submitting.'; return; }
      if (!U.minLen(comment, 15)) { err.textContent = 'Feedback must be at least 15 characters long.'; return; }
      err.textContent = '';
      var anon = document.getElementById('fb-anonymity');

      UI.confirm({ title:'Submit this feedback?', message:'Your ' + state.type.toLowerCase() + ' for \u201c' + state.target + '\u201d will be recorded.', tone:'info', confirmText:'Submit',
        onConfirm:function () {
          (global.SRMS_DATA.feedbackRecords || []).unshift({
            id:'FB-' + Math.floor(10 + Math.random() * 89), type:state.type, target:state.target,
            rating:rating, comment:comment, date:U.todayISO(), status:'Submitted'
          });
          document.getElementById('fb-comment').value = '';
          document.getElementById('fb-rating').setAttribute('data-rating', '0');
          U.qsa('#fb-rating .rating-star').forEach(function (s) { s.classList.remove('active'); });
          document.getElementById('fb-rating-label').textContent = 'Select a rating from 1 to 5 stars';
          state.rating = 0;
          UI.toast('success', 'Feedback submitted', 'Thank you. Your response has been recorded for review.');
          R.reRender({ role:ctx.role, user:ctx.user, go:ctx.go });
        } });
    });

    document.getElementById('fb-reset').addEventListener('click', function () {
      document.getElementById('fb-comment').value = '';
      document.getElementById('fb-rating').setAttribute('data-rating', '0');
      U.qsa('#fb-rating .rating-star').forEach(function (s) { s.classList.remove('active'); });
      document.getElementById('fb-error').textContent = '';
      state.rating = 0;
      UI.toast('info', 'Form cleared', 'You can start a new feedback response.');
    });

    document.getElementById('fb-history').addEventListener('click', function () {
      var recs = global.SRMS_DATA.feedbackRecords || [];
      UI.modal({ title:'My Feedback History', subtitle:'Every response you have submitted through the portal', size:'lg',
        body: recs.length ? '<div class="list-simple">' + recs.map(function (r) {
          return '<div class="list-row" style="align-items:flex-start"><span class="resource-ico badge-blue" style="width:38px;height:38px;font-size:14px;border-radius:11px"><i class="fas fa-comment"></i></span>' +
            '<div class="list-row-main"><strong>' + U.esc(r.type) + ' \u2192 ' + U.esc(r.target) + '</strong>' +
            '<span style="display:block;margin-top:3px;line-height:1.6">' + U.esc(r.comment) + '</span>' +
            '<span class="text-xs text-mute" style="display:block;margin-top:6px">' + U.fmtDate(r.date) + ' \u00b7 ' + U.esc(r.status) + '</span></div>' +
            '<span class="badge badge-yellow"><i class="fas fa-star"></i> ' + r.rating + '</span></div>';
        }).join('') + '</div>' : UI.emptyState({ small:true, icon:'fa-comment-slash', title:'No feedback yet', message:'Your submitted feedback will appear here.' }),
        footer:'<button class="btn btn-outline" data-modal-close>Close</button>' });
    });
  }

  R.add('feedback', 'student', { title:'Feedback', crumbs:['Services','Feedback'], render:feedbackPage });
})(window);

