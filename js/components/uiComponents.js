/* =============================================================================
   SRMS - UI Component Library  (js/components/uiComponents.js)
   Reusable markup builders: cards, stats, badges, tables, pagination, modals,
   toasts, tabs, alerts, empty/loading/error states, rating, avatars, timeline.
   ========================================================================== */
(function (global) {
  'use strict';
  var U = global.SRMS_UTIL;
  var esc = U.esc;

  /* ------------------------------------------------------------------ TOAST */
  var toastIcons = { success:'fa-circle-check', error:'fa-circle-xmark', warning:'fa-triangle-exclamation', info:'fa-circle-info' };

  function toast(type, title, message, ms) {
    var host = document.getElementById('toast-container');
    if (!host) return null;
    var node = document.createElement('div');
    node.className = 'toast toast-' + (type || 'info');
    node.setAttribute('role', 'status');
    node.innerHTML =
      '<div class="toast-ico"><i class="fas ' + (toastIcons[type] || toastIcons.info) + '"></i></div>' +
      '<div class="toast-body"><strong>' + esc(title || 'Notice') + '</strong>' +
      (message ? '<p>' + esc(message) + '</p>' : '') + '</div>' +
      '<button class="toast-close" aria-label="Dismiss"><i class="fas fa-xmark"></i></button>';
    host.appendChild(node);
    var timer = setTimeout(close, ms || 4200);
    function close() {
      clearTimeout(timer);
      node.classList.add('removing');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 240);
    }
    node.querySelector('.toast-close').addEventListener('click', close);
    return { close: close, node: node };
  }

  /* ------------------------------------------------------------------ MODAL */
  var openModal = null;

  function modal(opts) {
    var root = document.getElementById('modal-root');
    if (!root) return null;
    closeModal();

    var size = opts.size ? ' modal-' + opts.size : '';
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', opts.title || 'Dialog');

    var closeBtn = opts.closable === false ? '' :
      '<button class="modal-close" data-modal-close aria-label="Close dialog"><i class="fas fa-xmark"></i></button>';

    overlay.innerHTML =
      '<div class="modal' + size + '">' +
        (opts.title ? '<div class="modal-head"><div><h3>' + esc(opts.title) + '</h3>' +
          (opts.subtitle ? '<p>' + esc(opts.subtitle) + '</p>' : '') + '</div>' + closeBtn + '</div>' : '') +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') +
      '</div>';

    root.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var modalEl = overlay.querySelector('.modal');

    function onKey(e) {
      if (e.key === 'Escape' && opts.closable !== false) closeModal();
      if (e.key === 'Tab') trapFocus(e, modalEl);
    }
    document.addEventListener('keydown', onKey);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay && opts.closable !== false) closeModal();
      var c = e.target.closest('[data-modal-close]');
      if (c) closeModal();
    });

    var api = {
      el: modalEl,
      body: modalEl.querySelector('.modal-body'),
      close: closeModal,
      on: function (sel, evt, fn) {
        var t = modalEl.querySelector(sel);
        if (t) t.addEventListener(evt, fn);
      }
    };

    openModal = { overlay: overlay, api: api, onKey: onKey };
    setTimeout(function () {
      var f = modalEl.querySelector('input,select,textarea,button');
      if (f) f.focus();
    }, 60);
    if (typeof opts.onMount === 'function') opts.onMount(api);
    return api;
  }

  function trapFocus(e, container) {
    var focusables = container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function closeModal() {
    if (!openModal) return;
    document.removeEventListener('keydown', openModal.onKey);
    if (openModal.overlay.parentNode) openModal.overlay.parentNode.removeChild(openModal.overlay);
    document.body.style.overflow = '';
    openModal = null;
  }

  /* ---------------------------------------------------------- CONFIRM DIALOG */
  function confirm(opts) {
    var tone = opts.tone || 'warning';
    var icons = { danger:'fa-triangle-exclamation', warning:'fa-circle-exclamation', info:'fa-circle-info', success:'fa-circle-check' };
    return modal({
      size:'sm',
      closable:true,
      title:'',
      body:
        '<div class="modal-confirm-text">' +
          '<div class="modal-icon-top ' + tone + '"><i class="fas ' + (icons[tone] || icons.warning) + '"></i></div>' +
          '<h3>' + esc(opts.title || 'Are you sure?') + '</h3>' +
          '<p>' + esc(opts.message || '') + '</p>' +
        '</div>',
      footer:
        '<button class="btn btn-outline" data-modal-close>' + esc(opts.cancelText || 'Cancel') + '</button>' +
        '<button class="btn ' + (tone === 'danger' ? 'btn-danger' : 'btn-primary') + '" id="confirm-ok">' +
          esc(opts.confirmText || 'Confirm') + '</button>',
      onMount: function (m) {
        m.on('#confirm-ok', 'click', function () {
          if (typeof opts.onConfirm === 'function') opts.onConfirm();
          m.close();
        });
      }
    });
  }

  /* ---------------------------------------------------------------- AVATAR */
  function avatar(name, size, tone) {
    var s = size || 'sm';
    return '<div class="avatar avatar-' + s + '" aria-hidden="true">' + esc(U.initials(name)) + '</div>';
  }

  /* ----------------------------------------------------------------- BADGE */
  function badge(text, tone, icon) {
    return '<span class="badge badge-' + (tone || 'gray') + '">' +
      (icon ? '<i class="fas ' + icon + '"></i>' : '') + esc(text) + '</span>';
  }

  function statusBadge(status) {
    return badge(status, U.toneForStatus(status));
  }

  function gradePill(grade) {
    var g = String(grade || '-');
    var cls = 'grade-' + g.toLowerCase().replace('+', '-plus').replace('-', '').replace('plus', 'plus');
    if (g === 'A+') cls = 'grade-a-plus';
    else if (g === 'A') cls = 'grade-a';
    else if (g === 'A-') cls = 'grade-a';
    else if (g === 'B+') cls = 'grade-b-plus';
    else if (g === 'B') cls = 'grade-b';
    else if (g === 'B-') cls = 'grade-b';
    else if (g === 'C+') cls = 'grade-c-plus';
    else if (g === 'C') cls = 'grade-c';
    else if (g === 'D') cls = 'grade-d';
    else if (g === 'F') cls = 'grade-f';
    return '<span class="grade-pill ' + cls + '">' + esc(g) + '</span>';
  }

  /* ------------------------------------------------------------- PROGRESS */
  function progress(value, tone, large) {
    var pct = U.clamp(Number(value) || 0, 0, 100);
    var t = tone || (pct >= 85 ? 'green' : pct >= 70 ? '' : pct >= 55 ? 'yellow' : 'red');
    return '<div class="progress' + (large ? ' progress-lg' : '') + '" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
      '<div class="progress-bar ' + t + '" style="width:' + pct + '%"></div></div>';
  }

  function progressRow(value, tone) {
    return '<div class="progress-row">' + progress(value, tone) + '<span class="pct">' + Math.round(Number(value) || 0) + '%</span></div>';
  }

  /* ------------------------------------------------------------------ CARD */
  function card(opts) {
    return '<section class="card' + (opts.hover ? ' card-hover' : '') + (opts.flush ? ' card-flush' : '') + (opts.className ? ' ' + opts.className : '') + '">' +
      (opts.title ? '<div class="card-head"><div><h3>' + (opts.icon ? '<i class="fas ' + opts.icon + '"></i>' : '') + esc(opts.title) + '</h3>' +
        (opts.subtitle ? '<p>' + esc(opts.subtitle) + '</p>' : '') + '</div>' +
        (opts.actions ? '<div class="card-head-actions">' + opts.actions + '</div>' : '') + '</div>' : '') +
      (opts.body || '') + '</section>';
  }

  /* ------------------------------------------------------------- STAT CARD */
  function statCard(o) {
    var tone = o.tone || 'blue';
    var trend = '';
    if (o.trend) {
      var dir = o.trend.dir || 'up';
      var ic = dir === 'up' ? 'fa-arrow-trend-up' : dir === 'down' ? 'fa-arrow-trend-down' : 'fa-minus';
      trend = '<span class="trend ' + dir + '"><i class="fas ' + ic + '"></i>' + esc(o.trend.value) + '</span>';
    }
    return '<article class="stat-card' + (o.onClick ? ' clickable' : '') + '"' + (o.onClick ? ' data-action="' + o.onClick + '" role="button" tabindex="0"' : '') + '>' +
      '<div class="stat-top">' +
        '<div class="stat-ico ' + tone + '"><i class="fas ' + (o.icon || 'fa-chart-simple') + '"></i></div>' +
        trend +
      '</div>' +
      '<div class="stat-title">' + esc(o.title) + '</div>' +
      '<div class="stat-value">' + o.value + (o.suffix ? ' <small>' + esc(o.suffix) + '</small>' : '') + '</div>' +
      (o.note ? '<div class="stat-foot"><span class="stat-note">' + esc(o.note) + '</span></div>' : '') +
    '</article>';
  }

  /* ----------------------------------------------------------------- TABLE */
  function table(o) {
    var cols = o.columns || [];
    var rows = o.rows || [];
    if (!rows.length) {
      return o.emptyHtml || emptyState({ title:o.emptyTitle || 'No records found', message:o.emptyMessage || 'There is nothing to display here yet.', icon:o.emptyIcon || 'fa-inbox' });
    }
    var head = cols.map(function (c) {
      var sortable = c.sortable !== false && o.sortKey !== undefined;
      var sorted = o.sortKey === c.key ? ' sorted' : '';
      var ind = '';
      if (sortable) {
        var dir = o.sortKey === c.key && o.sortDir === 'desc' ? 'fa-arrow-down-short-wide' : 'fa-arrow-up-short-wide';
        ind = '<i class="fas ' + dir + ' sort-ind"></i>';
      }
      return '<th' + (sortable ? ' class="sortable' + sorted + '" data-sort="' + c.key + '"' : '') + '>' + esc(c.label) + ind + '</th>';
    }).join('');

    var body = rows.map(function (r, i) {
      return '<tr' + (o.rowData ? ' ' + o.rowData(r, i) : '') + '>' + cols.map(function (c) {
        var v = typeof c.render === 'function' ? c.render(r, i) : esc(r[c.key]);
        return '<td class="' + (c.className || '') + '">' + (v === undefined || v === null || v === '' ? '<span class="text-mute">--</span>' : v) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    return '<div class="table-wrap"><table class="table' + (o.compact ? ' table-compact' : '') + '" role="table">' +
      '<thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  /* ------------------------------------------------------------ PAGINATION */
  function pagination(info) {
    if (!info || info.pages <= 1) {
      return '<div class="pagination"><span class="pagination-info">Showing ' + (info ? info.total : 0) + ' record' + ((info && info.total === 1) ? '' : 's') + '</span></div>';
    }
    var from = info.start + 1, to = Math.min(info.start + info.perPage, info.total);
    var btns = '<button class="page-btn" data-page="' + (info.page - 1) + '"' + (info.page === 1 ? ' disabled' : '') + ' aria-label="Previous page"><i class="fas fa-chevron-left"></i></button>';
    var start = Math.max(1, info.page - 2), end = Math.min(info.pages, start + 4);
    start = Math.max(1, Math.min(start, info.pages - 4));
    if (start > 1) btns += '<button class="page-btn" data-page="1">1</button>' + (start > 2 ? '<span class="page-btn" style="border:0;background:none">...</span>' : '');
    for (var p = start; p <= end; p++) btns += '<button class="page-btn' + (p === info.page ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
    if (end < info.pages) btns += (end < info.pages - 1 ? '<span class="page-btn" style="border:0;background:none">...</span>' : '') + '<button class="page-btn" data-page="' + info.pages + '">' + info.pages + '</button>';
    btns += '<button class="page-btn" data-page="' + (info.page + 1) + '"' + (info.page === info.pages ? ' disabled' : '') + ' aria-label="Next page"><i class="fas fa-chevron-right"></i></button>';
    return '<div class="pagination"><span class="pagination-info">Showing <strong>' + from + '-' + to + '</strong> of <strong>' + info.total + '</strong> records</span><div class="pagination-btns">' + btns + '</div></div>';
  }

  /* -------------------------------------------------------------- SEARCH UI */
  function searchBox(id, placeholder, value) {
    return '<div class="table-search"><i class="fas fa-search"></i>' +
      '<input type="search" id="' + id + '" placeholder="' + esc(placeholder || 'Search...') + '" value="' + esc(value || '') + '" aria-label="' + esc(placeholder || 'Search') + '"></div>';
  }

  function selectBox(id, options, value, ariaLabel) {
    var opts = (options || []).map(function (o) {
      var v = typeof o === 'string' ? o : o.value;
      var l = typeof o === 'string' ? o : (o.label || o.value);
      return '<option value="' + esc(v) + '"' + (String(v) === String(value) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('');
    return '<select class="select-pill" id="' + id + '" aria-label="' + esc(ariaLabel || 'Filter') + '">' + opts + '</select>';
  }

  /* ------------------------------------------------------------------ TABS */
  function tabs(id, items, activeKey) {
    var active = activeKey || (items[0] && items[0].key);
    var head = items.map(function (t) {
      return '<button class="tab' + (t.key === active ? ' active' : '') + '" data-tab="' + t.key + '" role="tab" aria-selected="' + (t.key === active) + '">' +
        (t.icon ? '<i class="fas ' + t.icon + '"></i>' : '') + esc(t.label) +
        (t.count !== undefined ? '<span class="tab-count">' + t.count + '</span>' : '') + '</button>';
    }).join('');
    var panels = items.map(function (t) {
      return '<div class="tab-panel' + (t.key === active ? ' active' : '') + '" data-panel="' + t.key + '" role="tabpanel">' + (t.content || '') + '</div>';
    }).join('');
    return '<div class="tabs-wrap" id="' + id + '">' +
      '<div class="tabs" role="tablist">' + head + '</div>' +
      '<div class="tab-panels">' + panels + '</div></div>';
  }

  function bindTabs(rootId, onChange) {
    var root = document.getElementById(rootId);
    if (!root) return;
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('.tab');
      if (!btn) return;
      var key = btn.getAttribute('data-tab');
      U.qsa('.tab', root).forEach(function (t) {
        t.classList.toggle('active', t === btn);
        t.setAttribute('aria-selected', String(t === btn));
      });
      U.qsa('.tab-panel', root).forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-panel') === key);
      });
      if (typeof onChange === 'function') onChange(key);
    });
  }

  function pillTabs(items, activeKey) {
    return items.map(function (t) {
      return '<button class="pill-tab' + (t.key === activeKey ? ' active' : '') + '" data-pilltab="' + t.key + '">' + esc(t.label) + '</button>';
    }).join('');
  }

  /* ------------------------------------------------------------ PAGE HEADER */
  function pageHead(o) {
    return '<div class="page-head">' +
      '<div class="page-head-txt"><h2>' + esc(o.title) + '</h2>' +
      (o.subtitle ? '<p>' + esc(o.subtitle) + '</p>' : '') + '</div>' +
      (o.actions ? '<div class="page-head-actions">' + o.actions + '</div>' : '') +
    '</div>';
  }

  /* ------------------------------------------------------------------ ALERT */
  function alert(o) {
    var icons = { info:'fa-circle-info', success:'fa-circle-check', warning:'fa-triangle-exclamation', danger:'fa-circle-exclamation' };
    var tone = o.tone || 'info';
    return '<div class="alert alert-' + tone + '" role="alert">' +
      '<i class="fas ' + (icons[tone] || icons.info) + ' alert-ico"></i>' +
      '<div class="alert-body">' + (o.title ? '<strong>' + esc(o.title) + '</strong>' : '') + esc(o.message || '') + '</div>' +
      (o.dismissible ? '<button class="icon-action" data-dismiss aria-label="Dismiss"><i class="fas fa-xmark"></i></button>' : '') +
    '</div>';
  }

  /* --------------------------------------------------------------- STATES */
  function emptyState(o) {
    return '<div class="state-block' + (o.small ? ' state-block-sm' : '') + '">' +
      '<div class="state-ico empty"><i class="fas ' + (o.icon || 'fa-inbox') + '"></i></div>' +
      '<h3>' + esc(o.title || 'Nothing here yet') + '</h3>' +
      (o.message ? '<p>' + esc(o.message) + '</p>' : '') +
      (o.action ? '<button class="btn btn-primary' + (o.actionClass ? ' ' + o.actionClass : '') + '" id="' + (o.actionId || 'empty-action') + '">' +
        (o.actionIcon ? '<i class="fas ' + o.actionIcon + '"></i>' : '') + esc(o.action) + '</button>' : '') +
    '</div>';
  }

  function errorState(o) {
    return '<div class="state-block">' +
      '<div class="state-ico error"><i class="fas ' + (o.icon || 'fa-triangle-exclamation') + '"></i></div>' +
      '<h3>' + esc(o.title || 'Something went wrong') + '</h3>' +
      '<p>' + esc(o.message || 'We could not load this section. Please try again.') + '</p>' +
      '<button class="btn btn-primary" id="' + (o.actionId || 'retry-action') + '"><i class="fas fa-rotate"></i> Retry</button>' +
    '</div>';
  }

  function loadingBlock(text) {
    return '<div class="loading-block"><div class="spinner spinner-lg"></div><span>' + esc(text || 'Loading data...') + '</span></div>';
  }

  function skeletonTable(rows, cols) {
    var r = rows || 5, c = cols || 5;
    var head = new Array(c).fill('<th><div class="skeleton sk-line w-70" style="margin:0"></div></th>').join('');
    var body = new Array(r).fill('<tr>' + new Array(c).fill('<td><div class="skeleton sk-line w-70" style="margin:0"></div></td>').join('') + '</tr>').join('');
    return '<div class="table-wrap"><table class="table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function skeletonCards(n, height) {
    var out = '';
    for (var i = 0; i < (n || 4); i++) {
      out += '<div class="sk-card"><div class="skeleton sk-line w-30" style="height:16px"></div>' +
        '<div class="skeleton sk-line w-70" style="height:30px;margin:14px 0"></div>' +
        '<div class="skeleton" style="height:' + (height || 92) + 'px"></div></div>';
    }
    return out;
  }

  /* --------------------------------------------------------------- RATING */
  function rating(id, value, small) {
    var v = Number(value) || 0, out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<button type="button" class="rating-star' + (small ? ' small' : '') + (i <= v ? ' active' : '') + '" data-star="' + i + '" aria-label="Rate ' + i + ' out of 5"><i class="fas fa-star"></i></button>';
    }
    return '<div class="rating" id="' + id + '" data-rating="' + v + '" role="radiogroup" aria-label="Rating">' + out + '</div>';
  }

  function bindRating(id, onChange) {
    var root = document.getElementById(id);
    if (!root) return;
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.rating-star');
      if (!b) return;
      var v = Number(b.getAttribute('data-star'));
      root.setAttribute('data-rating', String(v));
      U.qsa('.rating-star', root).forEach(function (s) {
        s.classList.toggle('active', Number(s.getAttribute('data-star')) <= v);
      });
      if (typeof onChange === 'function') onChange(v);
    });
  }

  /* -------------------------------------------------------------- TIMELINE */
  function timeline(items) {
    return '<div class="timeline">' + (items || []).map(function (t) {
      return '<div class="timeline-item"><span class="timeline-dot ' + (t.tone || '') + '"></span>' +
        '<div class="timeline-content"><strong>' + esc(t.title) + '</strong>' +
        (t.text ? '<p>' + esc(t.text) + '</p>' : '') +
        (t.time ? '<time>' + esc(t.time) + '</time>' : '') + '</div></div>';
    }).join('') + '</div>';
  }

  /* -------------------------------------------------------------- KPI STRIP */
  function kpiStrip(cells) {
    return '<div class="kpi-strip">' + (cells || []).map(function (c) {
      return '<div class="kpi-cell"><div class="kpi-label">' + esc(c.label) + '</div>' +
        '<div class="kpi-val"' + (c.color ? ' style="color:' + c.color + '"' : '') + '>' + c.value + '</div></div>';
    }).join('') + '</div>';
  }

  function meterList(items) {
    return '<div class="meter-list">' + (items || []).map(function (m) {
      return '<div class="meter"><div class="meter-top"><strong>' + esc(m.label) + '</strong><span>' + m.value + '</span></div>' +
        progress(m.percent, m.tone) + '</div>';
    }).join('') + '</div>';
  }

  function legendRows(items) {
    var total = items.reduce(function (a, b) { return a + Number(b.value || 0); }, 0) || 1;
    return '<div class="donut-legend">' + items.map(function (d) {
      var pct = Math.round((Number(d.value) / total) * 100);
      return '<div class="legend-row"><span class="legend-swatch" style="background:' + d.color + '"></span>' +
        '<span class="legend-name">' + esc(d.label) + '</span>' +
        '<span class="legend-val">' + (d.count !== undefined ? U.fmtNum(d.count) + ' &middot; ' : '') + pct + '%</span></div>';
    }).join('') + '</div>';
  }

  function dataCards(rows, mapper) {
    return '<div class="table-cards">' + rows.map(mapper).join('') + '</div>';
  }

  global.SRMS_UI = {
    toast:toast, modal:modal, closeModal:closeModal, confirm:confirm,
    avatar:avatar, badge:badge, statusBadge:statusBadge, gradePill:gradePill,
    progress:progress, progressRow:progressRow, card:card, statCard:statCard,
    table:table, pagination:pagination, searchBox:searchBox, selectBox:selectBox,
    tabs:tabs, bindTabs:bindTabs, pillTabs:pillTabs, pageHead:pageHead, alert:alert,
    emptyState:emptyState, errorState:errorState, loadingBlock:loadingBlock,
    skeletonTable:skeletonTable, skeletonCards:skeletonCards,
    rating:rating, bindRating:bindRating, timeline:timeline,
    kpiStrip:kpiStrip, meterList:meterList, legendRows:legendRows, dataCards:dataCards
  };
})(window);
