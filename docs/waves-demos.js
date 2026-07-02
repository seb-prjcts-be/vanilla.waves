/*!
 * vanilla.waves docs - waves-demos.js
 * The canvasless demo vocabulary used across the docs site. Every renderer
 * below is registered on the shared vanilla.waves engine and reads a sampler
 * (or wave()) to drive plain DOM/SVG - no p5, no <canvas>.
 *
 * Load AFTER vanilla.waves(.min).js. The engine auto-inits [data-wv] on
 * DOMContentLoaded; these register() calls run first, so wiring is automatic.
 * License: MIT · seb@prjcts
 */
(function () {
  'use strict';
  var W = window.VanillaWaves || window.vWaves || window.Waves;
  if (!W || typeof W.register !== 'function') {
    if (window.console) console.error('[vanilla.waves docs] load vanilla.waves(.min).js before waves-demos.js');
    return;
  }
  var NS = 'http://www.w3.org/2000/svg';
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // coffeehouse vanilla tones: espresso · taupe · teal · sand · brown
  var COFFEE = ['#453020', '#b39c7d', '#72bab8', '#dbcdad', '#8a6f4a'];

  // a continuous spectrum through the palette (espresso → teal → sand → cream)
  var SPECTRUM = ['#453020', '#6a5138', '#b39c7d', '#72bab8', '#a9cfc8', '#dbcdad', '#fff5cf'];
  function hx(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { var A = hx(a), B = hx(b); return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')'; }
  function spectrum(t) {
    t = clamp(t, 0, 1);
    var f = t * (SPECTRUM.length - 1), i = Math.floor(f);
    if (i >= SPECTRUM.length - 1) return SPECTRUM[SPECTRUM.length - 1];
    return mix(SPECTRUM[i], SPECTRUM[i + 1], f - i);
  }

  /* ── eq - equalizer bars ─────────────────────────────────
     Each bar's height is a sampler value; one shared loop drives all. */
  W.register('eq', {
    create: function (node, o, h) {
      var n = h.num(o.count, 18), bars = [];
      for (var i = 0; i < n; i++) {
        var b = h.el('span');
        b.style.background = COFFEE[i % COFFEE.length];   // coffee tones across the meter
        bars.push(node.appendChild(b));
      }
      return { bars: bars, n: n, s: h.makeSampler() };
    },
    update: function (st, t) {
      for (var i = 0; i < st.n; i++) {
        var v = 0.08 + st.s.sample(i * 0.55, t) * 0.92;
        st.bars[i].style.transform = 'scaleY(' + clamp(v, 0.04, 1.4).toFixed(3) + ')';
      }
    }
  });

  /* ── line - a sampler traced as a row of dots ────────────
     One sampler sampled across position; the dots trace the live waveform. */
  W.register('line', {
    create: function (node, o, h) {
      var n = h.num(o.count, 80), dots = [];
      for (var i = 0; i < n; i++) {
        var d = h.el('span');
        d.style.background = COFFEE[i % COFFEE.length];   // coffee tones along the line
        dots.push(node.appendChild(d));
      }
      return { dots: dots, n: n, s: h.makeSampler({ amplitude: 1 }) };
    },
    update: function (st, t) {
      for (var i = 0; i < st.n; i++) {
        var v = st.s.sample(i * 0.18, t);
        st.dots[i].style.transform = 'translateY(' + (clamp(v, -1.2, 1.2) * 38).toFixed(1) + 'px)';
      }
    }
  });

  /* ── load - 4x4 text loader ──────────────────────────────
     Each cell picks a character from a wave value. Cheap in bulk. */
  W.register('load', {
    create: function (node, o, h) {
      var cells = [];
      for (var i = 0; i < 16; i++) cells.push(node.appendChild(h.el('span')));
      return { cells: cells, s: h.makeSampler(), text: o.text || 'LOADING', prev: new Array(16).fill('') };
    },
    update: function (st, t) {
      var len = st.text.length, i = 0;
      for (var r = 0; r < 4; r++)
        for (var c = 0; c < 4; c++, i++) {
          var v = st.s.sample(c * 0.5 + t, t + r * 0.9);
          var idx = clamp(Math.floor((v + 1) / 2 * len), 0, len - 1);
          var ch = st.text[idx];
          if (ch !== st.prev[i]) { st.prev[i] = ch; st.cells[i].textContent = ch; }
        }
    }
  });

  /* ── wave - single named wave, traced as an SVG polyline ──
     Catalog previews. A fixed (non-shifting) wave, drifting slowly in x so
     even the pure sines show life. amplitude 1 → output ~[-1, 1]. */
  W.register('wave', {
    create: function (node, o, h) {
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 120 40');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('class', 'wv-svg');
      var poly = document.createElementNS(NS, 'polyline');
      poly.setAttribute('class', 'wv-trace');
      svg.appendChild(poly);
      node.appendChild(svg);
      var s = h.W.createSampler({
        wave: o.wave, shift: false, amplitude: 1,
        frequency: h.num(o.freq, 1)
      });
      return {
        poly: poly, s: s,
        n: h.num(o.count, 60),
        span: h.num(o.span, 130),
        drift: h.num(o.drift, 9)
      };
    },
    update: function (st, t) {
      var pts = '', i, x, v, y;
      for (i = 0; i <= st.n; i++) {
        x = (i / st.n) * st.span + t * st.drift;
        v = clamp(st.s.sample(x, t), -1, 1);   // normalizeVal already ~[-1,1]
        y = 20 - v * 17;                        // full height, centred at 20
        pts += ((i / st.n) * 120).toFixed(2) + ',' + y.toFixed(2) + ' ';
      }
      st.poly.setAttribute('points', pts);
    }
  });

  /* ── ribbons - hero backdrop: stacked shifting wave lines ─
     One shift-sampler, offset per row. The whole field morphs through the
     34 formulas over time. Rendered as SVG polylines, ink on paper. */
  W.register('ribbons', {
    create: function (node, o, h) {
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 120 60');
      svg.setAttribute('preserveAspectRatio', 'none');
      var rows = h.num(o.rows, 7), lines = [];
      for (var r = 0; r < rows; r++) {
        var p = document.createElementNS(NS, 'polyline');
        p.setAttribute('class', 'wv-trace');
        // full coffee spectrum across the band - as inline style: a stroke
        // *attribute* would lose from the .wv-trace CSS rule (stroke: var(--ink))
        p.style.stroke = spectrum(rows > 1 ? r / (rows - 1) : 0.5);
        svg.appendChild(p);
        lines.push(p);
      }
      node.appendChild(svg);
      return { lines: lines, rows: rows, n: h.num(o.count, 90), s: h.makeSampler({ amplitude: 1 }) };
    },
    update: function (st, t) {
      for (var r = 0; r < st.rows; r++) {
        var base = st.rows > 1 ? 8 + r * (44 / (st.rows - 1)) : 30, pts = '';
        for (var i = 0; i <= st.n; i++) {
          var x = (i / st.n) * 46 + r * 7;
          var v = clamp(st.s.sample(x, t + r * 0.35), -1.2, 1.2);
          pts += ((i / st.n) * 120).toFixed(2) + ',' + (base + v * 9).toFixed(2) + ' ';
        }
        st.lines[r].setAttribute('points', pts);
      }
    }
  });

  /* ── ascii - a flow field of characters ──────────────────
     Each cell's glyph comes from a shift-sampler: like noise, but with
     structure that keeps re-forming as the wave shifts. */
  W.register('ascii', {
    create: function (node, o, h) {
      var pre = h.el('pre', 'wv-ascii');
      node.appendChild(pre);
      return {
        pre: pre,
        cols: h.num(o.cols, 34),
        rows: h.num(o.rows, 12),
        chars: o.chars || ' ·-=+*#%@',
        s: h.makeSampler({ range: [-1, 1], frequency: h.num(o.freq, 0.7), shiftInterval: 4, shiftDuration: 2 })
      };
    },
    update: function (st, t) {
      var out = '', len = st.chars.length;
      for (var r = 0; r < st.rows; r++) {
        for (var c = 0; c < st.cols; c++) {
          var v = st.s.sample(c * 0.5, t + r * 0.4);
          var idx = clamp(Math.floor((v + 1) / 2 * len), 0, len - 1);
          out += st.chars[idx];
        }
        out += '\n';
      }
      st.pre.textContent = out;
    }
  });

  /* ── field - a breathing grid of ink cells ───────────────
     A wave-driven tone field: each cell's opacity is a sampler value. */
  W.register('field', {
    create: function (node, o, h) {
      var cols = h.num(o.cols, 24), rows = h.num(o.rows, 10), cells = [];
      node.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
      for (var i = 0; i < cols * rows; i++) cells.push(node.appendChild(h.el('span')));
      return { cells: cells, cols: cols, rows: rows, s: h.makeSampler({ range: [-1, 1], frequency: h.num(o.freq, 0.5) }) };
    },
    update: function (st, t) {
      var i = 0;
      for (var r = 0; r < st.rows; r++)
        for (var c = 0; c < st.cols; c++, i++) {
          var nv = (clamp(st.s.sample(c * 0.4, t + r * 0.5), -1, 1) + 1) / 2;   // 0..1
          var cell = st.cells[i];
          // warm heatmap: high value → espresso, low → latte, with depth from opacity
          cell.style.background = COFFEE[clamp(Math.floor((1 - nv) * COFFEE.length), 0, COFFEE.length - 1)];
          cell.style.opacity = (0.2 + nv * 0.8).toFixed(3);
        }
    }
  });

})();
