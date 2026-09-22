/* =============================================================================
   SRMS - Downloads  (js/pages/student/downloads.js)
   Professional file cards for result cards, transcripts, vouchers, materials,
   schedules, certificates and notices with category filtering.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { q:'', cat:'All', page:1, per:9 };

  var TYPE_TONE = { PDF:'red', ZIP:'purple', XLSX:'green', DOCX:'blue', PPTX:'yellow' };

  function buildContent(file) {
    var sp = global.SRMS_DATA.studentProfile;
    return [
      'SRMS DOCUMENT EXPORT', '===========================================',
      'Document : ' + file.name, 'File      : ' + file.file,
      'Category  : ' + file.category, 'Issued On : ' + U.fmtDateLong(file.date),
      'Student   : ' + sp.fullName, 'Student ID: ' + sp.id,
      'Program   : ' + sp.program, 'Semester  : ' + sp.semesterLabel,
      '', 'This file was generated from the SRMS student portal.',
      'For official verification contact the registrar office.'
    ].join('\r\n');
  }

  function downloadsPage(host, ctx) {
    var all = global.SRMS_DATA.downloads || [];
    var cats = ['All'].concat(U.unique(all.map(function (d) { return d.category; })));

    host.innerHTML =
      UI.pageHead({ title:'Downloads', subtitle:'Every official document, result card, transcript and course resource in one place.',
        actions:'<button class="btn btn-outline" id="dl-all"><i class="fas fa-cloud-arrow-down"></i> Download All</button>' +
                '<button class="btn btn-primary" id="dl-request"><i class="fas fa-file-circle-plus"></i> Request Document</button>' }) +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Available Files', value:all.length, suffix:'documents', icon:'fa-folder-open', tone:'blue', note:'Ready for immediate download' }) +
        UI.statCard({ title:'Official Documents', value:all.filter(function (d) { return d.category === 'Results' || d.category === 'Certificates'; }).length, suffix:'files', icon:'fa-certificate', tone:'green', note:'Verified by the registrar' }) +
        UI.statCard({ title:'Course Materials', value:all.filter(function (d) { return d.category === 'Materials'; }).length, suffix:'bundles', icon:'fa-file-zipper', tone:'purple', note:'Lecture notes and lab manuals' }) +
        UI.statCard({ title:'Total Size', value:'32 MB', icon:'fa-hard-drive', tone:'yellow', note:'Across all downloadable files' }) +
      '</div>' +

      '<div class="card card-flush">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' + UI.searchBox('dl-search', 'Search documents by name or category...', state.q) + '</div>' +
          '<div class="pill-tabs" id="dl-cats">' + UI.pillTabs(cats.map(function (c) { return { key:c, label:c }; }), state.cat) + '</div>' +
        '</div>' +
        '<div style="padding:18px 20px 20px" id="dl-body"></div>' +
      '</div>' +

      UI.card({ title:'Document Requests', icon:'fa-file-circle-plus', subtitle:'Request official documents from the registrar office',
        body:'<div class="grid grid-3">' + [
          ['Transcript Request', 'fa-scroll', 'blue', 'Official sealed transcript, 3 working days'],
          ['Bonafide Certificate', 'fa-certificate', 'green', 'Proof of enrolment, 1 working day'],
          ['Duplicate Result Card', 'fa-square-poll-vertical', 'purple', 'Reissue of a lost result card, 2 days']
        ].map(function (r) {
          return '<div class="list-row"><span class="resource-ico badge-' + r[2] + '" style="width:42px;height:42px;font-size:16px;border-radius:12px"><i class="fas ' + r[1] + '"></i></span>' +
            '<div class="list-row-main"><strong>' + r[0] + '</strong><span>' + r[3] + '</span></div>' +
            '<button class="btn btn-outline btn-xs" data-dl-req="' + U.esc(r[0]) + '">Request</button></div>';
        }).join('') + '</div>' });

    function draw() {
      var out = all.filter(function (d) {
        if (state.cat !== 'All' && d.category !== state.cat) return false;
        if (!state.q) return true;
        var q = state.q.toLowerCase();
        return (d.name + ' ' + d.file + ' ' + d.category).toLowerCase().indexOf(q) > -1;
      });
      var body = document.getElementById('dl-body');
      if (!out.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-folder-open', title:'No documents found', message:'No files match your search or category filter.',
          action:'Clear Filters', actionId:'dl-clear', actionIcon:'fa-rotate-left' });
        var c = document.getElementById('dl-clear');
        if (c) c.addEventListener('click', function () {
          state.q = ''; state.cat = 'All';
          document.getElementById('dl-search').value = '';
          U.qsa('#dl-cats .pill-tab').forEach(function (t, i) { t.classList.toggle('active', i === 0); });
          draw();
        });
        return;
      }
      var info = U.paginate(out, state.page, state.per);
      body.innerHTML = '<div class="resource-grid">' + info.items.map(function (d) {
        return '<div class="file-card" style="flex-direction:column;align-items:stretch;gap:12px">' +
          '<div class="flex gap-12"><span class="file-ico badge-' + (TYPE_TONE[d.type] || 'blue') + '"><i class="fas ' + d.icon + '"></i></span>' +
          '<div class="file-info"><strong>' + U.esc(d.name) + '</strong><span>' + U.esc(d.file) + '</span></div></div>' +
          '<div class="resource-meta"><div><span>Format</span><strong>' + U.esc(d.type) + '</strong></div>' +
            '<div><span>Size</span><strong>' + U.esc(d.size) + '</strong></div>' +
            '<div><span>Updated</span><strong>' + U.fmtDate(d.date) + '</strong></div></div>' +
          '<div class="resource-foot"><button class="btn btn-primary btn-sm" data-dl-file="' + U.esc(d.id) + '"><i class="fas fa-download"></i> Download</button>' +
          '<button class="btn btn-ghost btn-sm" data-dl-preview="' + U.esc(d.id) + '"><i class="fas fa-eye"></i> Preview</button></div></div>';
      }).join('') + '</div>' + UI.pagination(info);
    }

    var si = document.getElementById('dl-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));
    document.getElementById('dl-cats').addEventListener('click', function (e) {
      var t = e.target.closest('.pill-tab');
      if (!t) return;
      state.cat = t.getAttribute('data-pilltab'); state.page = 1;
      U.qsa('#dl-cats .pill-tab').forEach(function (x) { x.classList.toggle('active', x === t); });
      draw();
    });

    document.getElementById('dl-body').addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var d = e.target.closest('[data-dl-file]');
      if (d) {
        var file = all.filter(function (x) { return x.id === d.getAttribute('data-dl-file'); })[0];
        if (!file) return;
        setTimeout(function () {
          U.download(file.file.replace(/\.[a-z]+$/i, '.txt'), buildContent(file));
          UI.toast('success', 'Download complete', file.file + ' has been downloaded.');
        }, 380);
        return;
      }
      var pv = e.target.closest('[data-dl-preview]');
      if (pv) {
        var f2 = all.filter(function (x) { return x.id === pv.getAttribute('data-dl-preview'); })[0];
        if (!f2) return;
        UI.modal({ title:f2.name, subtitle:f2.file + ' \u00b7 ' + f2.size + ' \u00b7 ' + f2.type,
          body:'<div class="kpi-strip"><div class="kpi-cell"><div class="kpi-label">Category</div><div class="kpi-val" style="font-size:14px">' + U.esc(f2.category) + '</div></div>' +
            '<div class="kpi-cell"><div class="kpi-label">Format</div><div class="kpi-val" style="font-size:14px">' + U.esc(f2.type) + '</div></div>' +
            '<div class="kpi-cell"><div class="kpi-label">Updated</div><div class="kpi-val" style="font-size:14px">' + U.fmtDate(f2.date) + '</div></div></div>' +
            '<div class="divider"></div><pre style="white-space:pre-wrap;font-size:12px;line-height:1.7;color:#475569;background:#F7F9FC;padding:16px;border-radius:12px;border:1px solid var(--border)">' + U.esc(buildContent(f2)) + '</pre>',
          footer:'<button class="btn btn-outline" data-modal-close>Close</button><button class="btn btn-primary" id="pv-dl"><i class="fas fa-download"></i> Download</button>',
          onMount:function (m) { m.on('#pv-dl', 'click', function () { m.close(); U.download(f2.file.replace(/\.[a-z]+$/i, '.txt'), buildContent(f2)); UI.toast('success', 'Download complete', f2.file + ' saved.'); }); }
        });
      }
    });

    document.getElementById('dl-all').addEventListener('click', function () {
      UI.confirm({ title:'Download all documents?', message:'All ' + all.length + ' files will be generated and downloaded as text exports.', tone:'info', confirmText:'Download All',
        onConfirm:function () {
          all.forEach(function (f, i) {
            setTimeout(function () { U.download(f.file.replace(/\.[a-z]+$/i, '.txt'), buildContent(f)); }, i * 260);
          });
          UI.toast('success', 'Downloads started', all.length + ' documents are being downloaded.');
        } });
    });

    document.getElementById('dl-request').addEventListener('click', function () {
      UI.modal({ title:'Request Official Document', subtitle:'Requests are processed by the registrar office.',
        body:'<div class="form-grid">' +
          '<div class="form-group form-span-2"><label class="field-label">Document Type</label><div class="input-wrap no-icon"><select id="dq-type">' +
            ['Official Transcript','Bonafide Certificate','Duplicate Result Card','Migration Certificate','Character Certificate'].map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="form-group"><label class="field-label">Copies Required</label><div class="input-wrap no-icon"><input type="number" id="dq-copies" value="1" min="1" max="5"></div></div>' +
          '<div class="form-group"><label class="field-label">Urgency</label><div class="input-wrap no-icon"><select id="dq-urgency"><option>Normal (3 working days)</option><option>Urgent (1 working day)</option></select></div></div>' +
          '<div class="form-group form-span-2"><label class="field-label">Purpose</label><div class="input-wrap"><textarea id="dq-purpose" placeholder="State the purpose of this request..."></textarea></div></div>' +
        '</div><span class="field-error" id="dq-error"></span>',
        footer:'<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="dq-submit"><i class="fas fa-paper-plane"></i> Submit Request</button>',
        onMount:function (m) {
          m.on('#dq-submit', 'click', function () {
            var purpose = m.el.querySelector('#dq-purpose').value.trim();
            if (!U.minLen(purpose, 10)) { m.el.querySelector('#dq-error').textContent = 'Please state the purpose in at least 10 characters.'; return; }
            m.close();
            UI.toast('success', 'Request submitted', 'Reference #DOC-' + Math.floor(10000 + Math.random() * 89999) + '. You will be notified when it is ready.');
          });
        }
      });
    });

    host.addEventListener('click', function (e) {
      var r = e.target.closest('[data-dl-req]');
      if (r) UI.toast('info', 'Request started', 'Complete the form to request a ' + r.getAttribute('data-dl-req') + '.');
    });

    draw();
  }

  R.add('downloads', 'student', { title:'Downloads', crumbs:['Services','Downloads'], render:downloadsPage });
})(window);
