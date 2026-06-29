/*!
 * vanilla.waves — engine.js
 * De canvasloze DOM-motor: één gedeelde requestAnimationFrame-loop (FPS-cap),
 * IntersectionObserver-pauze voor offscreen elementen, een register/init/destroy
 * plugin-API, en sampler-helpers voor renderers. Geen p5, geen canvas.
 *
 * Vereist waves-core.js (de VanillaWaves-global) VÓÓR dit bestand — of laad de
 * gebundelde vanilla.waves.js. Augmenteert dezelfde VanillaWaves-global met
 * register/init/destroy, zodat de hele bib één namespace is.
 *
 * Gedestilleerd uit het bewezen wel.js (building_blocks_elements): zelfde loop,
 * IO-pauze en helpers, maar zonder de async CDN-wachtlogica (core is nu lokaal).
 * License: MIT · seb@prjcts
 */
(function (global) {
  'use strict';

  var W = global.VanillaWaves || global.Waves;
  if (!W || typeof W.createSampler !== 'function') {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[vanilla.waves] engine: laad waves-core.js (VanillaWaves) vóór engine.js.');
    }
    return;
  }

  var FPS = 30;                       // een DOM-element heeft geen 60fps nodig
  var FRAME_MS = 1000 / FPS;
  var REDUCED = !!(global.matchMedia &&
    global.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var items = new Map();              // element → { state, update, visible, t, speed }
  var types = new Map();              // naam → { create, update? }
  var rafId = null, prevNow = 0, lastFrame = 0;

  var io = ('IntersectionObserver' in global)
    ? new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var it = items.get(entries[i].target);
          if (it) it.visible = entries[i].isIntersecting;
        }
      }, { rootMargin: '120px' })
    : null;

  var nowMs = function () {
    return (global.performance && performance.now) ? performance.now() : Date.now();
  };

  // ─── Gedeelde helpers voor renderers ────────────────────────────────────────
  // Sampler met element-vriendelijke defaults (shift aan, gentle, lage freq).
  function makeSampler(opts, extra) {
    var base = {
      seed: Number(opts.seed),
      group: opts.group || 'gentle',
      amplitude: 1,
      frequency: opts.frequency !== undefined ? Number(opts.frequency) : 0.5,
      shift: opts.shift === 'false' ? false : true,
      shiftInterval: opts.shiftInterval !== undefined ? Number(opts.shiftInterval) : 2,
      shiftDuration: opts.shiftDuration !== undefined ? Number(opts.shiftDuration) : 4
    };
    if (extra) for (var k in extra) base[k] = extra[k];
    return W.createSampler(base);
  }
  // ~[-1,1] → [0,1], geclampt (harsh-groep kan buiten bereik komen).
  function norm(v) { return v < -1 ? 0 : v > 1 ? 1 : (v + 1) / 2; }
  function num(v, d) { return (v === undefined || v === '') ? d : Number(v); }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  // Core accepteert string-seeds; de engine-starttijd niet (Number('abc') = NaN).
  // Saniteer hier: niet-numerieke seeds → stabiele hash, zodat t nooit NaN wordt.
  function hashSeed(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

  // ─── Loop-beheer ────────────────────────────────────────────────────────────
  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (now - lastFrame < FRAME_MS) return;
    var dt = Math.min(now - prevNow, 100);   // geen sprong na tab-wissel
    prevNow = now; lastFrame = now;
    items.forEach(function (it) {
      if (!it.visible || !it.update) return;
      it.t += (dt / 600) * it.speed;
      it.update(it.state, it.t);
    });
  }
  function startLoop() {
    if (rafId === null && items.size > 0) {
      prevNow = nowMs(); lastFrame = 0;
      rafId = requestAnimationFrame(frame);
    }
  }
  function stopLoopIfEmpty() {
    if (rafId !== null && items.size === 0) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function resolveTargets(target) {
    if (typeof target === 'string') return document.querySelectorAll(target);
    if (target instanceof Element) return [target];
    if (target && typeof target.length === 'number') return target;  // NodeList/array
    return document.querySelectorAll('[data-wv]');
  }

  // ─── Publieke API (op dezelfde VanillaWaves-global) ─────────────────────────
  // Registreer een elementtype: register(naam, { create, update? }).
  // create(node, opts, helpers) → state. update(state, t) muteert (optioneel).
  W.register = function (name, def) { types.set(name, def); return W; };

  // Init: init(), init(element), init('.selector') of init(NodeList).
  W.init = function (target) {
    var nodes = resolveTargets(target);
    Array.prototype.forEach.call(nodes, function (node) {
      if (items.has(node)) return;
      var def = types.get(node.dataset.wv);
      if (!def) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[vanilla.waves] onbekend type:', node.dataset.wv);
        }
        return;
      }
      var opts = {};
      for (var k in node.dataset) opts[k] = node.dataset[k];
      if (opts.seed === undefined || opts.seed === '') {
        opts.seed = String(Math.floor(Math.random() * 10000));
      }
      var helpers = {
        makeSampler: function (ex) { return makeSampler(opts, ex); },
        norm: norm, num: num, el: el, W: W
      };
      var seed = Number(opts.seed);
      if (!isFinite(seed)) seed = hashSeed(String(opts.seed));   // geen NaN-tijd
      var spd = num(opts.speed, 1);
      if (!isFinite(spd)) spd = 1;                               // geen NaN-tijd
      // Onthoud wat er al stond, zodat destroy() exact opruimt wat create()
      // toevoegt en bestaande auteur-inhoud ongemoeid laat.
      var baseChildren = node.children ? node.children.length : 0;
      var state = def.create(node, opts, helpers);
      // aria-hidden alleen forceren als de auteur niets opgaf en niet expliciet
      // opt-out doet (data-decorative="false"). Niet elk element is decoratief.
      var ariaSet = node.getAttribute('aria-hidden') === null && opts.decorative !== 'false';
      if (ariaSet) node.setAttribute('aria-hidden', 'true');
      items.set(node, {
        state: state,
        update: def.update || null,
        dispose: def.destroy || null,
        base: baseChildren,
        ariaSet: ariaSet,
        visible: true,
        speed: spd,
        t: (seed % 97) * 0.37          // eigen startpunt per seed
      });
      if (io) io.observe(node);
      node.classList.add('wv--ready');
    });
    // Reduced-motion: render één statisch frame i.p.v. te animeren.
    if (REDUCED) items.forEach(function (it) {
      if (it.update) { it.t += 0.6; it.update(it.state, it.t); }
    });
    else startLoop();
    return W;
  };

  // Stop en ruim op (bv. wanneer het laden klaar is).
  W.destroy = function (target) {
    Array.prototype.forEach.call(resolveTargets(target), function (node) {
      var it = items.get(node);
      if (!it) return;
      if (io) io.unobserve(node);
      // Optionele disposer: def.destroy(state, node) — voor renderers die
      // eigen resources moeten vrijgeven (timers, listeners, ...).
      if (it.dispose) { try { it.dispose(it.state, node); } catch (e) {} }
      // Ruim enkel op wat create() toevoegde; laat oorspronkelijke inhoud staan.
      if (node.children) {
        while (node.children.length > it.base) {
          node.removeChild(node.children[node.children.length - 1]);
        }
      }
      if (it.ariaSet && node.removeAttribute) node.removeAttribute('aria-hidden');
      items.delete(node);
      node.classList.remove('wv--ready');
    });
    stopLoopIfEmpty();
    return W;
  };

  // ─── Auto-init ──────────────────────────────────────────────────────────────
  // Scant [data-wv]. Types moeten geregistreerd zijn vóór DOMContentLoaded
  // (elements-laag laadt na dit bestand). Roep W.init() opnieuw aan als je later
  // types registreert of dynamisch elementen toevoegt.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { W.init(); });
  } else {
    W.init();
  }

})(typeof globalThis !== 'undefined' ? globalThis :
   typeof window !== 'undefined' ? window : this);
