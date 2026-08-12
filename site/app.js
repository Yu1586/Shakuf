/* שקוף site — copy buttons and platform tabs.
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
    btn.setAttribute('aria-label', 'העתקת ' + (block.dataset.copy || 'הקוד'));

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
})();
