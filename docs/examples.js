/*!
 * vanilla.waves — docs/examples.js
 * The showcase element catalog: recognizable DOM elements driven by the
 * wave math. Each is registered as a `data-wv` type on the engine, so the
 * gallery, the index, and every standalone example page share one source.
 *
 * Where p5.waves draws on a canvas, vanilla.waves drives real elements —
 * <input>, <progress>, checkboxes, buttons, text. This file is the live
 * prototype of the future vanilla.waves_elements CDN. The engine stays
 * component-agnostic; concrete renderers live HERE, never in the core.
 *
 * Requires vanilla.waves(.min).js loaded first. License: MIT · seb@prjcts
 */
(function () {
  'use strict';
  var W = window.VanillaWaves || window.Waves;
  if (!W || typeof W.register !== 'function') {
    console.error('[examples] load vanilla.waves(.min).js before docs/examples.js');
    return;
  }

  // Optional live wave-name readout: a [data-wv-name] inside the .wv-stage wrap.
  function bindName(node) {
    var stage = node.closest ? node.closest('.wv-stage') : null;
    return stage ? stage.querySelector('[data-wv-name]') : null;
  }
  function setName(elName, sampler, prev) {
    if (!elName) return prev;
    var n = sampler.waveName;
    if (n !== prev) { elName.textContent = n; prev = n; }
    return prev;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* ── ONE NUMBER ── one sampler, three properties of real elements ─────────
     The same wave value sets a button's WIDTH, a button's POSITION, and a
     swatch's GREY. p5.waves' "one number, use it for anything" — in the DOM. */
  W.register('trio', {
    create: function (node, o, h) {
      var caps = ['size', 'position', 'colour'], built = [];
      for (var i = 0; i < 3; i++) {
        var lane = node.appendChild(h.el('div', 'lane'));
        var cap = lane.appendChild(h.el('span', 'cap')); cap.textContent = caps[i];
        var thing;
        if (i < 2) { thing = lane.appendChild(h.el('button')); thing.textContent = 'wave()'; }
        else { thing = lane.appendChild(h.el('span', 'dot')); }
        built.push(thing);
      }
      return { built: built, sampler: h.makeSampler({ range: [0, 1] }), nameEl: bindName(node), prev: '' };
    },
    update: function (s, t) {
      var v0 = s.sampler.sample(0, t), v1 = s.sampler.sample(2.0, t), v2 = s.sampler.sample(4.0, t);
      s.built[0].style.minWidth = (3 + v0 * 7).toFixed(2) + 'rem';
      s.built[1].style.transform = 'translateX(' + ((v1 - 0.5) * 180).toFixed(1) + 'px)';
      var g = Math.round(20 + v2 * 200);
      s.built[2].style.background = 'rgb(' + g + ',' + g + ',' + g + ')';
      s.prev = setName(s.nameEl, s.sampler, s.prev);
    }
  });

  /* ── BAR METER ── an equalizer of real <span> bars, heights shift ─────────*/
  W.register('eq', {
    create: function (node, o, h) {
      var n = h.num(o.count, 24), bars = [];
      for (var i = 0; i < n; i++) bars.push(node.appendChild(h.el('span')));
      return { bars: bars, n: n, sampler: h.makeSampler({ range: [0, 1] }), nameEl: bindName(node), prev: '' };
    },
    update: function (s, t) {
      for (var i = 0; i < s.n; i++) {
        var v = 0.06 + s.sampler.sample(i * 0.5, t) * 0.94;
        s.bars[i].style.transform = 'scaleY(' + v.toFixed(3) + ')';
      }
      s.prev = setName(s.nameEl, s.sampler, s.prev);
    }
  });

  /* ── CHECKBOX FIELD ── binary field on a grid of native checkboxes ────────
     Two samplers (rows × cols), summed and thresholded — checked or not.    */
  W.register('checks', {
    create: function (node, o, h) {
      var cols = h.num(o.cols, 16), rows = h.num(o.rows, 8);
      node.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
      var boxes = [];
      for (var i = 0; i < cols * rows; i++) {
        var b = h.el('input'); b.type = 'checkbox'; b.tabIndex = -1;
        boxes.push(node.appendChild(b));
      }
      return {
        boxes: boxes, cols: cols, rows: rows,
        rowS: h.makeSampler({ range: [-1, 1], seed: 1, shiftInterval: 4, shiftDuration: 1.2 }),
        colS: h.makeSampler({ range: [-1, 1], seed: 2, shiftInterval: 4.5, shiftDuration: 1.5 }),
        nameEl: bindName(node), prev: ''
      };
    },
    update: function (s, t) {
      var off = t * 0.4, i = 0;
      for (var r = 0; r < s.rows; r++) {
        var rv = s.rowS.sample(r * 5 + off, t);
        for (var c = 0; c < s.cols; c++, i++) {
          s.boxes[i].checked = (rv + s.colS.sample(c * 2.5 - off, t)) > 0;
        }
      }
      s.prev = setName(s.nameEl, s.rowS, s.prev);
    }
  });

  /* ── SLIDER STACK ── native range inputs whose VALUE is the wave ──────────*/
  W.register('sliders', {
    create: function (node, o, h) {
      var n = h.num(o.count, 6), rows = [];
      for (var i = 0; i < n; i++) {
        var row = node.appendChild(h.el('div', 'row'));
        var lab = row.appendChild(h.el('label')); lab.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
        var rng = h.el('input'); rng.type = 'range'; rng.min = 0; rng.max = 100; rng.value = 50; rng.tabIndex = -1;
        row.appendChild(rng);
        var out = row.appendChild(h.el('output'));
        rows.push({ rng: rng, out: out });
      }
      return { rows: rows, n: n, sampler: h.makeSampler({ range: [0, 100], frequency: 0.35 }), nameEl: bindName(node), prev: '' };
    },
    update: function (s, t) {
      for (var i = 0; i < s.n; i++) {
        var v = clamp(Math.round(s.sampler.sample(i * 0.9, t + i * 0.15)), 0, 100);
        s.rows[i].rng.value = v;
        s.rows[i].out.textContent = v;
      }
      s.prev = setName(s.nameEl, s.sampler, s.prev);
    }
  });

  /* ── PROGRESS MORPH ── rows of native <progress>, each its own shift wave ─*/
  W.register('progress', {
    create: function (node, o, h) {
      var n = h.num(o.count, 5), rows = [];
      for (var i = 0; i < n; i++) {
        var row = node.appendChild(h.el('div', 'row'));
        var lab = row.appendChild(h.el('label'));
        var pr = h.el('progress'); pr.max = 100; pr.value = 0;
        row.appendChild(pr);
        rows.push({
          pr: pr, lab: lab,
          s: h.makeSampler({ range: [0, 100], seed: i * 31 + 5, frequency: 0.3 + i * 0.05 }),
          prev: ''
        });
      }
      return { rows: rows, n: n };
    },
    update: function (s, t) {
      for (var i = 0; i < s.n; i++) {
        var r = s.rows[i];
        r.pr.value = clamp(r.s.sample(i * 1.3, t), 0, 100);
        if (r.s.waveName !== r.prev) { r.prev = r.s.waveName; r.lab.textContent = r.prev; }
      }
    }
  });

  /* ── GLYPH FIELD ── a monospace flow field of / - | \ in a text block ─────*/
  W.register('glyphs', {
    create: function (node, o, h) {
      return {
        node: node, cols: h.num(o.cols, 30), rows: h.num(o.rows, 12),
        dirs: (o.text || '-/|\\').split(''),
        sampler: h.makeSampler({ frequency: 2, shiftInterval: 4, shiftDuration: 2 }),
        nameEl: bindName(node), prev: '', last: ''
      };
    },
    update: function (s, t) {
      var out = '', n = s.dirs.length;
      for (var r = 0; r < s.rows; r++) {
        for (var c = 0; c < s.cols; c++) {
          var v = s.sampler.sample(c * 0.5, t + r * 0.4);   // ~[-1,1]
          var idx = Math.floor((v + 1) / 2.002 * n);
          out += s.dirs[idx < 0 ? 0 : idx >= n ? n - 1 : idx];
        }
        out += '\n';
      }
      if (out !== s.last) { s.last = out; s.node.textContent = out; }
      s.prev = setName(s.nameEl, s.sampler, s.prev);
    }
  });

  /* ── RADIAL LOADER ── dots around a ring, radius from a closing sampler ───
     The 'closing' pool shares one base period, so the ring stays seamless. */
  W.register('ring', {
    create: function (node, o, h) {
      var n = h.num(o.count, 48), dots = [];
      for (var i = 0; i < n; i++) dots.push(node.appendChild(h.el('span')));
      return {
        dots: dots, n: n, lobes: h.num(o.lobes, 6),
        sampler: h.makeSampler({ group: 'closing', amplitude: 1 }),
        nameEl: bindName(node), prev: ''
      };
    },
    update: function (s, t) {
      var sweep = (s.sampler.period || 6.2832) * s.lobes;
      for (var i = 0; i < s.n; i++) {
        var frac = i / s.n;
        var rad = 62 + s.sampler.sample(frac * sweep, t) * 26;
        s.dots[i].style.transform = 'rotate(' + (frac * 360) + 'deg) translateY(-' + rad.toFixed(1) + 'px)';
      }
      s.prev = setName(s.nameEl, s.sampler, s.prev);
    }
  });

  /* ── TEXT LOADER ── 4x4 character grid, each cell from a wave value ───────*/
  W.register('load', {
    create: function (node, o, h) {
      var cells = [];
      for (var i = 0; i < 16; i++) cells.push(node.appendChild(h.el('span')));
      return { cells: cells, sampler: h.makeSampler(), text: o.text || 'LOADING', prev: new Array(16).fill('') };
    },
    update: function (s, t) {
      var len = s.text.length, i = 0;
      for (var r = 0; r < 4; r++)
        for (var c = 0; c < 4; c++, i++) {
          var v = s.sampler.sample(c * 0.5 + t, t + r * 0.9);
          var idx = clamp(Math.floor((v + 1) / 2 * len), 0, len - 1);
          var ch = s.text[idx];
          if (ch !== s.prev[i]) { s.prev[i] = ch; s.cells[i].textContent = ch; }
        }
    }
  });

  /* ── CHIP WALKERS ── small badges that move; wave output IS the velocity ──*/
  W.register('walk', {
    create: function (node, o, h) {
      var n = h.num(o.count, 9), labels = (o.text || 'wv').split(','), chips = [];
      for (var i = 0; i < n; i++) {
        var chip = h.el('div', 'chip');
        chip.textContent = labels[i % labels.length];
        node.appendChild(chip);
        chips.push({
          el: chip, x: (i * 53) % 240 + 20, y: (i * 37) % 140 + 20,
          xs: h.makeSampler({ range: [-1.4, 1.4], seed: i * 13 + 3, frequency: 0.4 }),
          ys: h.makeSampler({ range: [-1.4, 1.4], seed: i * 17 + 9, frequency: 0.3 })
        });
      }
      return { chips: chips, node: node };
    },
    update: function (s, t) {
      var w = s.node.clientWidth || 320, hgt = s.node.clientHeight || 200;
      for (var i = 0; i < s.chips.length; i++) {
        var ch = s.chips[i];
        ch.x += ch.xs.sample(t * 1.8 + i, t);
        ch.y += ch.ys.sample(t * 2.1 + i, t);
        if (ch.x < 0) ch.x += w - 40; else if (ch.x > w - 40) ch.x -= w - 40;
        if (ch.y < 0) ch.y += hgt - 24; else if (ch.y > hgt - 24) ch.y -= hgt - 24;
        ch.el.style.transform = 'translate(' + ch.x.toFixed(1) + 'px,' + ch.y.toFixed(1) + 'px)';
      }
    }
  });

  // If the engine auto-init'd before this file ran, init again so [data-wv]
  // nodes that use these types still get wired up.
  if (typeof W.init === 'function') W.init();
})();
