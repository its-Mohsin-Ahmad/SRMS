/* =============================================================================
   SRMS - Chart Factory  (js/utils/charts.js)
   Thin wrapper over Chart.js providing consistent styling, gradients,
   tooltips, legends and responsive behaviour for every SRMS chart.
   ========================================================================== */
(function (global) {
  'use strict';

  var U = global.SRMS_UTIL || {};
  var registry = {};

  var PALETTE = {
    blue:   '#1677E8', blueDark:'#1557B0', lightBlue:'#EAF4FF',
    green:  '#22C55E', yellow:'#F59E0B', red:'#EF4444',
    purple: '#8B5CF6', teal:'#14B8A6', pink:'#EC4899', slate:'#94A3B8'
  };

  if (global.Chart) {
    Chart.defaults.font.family = "'Segoe UI', -apple-system, BlinkMacSystemFont, Inter, Roboto, sans-serif";
    Chart.defaults.font.size = 11.5;
    Chart.defaults.color = '#64748B';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 9;
    Chart.defaults.plugins.legend.labels.padding = 14;
    Chart.defaults.plugins.tooltip.backgroundColor = '#1E293B';
    Chart.defaults.plugins.tooltip.titleColor = '#FFFFFF';
    Chart.defaults.plugins.tooltip.bodyColor = '#E2E8F0';
    Chart.defaults.plugins.tooltip.padding = 11;
    Chart.defaults.plugins.tooltip.cornerRadius = 9;
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.tooltip.boxPadding = 5;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.animation.duration = 850;
    Chart.defaults.animation.easing = 'easeOutQuart';
  }

  function destroy(id) {
    if (registry[id]) { try { registry[id].destroy(); } catch (e) {} delete registry[id]; }
  }

  function ctxOf(id) {
    var canvas = document.getElementById(id);
    if (!canvas) return null;
    var existing = registry[id];
    if (existing) { try { existing.destroy(); } catch (e) {} delete registry[id]; }
    return canvas.getContext('2d');
  }

  function gradient(ctx, area, from, to) {
    if (!ctx || !area) return from;
    var g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, from); g.addColorStop(1, to);
    return g;
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath(); ctx.fill();
  }

  var baseScales = {
    x: {
      grid: { display:false, drawBorder:false },
      ticks: { color:'#94A3B8', font:{ size:11 } },
      border: { display:false }
    },
    y: {
      beginAtZero: true,
      grid: { color:'#EEF3F9', drawBorder:false },
      ticks: { color:'#94A3B8', font:{ size:11 }, padding:8 },
      border: { display:false }
    }
  };

  /* --------------------------------------------------------------- DONUT */
  function donut(id, cfg) {
    var ctx = ctxOf(id);
    if (!ctx) return null;
    var data = cfg.data || [];
    var chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(function (d) { return d.label; }),
        datasets: [{
          data: data.map(function (d) { return d.value; }),
          backgroundColor: data.map(function (d) { return d.color; }),
          borderColor: '#FFFFFF',
          borderWidth: 3,
          hoverOffset: 9,
          hoverBorderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        cutout: cfg.cutout || '70%',
        layout: { padding: cfg.padding === undefined ? 6 : cfg.padding },
        plugins: {
          legend: { display: cfg.legend !== false, position: cfg.legendPosition || 'bottom' },
          tooltip: {
            callbacks: {
              label: function (c) {
                var total = c.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                var pct = total ? Math.round((c.parsed / total) * 100) : 0;
                var unit = cfg.unit || '';
                return '  ' + c.label + ': ' + c.parsed.toLocaleString() + unit + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
    registry[id] = chart;
    return chart;
  }

  /* ---------------------------------------------------------------- LINE */
  function line(id, cfg) {
    var ctx = ctxOf(id);
    if (!ctx) return null;
    var datasets = (cfg.datasets || []).map(function (ds) {
      return {
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: function (c) {
          var area = c.chart.chartArea;
          if (!area) return ds.color + '22';
          return gradient(c.chart.ctx, area, ds.color + '38', ds.color + '02');
        },
        borderWidth: ds.width || 2.6,
        tension: ds.tension === undefined ? 0.38 : ds.tension,
        fill: ds.fill !== false,
        pointRadius: ds.points === false ? 1 : 3.6,
        pointHoverRadius: 6,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: ds.color,
        pointBorderWidth: 2.4,
        spanGaps: true
      };
    });
    var chart = new Chart(ctx, {
      type: 'line',
      data: { labels: cfg.labels || [], datasets: datasets },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction: { mode:'index', intersect:false },
        layout: { padding:{ top:8, right:6, left:0, bottom:0 } },
        plugins: {
          legend: { display: cfg.legend !== false, position:'top', align:'end' },
          tooltip: {
            callbacks: {
              label: function (c) { return '  ' + c.dataset.label + ': ' + c.parsed.y + (cfg.unit || ''); }
            }
          }
        },
        scales: {
          x: baseScales.x,
          y: Object.assign({}, baseScales.y, { suggestedMin: cfg.min, suggestedMax: cfg.max })
        }
      }
    });
    registry[id] = chart;
    return chart;
  }

  /* ----------------------------------------------------------------- BAR */
  function bar(id, cfg) {
    var ctx = ctxOf(id);
    if (!ctx) return null;
    var datasets = (cfg.datasets || []).map(function (ds) {
      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.colors || ds.color || PALETTE.blue,
        hoverBackgroundColor: ds.hover || ds.color || PALETTE.blueDark,
        borderRadius: cfg.horizontal ? 6 : 7,
        borderSkipped: false,
        barPercentage: cfg.barPercentage || 0.68,
        categoryPercentage: cfg.categoryPercentage || 0.72,
        maxBarThickness: cfg.maxBarThickness || 34
      };
    });
    var chart = new Chart(ctx, {
      type: 'bar',
      data: { labels: cfg.labels || [], datasets: datasets },
      options: {
        responsive:true, maintainAspectRatio:false,
        indexAxis: cfg.horizontal ? 'y' : 'x',
        layout: { padding:{ top:6, right:8, left:0, bottom:0 } },
        plugins: {
          legend: { display: cfg.legend !== false, position:'top', align:'end' },
          tooltip: {
            callbacks: {
              label: function (c) {
                var v = cfg.horizontal ? c.parsed.x : c.parsed.y;
                return '  ' + c.dataset.label + ': ' + v + (cfg.unit || '');
              }
            }
          }
        },
        scales: {
          x: Object.assign({}, baseScales.x, cfg.horizontal ? { grid:{ color:'#EEF3F9', drawBorder:false }, beginAtZero:true } : {}),
          y: Object.assign({}, baseScales.y, cfg.horizontal ? { grid:{ display:false, drawBorder:false } } : {}, { suggestedMax: cfg.max })
        }
      }
    });
    registry[id] = chart;
    return chart;
  }

  /* ---------------------------------------------------------------- RADAR */
  function radar(id, cfg) {
    var ctx = ctxOf(id);
    if (!ctx) return null;
    var chart = new Chart(ctx, {
      type:'radar',
      data:{
        labels: cfg.labels || [],
        datasets:(cfg.datasets || []).map(function (ds) {
          return { label:ds.label, data:ds.data, borderColor:ds.color, backgroundColor:ds.color + '2E', borderWidth:2.2, pointRadius:3, pointBackgroundColor:'#FFFFFF', pointBorderColor:ds.color, pointBorderWidth:2 };
        })
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:true, position:'top', align:'end' } },
        scales:{ r:{ beginAtZero:true, max: cfg.max || 100, grid:{ color:'#E8EFF7' }, angleLines:{ color:'#E8EFF7' }, pointLabels:{ color:'#64748B', font:{ size:11 } }, ticks:{ display:false, stepSize:25 } } }
      }
    });
    registry[id] = chart;
    return chart;
  }

  /* ----------------------------------------------------------- HORIZ BARS */
  function bars(id, cfg) { return bar(id, Object.assign({ horizontal:true }, cfg)); }

  /* --------------------------------------------------------- PROGRESS RING */
  function ring(percent, color) {
    var p = U.clamp ? U.clamp(Number(percent) || 0, 0, 100) : Number(percent) || 0;
    var c = color || PALETTE.blue;
    var r = 54, circ = 2 * Math.PI * r, off = circ * (1 - p / 100);
    return '<svg viewBox="0 0 128 128" class="ring-svg" role="img" aria-label="' + p + ' percent">' +
      '<circle cx="64" cy="64" r="' + r + '" fill="none" stroke="#EDF2F8" stroke-width="12"/>' +
      '<circle cx="64" cy="64" r="' + r + '" fill="none" stroke="' + c + '" stroke-width="12" ' +
      'stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + off + '" ' +
      'transform="rotate(-90 64 64)" style="transition:stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)"/>' +
      '</svg>';
  }

  function destroyAll() {
    Object.keys(registry).forEach(function (k) { try { registry[k].destroy(); } catch (e) {} });
    registry = {};
  }

  global.SRMS_CHARTS = {
    PALETTE: PALETTE, donut:donut, line:line, bar:bar, radar:radar, bars:bars,
    ring:ring, destroy:destroy, destroyAll:destroyAll, registry:function () { return registry; }
  };
})(window);
