/* שקוף site: copy buttons, platform tabs, and the homepage's open-panel button.
 *
 * External file rather than inline, because the CSP is script-src 'self'.
 * Progressive enhancement throughout: with JS off, every code block is still
 * readable and selectable, and every tab panel is simply visible.
 */
(function () {
  'use strict';

  // ---- Copy buttons ----------------------------------------------------
  document.querySelectorAll('[data-copy]').forEach(function (block) {
    var pre = block.querySelector('pre');
    if (!pre) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'העתקה';
    // The accessible name starts with the visible word, so a speech-input user
    // who says what they see still hits it (WCAG 2.5.3).
    btn.setAttribute('aria-label', 'העתקה: ' + (block.dataset.copy || 'הקוד'));

    var reset;
    btn.addEventListener('click', function () {
      var text = pre.innerText;
      var done = function (ok) {
        btn.textContent = ok ? 'הועתק ✓' : 'ההעתקה נכשלה';
        btn.dataset.copied = ok ? 'true' : 'false';
        // Announce, because a visual label change alone tells a screen-reader
        // user nothing.
        say(ok ? 'הועתק ללוח' : 'ההעתקה נכשלה, יש להעתיק ידנית');
        clearTimeout(reset);
        reset = setTimeout(function () {
          btn.textContent = 'העתקה';
          delete btn.dataset.copied;
        }, 2600);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); },
                                                 function () { done(false); });
      } else {
        done(false);
      }
    });

    // Into the title bar when there is one, so it sits inline with the
    // filename rather than dangling under the code.
    (block.querySelector('.code-bar') || block).appendChild(btn);
  });

  // ---- Live region -----------------------------------------------------
  var live;
  function say(msg) {
    if (!live) {
      live = document.createElement('div');
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('role', 'status');
      live.className = 'sr-only';
      document.body.appendChild(live);
    }
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 60);
  }

  // ---- Reference groups (/setup/) --------------------------------------
  //
  // The long per-option sections sit in <details> that ship closed, so a phone
  // gets a short page. A wide screen has room to read them in place, so open
  // them there, once, at load. Not on resize: shutting a group while someone
  // is reading it would be worse than leaving it open.
  if (window.matchMedia && window.matchMedia('(min-width: 760px)').matches) {
    document.querySelectorAll('details[data-open-wide]').forEach(function (d) { d.open = true; });
  }

  // ---- Fragments inside collapsed <details> ----------------------------
  //
  // A link to an id that sits inside a closed <details> does nothing visible on
  // most browsers: the target is display:none, so there is nothing to scroll
  // to. Recent Chrome and Firefox expand the ancestor automatically, but that
  // is far from universal, so open it ourselves and let the browser do the
  // scrolling afterwards.
  function revealHash() {
    var id = location.hash.slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var open = false;
    for (var el = target.parentElement; el; el = el.parentElement) {
      if (el.tagName === 'DETAILS' && !el.open) { el.open = true; open = true; }
    }
    if (open) target.scrollIntoView();
  }
  window.addEventListener('hashchange', revealHash);
  revealHash();

  // ---- Platform tabs ---------------------------------------------------
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    var panels = tabs.map(function (t) {
      return document.getElementById(t.getAttribute('aria-controls'));
    });

    function select(index, moveFocus) {
      tabs.forEach(function (t, i) {
        var on = i === index;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        // Roving tabindex: one stop for the whole tablist, arrows move within.
        t.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      if (moveFocus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        // RTL: ArrowLeft advances, ArrowRight goes back.
        if (e.key === 'ArrowLeft')  next = (i + 1) % tabs.length;
        if (e.key === 'ArrowRight') next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home')       next = 0;
        if (e.key === 'End')        next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });

    select(0, false);
  });

  // ---- Open the real widget ------------------------------------------------
  //
  // Wired from shakuf:ready rather than window.shakuf, because the event fires
  // inside the widget's own startup, before the global exists, and carries the
  // instance in event.detail. This file loads first (both are defer, and defer
  // preserves order), so the listener is in place in time. The button stays
  // hidden until the widget is actually there to open.
  document.addEventListener('shakuf:ready', function (e) {
    var api = e.detail;
    if (!api || typeof api.open !== 'function') return;
    document.querySelectorAll('[data-shakuf-open]').forEach(function (b) {
      b.hidden = false;
      b.addEventListener('click', function () { api.open(); });
    });
  });
})();
