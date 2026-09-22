/* =============================================================================
   SRMS - Library  (js/pages/student/library.js)
   Book search, category filters, availability tracking, issued books with due
   dates and borrow / reserve / details actions.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var UI = global.SRMS_UI;
  var R = global.SRMS_ROUTES;

  var state = { q:'', cat:'All', avail:'All', sort:'title', page:1, per:6 };
  var TONES = ['#1677E8','#8B5CF6','#14B8A6','#22C55E','#F59E0B','#EC4899'];

  function filtered() {
    var out = (global.SRMS_DATA.books || []).slice();
    if (state.q) {
      var q = state.q.toLowerCase();
      out = out.filter(function (b) { return (b.title + ' ' + b.author + ' ' + b.isbn + ' ' + b.category).toLowerCase().indexOf(q) > -1; });
    }
    if (state.cat !== 'All') out = out.filter(function (b) { return b.category === state.cat; });
    if (state.avail !== 'All') out = out.filter(function (b) { return b.availability === state.avail; });
    return U.sortBy(out, state.sort, state.sort === 'rating' ? 'desc' : 'asc');
  }

  function availTone(a) { return a === 'Available' ? 'green' : a === 'Issued' ? 'red' : a === 'Reserved' ? 'yellow' : 'gray'; }

  function bookCard(b) {
    return '<article class="resource-card" data-book="' + U.esc(b.id) + '">' +
      '<div class="book-cover" style="background:linear-gradient(150deg,' + b.tone + 'CC,' + b.tone + ')"><i class="fas fa-book"></i></div>' +
      '<div><h3 class="resource-title">' + U.esc(b.title) + '</h3>' +
      '<p class="resource-sub"><i class="fas fa-user-pen"></i> ' + U.esc(b.author) + '</p></div>' +
      '<div class="resource-meta">' +
        '<div><span>ISBN</span><strong>' + U.esc(b.isbn) + '</strong></div>' +
        '<div><span>Category</span><strong>' + U.esc(b.category) + '</strong></div>' +
        '<div><span>Availability</span><strong>' + UI.badge(b.availability, availTone(b.availability)) + '</strong></div>' +
        '<div><span>Copies</span><strong>' + b.available + ' of ' + b.copies + '</strong></div>' +
        '<div><span>Rating</span><strong><i class="fas fa-star text-yellow"></i> ' + b.rating + '</strong></div>' +
      '</div>' +
      '<div class="resource-foot">' +
        (b.availability === 'Available' ? '<button class="btn btn-primary btn-sm" data-bk-borrow="' + U.esc(b.id) + '"><i class="fas fa-hand-holding"></i> Borrow</button>' :
         b.availability === 'Issued' ? '<button class="btn btn-outline btn-sm" data-bk-reserve="' + U.esc(b.id) + '"><i class="fas fa-bookmark"></i> Reserve</button>' :
         '<button class="btn btn-outline btn-sm btn-block" disabled><i class="fas fa-clock"></i> Reserved</button>') +
        '<button class="btn btn-ghost btn-sm" data-bk-detail="' + U.esc(b.id) + '"><i class="fas fa-eye"></i> Details</button></div></article>';
  }

  function libraryPage(host, ctx) {
    var D = global.SRMS_DATA;
    var books = D.books || [];
    var issued = D.issuedBooks || [];
    var cats = U.unique(books.map(function (b) { return b.category; })).sort();
    var overdue = issued.filter(function (i) { return i.status === 'Overdue'; });

    host.innerHTML =
      UI.pageHead({ title:'Library', subtitle:'Search the catalogue, track issued books and manage due dates.',
        actions:'<button class="btn btn-outline" id="lb-history"><i class="fas fa-clock-rotate-left"></i> Borrowing History</button>' +
                '<button class="btn btn-primary" id="lb-issued"><i class="fas fa-book-bookmark"></i> My Issued Books (' + issued.length + ')</button>' }) +

      (overdue.length ? '<div class="mb-16">' + UI.alert({ tone:'danger', title:'Overdue library books',
        message:overdue.length + ' book' + (overdue.length > 1 ? 's are' : ' is') + ' past the due date. Total fine accrued: PKR ' + U.sum(overdue, 'fine') + '. Please return them to avoid further charges.' }) + '</div>' :
        '<div class="mb-16">' + UI.alert({ tone:'success', title:'Library account in good standing', message:'No overdue books and no outstanding fines on your account.' }) + '</div>') +

      '<div class="grid grid-4 mb-16">' +
        UI.statCard({ title:'Catalogue Size', value:books.length, suffix:'titles', icon:'fa-book', tone:'blue', note:'Available in the central library' }) +
        UI.statCard({ title:'Currently Issued', value:issued.length, suffix:'books', icon:'fa-book-bookmark', tone:'purple', note:'On loan to your account' }) +
        UI.statCard({ title:'Available Now', value:books.filter(function (b) { return b.availability === 'Available'; }).length, suffix:'titles', icon:'fa-circle-check', tone:'green', note:'Ready to borrow immediately' }) +
        UI.statCard({ title:'Outstanding Fines', value:'PKR ' + U.sum(issued, 'fine'), icon:'fa-coins', tone:'yellow', note:'Pending clearance at the circulation desk' }) +
      '</div>' +

      '<div class="card card-flush mb-16">' +
        '<div class="table-toolbar" style="padding:18px 20px 0">' +
          '<div class="table-tools">' + UI.searchBox('lb-search', 'Search by title, author, ISBN or category...', state.q) +
            UI.selectBox('lb-cat', [{ value:'All', label:'All Categories' }].concat(cats.map(function (c) { return { value:c, label:c }; })), state.cat, 'Filter by category') +
            UI.selectBox('lb-avail', ['All','Available','Issued','Reserved'], state.avail, 'Filter by availability') +
            UI.selectBox('lb-sort', [{ value:'title', label:'Sort: Title' }, { value:'author', label:'Sort: Author' }, { value:'rating', label:'Sort: Rating' }], state.sort, 'Sort books') + '</div>' +
        '</div>' +
        '<div style="padding:18px 20px 20px" id="lb-body"></div>' +
      '</div>' +

      UI.card({ title:'Currently Issued to You', icon:'fa-book-bookmark', subtitle:'Return dates and accrued fines for books on loan',
        body:'<div id="lb-issued-table"></div>' });

    function draw() {
      var out = filtered();
      var body = document.getElementById('lb-body');
      if (!out.length) {
        body.innerHTML = UI.emptyState({ icon:'fa-book-open-reader', title:'No books found', message:'No titles match your current search and filters.',
          action:'Clear Filters', actionId:'lb-clear', actionIcon:'fa-rotate-left' });
        var c = document.getElementById('lb-clear');
        if (c) c.addEventListener('click', function () {
          state.q = ''; state.cat = 'All'; state.avail = 'All';
          document.getElementById('lb-search').value = '';
          document.getElementById('lb-cat').value = 'All';
          document.getElementById('lb-avail').value = 'All';
          draw();
        });
        return;
      }
      var info = U.paginate(out, state.page, state.per);
      body.innerHTML = '<div class="resource-grid">' + info.items.map(bookCard).join('') + '</div>' + UI.pagination(info);
    }

    var si = document.getElementById('lb-search');
    si.addEventListener('input', U.debounce(function () { state.q = si.value; state.page = 1; draw(); }, 200));
    ['lb-cat','lb-avail'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        if (id === 'lb-cat') state.cat = this.value; else state.avail = this.value;
        state.page = 1; draw();
      });
    });
    document.getElementById('lb-sort').addEventListener('change', function () { state.sort = this.value; draw(); });

    document.getElementById('lb-body').addEventListener('click', function (e) {
      var p = e.target.closest('[data-page]');
      if (p) { state.page = Number(p.getAttribute('data-page')); draw(); window.scrollTo({ top:0, behavior:'smooth' }); return; }
      var bo = e.target.closest('[data-bk-borrow]');
      if (bo) { borrow(bo.getAttribute('data-bk-borrow'), draw); return; }
      var re = e.target.closest('[data-bk-reserve]');
      if (re) { reserve(re.getAttribute('data-bk-reserve'), draw); return; }
      var de = e.target.closest('[data-bk-detail]');
      if (de) { detail(de.getAttribute('data-bk-detail')); return; }
      var cd = e.target.closest('[data-book]');
      if (cd) detail(cd.getAttribute('data-book'));
    });

    document.getElementById('lb-issued-table').innerHTML = issued.length ? UI.table({
      columns:[
        { key:'book', label:'Book Title', render:function (i) { return '<span class="cell-strong">' + U.esc(i.book) + '</span><div class="cell-mute">' + U.esc(i.code) + '</div>'; } },
        { key:'issued', label:'Issued On', render:function (i) { return U.fmtDate(i.issued); } },
        { key:'due', label:'Due Date', render:function (i) { return U.fmtDate(i.due); } },
        { key:'days', label:'Days Left', className:'center', render:function (i) {
          var d = U.daysBetween(U.todayISO(), i.due);
          return d < 0 ? '<span class="badge badge-red">' + Math.abs(d) + ' days late</span>' : '<span class="badge badge-' + (d <= 3 ? 'yellow' : 'green') + '">' + d + ' days</span>';
        } },
        { key:'fine', label:'Fine', className:'num', render:function (i) { return i.fine ? '<span class="text-red">PKR ' + i.fine + '</span>' : '<span class="text-mute">--</span>'; } },
        { key:'status', label:'Status', render:function (i) { return UI.statusBadge(i.status); } },
        { key:'actions', label:'', sortable:false, render:function (i) { return '<button class="btn btn-outline btn-xs" data-bk-renew="' + U.esc(i.id) + '"><i class="fas fa-rotate"></i> Renew</button>'; } }
      ],
      rows:issued
    }) + UI.dataCards(issued, function (i) {
      return '<div class="data-card"><div class="data-card-head"><strong>' + U.esc(i.book) + '</strong>' + UI.statusBadge(i.status) + '</div>' +
        '<div class="data-card-grid"><div><div class="dc-label">Issued</div><div class="dc-value">' + U.fmtDate(i.issued) + '</div></div>' +
        '<div><div class="dc-label">Due</div><div class="dc-value">' + U.fmtDate(i.due) + '</div></div>' +
        '<div><div class="dc-label">Fine</div><div class="dc-value">' + (i.fine ? 'PKR ' + i.fine : 'None') + '</div></div>' +
        '<div><div class="dc-label">Code</div><div class="dc-value">' + U.esc(i.code) + '</div></div></div></div>';
    }) : UI.emptyState({ small:true, icon:'fa-book-open', title:'No issued books', message:'You currently have no books on loan from the library.' });

    document.getElementById('lb-issued-table').addEventListener('click', function (e) {
      var r = e.target.closest('[data-bk-renew]');
      if (!r) return;
      var id = r.getAttribute('data-bk-renew');
      var item = issued.filter(function (i) { return i.id === id; })[0];
      UI.confirm({ title:'Renew this book?', message:'The due date for \u201c' + (item ? item.book : '') + '\u201d will be extended by 14 days.', tone:'info', confirmText:'Renew',
        onConfirm:function () {
          if (item) {
            var d = U.toDate(item.due); d.setDate(d.getDate() + 14);
            item.due = d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate();
            item.status = 'Issued'; item.fine = 0;
          }
          UI.toast('success', 'Book renewed', 'The due date has been extended by 14 days.');
          R.reRender({ role:ctx.role, user:ctx.user, go:ctx.go });
        } });
    });

    document.getElementById('lb-issued').addEventListener('click', function () {
      document.getElementById('lb-issued-table').scrollIntoView({ behavior:'smooth', block:'center' });
      UI.toast('info', 'Issued books', 'Scroll down to review your current loans.');
    });

    document.getElementById('lb-history').addEventListener('click', function () {
      UI.modal({ title:'Borrowing History', subtitle:'Books you have borrowed in the last academic year', size:'lg',
        body:UI.table({ compact:true, columns:[
          { key:'book', label:'Book' }, { key:'issued', label:'Issued', render:function (r) { return U.fmtDate(r.issued); } },
          { key:'due', label:'Returned', render:function (r) { return U.fmtDate(r.due); } },
          { key:'status', label:'Status', render:function (r) { return UI.badge('Returned', 'green'); } }
        ], rows:issued.concat([
          { book:'Software Engineering: A Practitioner Approach', issued:'2026-06-02', due:'2026-06-24' },
          { book:'Computer Networking: A Top-Down Approach', issued:'2026-04-11', due:'2026-05-03' },
          { book:'Introduction to Algorithms', issued:'2026-02-18', due:'2026-03-12' }
        ]) }),
        footer:'<button class="btn btn-outline" data-modal-close>Close</button>' });
    });

    draw();
  }

  function borrow(id, onDone) {
    var b = (global.SRMS_DATA.books || []).filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    UI.confirm({ title:'Borrow this book?', message:'\u201c' + b.title + '\u201d will be issued to your account for 21 days.', tone:'info', confirmText:'Confirm Borrow',
      onConfirm:function () {
        b.available = Math.max(0, b.available - 1);
        if (b.available === 0) b.availability = 'Issued';
        var d = new Date(); d.setDate(d.getDate() + 21);
        (global.SRMS_DATA.issuedBooks || []).push({
          id:'IS-' + Math.floor(10 + Math.random() * 89), book:b.title, code:b.id,
          issued:U.todayISO(), due:d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate(),
          status:'Issued', fine:0
        });
        UI.toast('success', 'Book issued', 'Collect \u201c' + b.title + '\u201d from shelf ' + b.shelf + '. Return by ' + U.fmtDate(d) + '.');
        onDone();
      } });
  }

  function reserve(id, onDone) {
    var b = (global.SRMS_DATA.books || []).filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    UI.confirm({ title:'Reserve this book?', message:'You will be notified when \u201c' + b.title + '\u201d becomes available.', tone:'info', confirmText:'Reserve',
      onConfirm:function () {
        b.availability = 'Reserved';
        UI.toast('success', 'Reservation placed', 'You are next in the queue for \u201c' + b.title + '\u201d.');
        onDone();
      } });
  }

  function detail(id) {
    var b = (global.SRMS_DATA.books || []).filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    UI.modal({
      title:b.title, subtitle:b.author + ' \u00b7 ' + b.category, size:'lg',
      body:'<div class="flex gap-16 flex-wrap mb-16">' +
        '<div class="book-cover" style="width:130px;background:linear-gradient(150deg,' + b.tone + 'CC,' + b.tone + ')"><i class="fas fa-book"></i></div>' +
        '<div style="flex:1;min-width:220px"><div class="chip-row mb-12">' + UI.badge(b.availability, availTone(b.availability)) + UI.badge(b.category, 'blue') + UI.badge('Rating ' + b.rating, 'yellow', 'fa-star') + '</div>' +
        '<dl class="info-grid">' +
          '<div class="info-item"><dt>Author</dt><dd>' + U.esc(b.author) + '</dd></div>' +
          '<div class="info-item"><dt>Publisher</dt><dd>' + U.esc(b.publisher) + '</dd></div>' +
          '<div class="info-item"><dt>ISBN</dt><dd>' + U.esc(b.isbn) + '</dd></div>' +
          '<div class="info-item"><dt>Shelf Location</dt><dd>' + U.esc(b.shelf) + '</dd></div>' +
          '<div class="info-item"><dt>Total Copies</dt><dd>' + b.copies + '</dd></div>' +
          '<div class="info-item"><dt>Available Copies</dt><dd>' + b.available + '</dd></div>' +
        '</dl></div></div>' +
        '<p class="text-soft" style="line-height:1.75">This title is part of the central library collection and supports the ' + U.esc(b.category) + ' curriculum. Reference copies are available for in-library use only, while lending copies can be borrowed for 21 days and renewed once.</p>',
      footer:'<button class="btn btn-outline" data-modal-close>Close</button>' +
             (b.availability === 'Available' ? '<button class="btn btn-primary" id="bd-borrow"><i class="fas fa-hand-holding"></i> Borrow Now</button>' : '<button class="btn btn-primary" id="bd-reserve"><i class="fas fa-bookmark"></i> Reserve</button>'),
      onMount:function (m) {
        m.on('#bd-borrow', 'click', function () { m.close(); borrow(id, function () { R.reRender({ role:global.SRMS_APP.currentRole(), user:global.SRMS_APP.currentUser(), go:global.SRMS_APP.go }); }); });
        m.on('#bd-reserve', 'click', function () { m.close(); reserve(id, function () { R.reRender({ role:global.SRMS_APP.currentRole(), user:global.SRMS_APP.currentUser(), go:global.SRMS_APP.go }); }); });
      }
    });
  }

  var def = { title:'Library', crumbs:['Services','Library'], render:libraryPage };
  R.add('library', 'student', def);
  R.add('library', 'teacher', { title:'Library', crumbs:['Services','Library'], render:libraryPage });
  R.add('library', 'admin', { title:'Library', crumbs:['Content','Library'], render:libraryPage });
})(window);
