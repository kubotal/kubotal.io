/* Kubotal — animations
   GSAP est optionnel : les états "from" ne sont posés que par GSAP lui-même.
   Sans GSAP (CDN bloqué, CSP), la page s'affiche complète et statique.   */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';

  /* ---------- 1. Révélations ---------- */
  /* gsap.from() pose immédiatement l'état de départ (opacity:0), mais son
     horloge est gelée tant que l'onglet est en arrière-plan : la page resterait
     blanche jusqu'à ce que le visiteur y revienne. On n'arme donc la révélation
     que lorsque la page est réellement visible ; avant, le HTML s'affiche tel
     quel, c'est-à-dire complet. */
  function reveler() {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    gsap.from('.hero-copy [data-anim]', {
      opacity: 0, y: 22, duration: .5, stagger: .07, ease: 'power2.out'
    });

    // Tuiles : vague depuis le centre
    gsap.from('[data-tile]', {
      opacity: 0, scale: .86, duration: .45,
      stagger: { each: .05, from: 'center', grid: [3, 3] },
      ease: 'back.out(1.4)', delay: .15,
      // sans ça GSAP laisse un transform en ligne qui écrase le translateZ du CSS :
      // le survol ne soulèverait plus rien.
      clearProps: 'transform,opacity'
    });

    gsap.from('.iso-links line', {
      opacity: 0, duration: .5, stagger: .03, delay: .5, ease: 'power1.out'
    });

    // les webfonts décalent la mise en page : on recalcule les positions
    window.addEventListener('load', function () {
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });

    /* Depuis la suppression du pied de page, les pages intérieures tiennent
       entièrement dans la fenêtre et ne défilent plus. Un ScrollTrigger n'a
       alors aucun défilement pour se déclencher : tout le contenu restait à
       opacity:0. On ne confie donc au défilement que ce qui est réellement
       sous la ligne de flottaison ; le reste s'anime au chargement. */
    var dedans = [], dessous = [];
    gsap.utils.toArray('.section [data-anim]').forEach(function (el) {
      (el.getBoundingClientRect().top < window.innerHeight * .9 ? dedans : dessous).push(el);
    });

    if (dedans.length) {
      gsap.from(dedans, {
        opacity: 0, y: 24, duration: .45, stagger: .06, ease: 'power2.out'
      });
    }
    dessous.forEach(function (el) {
      gsap.from(el, {
        opacity: 0, y: 24, duration: .45, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* Filet de sécurité : quoi qu'il arrive en amont, aucun contenu ne doit
       rester invisible. Une page blanche est un défaut bien pire qu'une
       animation manquée. */
    setTimeout(function () {
      document.querySelectorAll('[data-anim]').forEach(function (el) {
        if (parseFloat(getComputedStyle(el).opacity) < .99) {
          gsap.set(el, { opacity: 1, y: 0, clearProps: 'transform' });
        }
      });
    }, 1600);
  }

  if (hasGSAP && !reduce) {
    if (document.visibilityState === 'visible') {
      reveler();
    } else {
      document.addEventListener('visibilitychange', function onVisible() {
        if (document.visibilityState !== 'visible') return;
        document.removeEventListener('visibilitychange', onVisible);
        reveler();
      });
    }
  }

  /* ---------- 2. Compteurs ---------- */
  /* Le HTML porte déjà la valeur finale. On ne remet à zéro qu'au moment précis
     où l'animation démarre : si elle ne démarre jamais, rien n'est faussé.     */
  function runCounter(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    if (reduce || !hasGSAP || isNaN(target)) return;   // on laisse la valeur écrite
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.1, ease: 'power2.out',
      // le zéro n'est posé qu'au premier battement réel : si l'onglet est en
      // arrière-plan et que rien ne tourne, la vraie valeur reste affichée.
      onStart: function () { el.textContent = '0' + suffix; },
      onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; },
      onComplete: function () { el.textContent = target + suffix; }
    });
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); io.unobserve(e.target); }
      });
    }, { threshold: .4 });
    counters.forEach(function (c) { io.observe(c); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- 3. Le solide : épaisseur réelle + rotation au curseur ---------- */
  var stage = document.getElementById('iso');
  var plane = stage && stage.querySelector('.iso-plane');

  if (stage && plane) {

    /* 3a. On donne du corps aux tuiles.
       Des plans empilés en Z plutôt que 4 parois : le contour arrondi est conservé
       et il n'y a aucun trou dans les angles.                                      */
    var LAYERS = 12;
    document.querySelectorAll('[data-tile]').forEach(function (tile) {
      var depth = parseFloat(getComputedStyle(tile).getPropertyValue('--depth')) || 16;

      // Le bouton ne bouge pas : on déplace tout son contenu dans une coque
      // qui, elle, se soulève. La zone de survol reste donc immobile.
      var lift = document.createElement('span');
      lift.className = 'tile-lift';
      while (tile.firstChild) lift.appendChild(tile.firstChild);

      for (var i = 1; i <= LAYERS; i++) {
        var slab = document.createElement('span');
        slab.className = 'tile-body';
        slab.style.transform = 'translateZ(' + (-depth * i / LAYERS) + 'px)';
        // la tranche s'assombrit vers le bas : elle prend la lumière de biais
        slab.style.filter = 'brightness(' + (1 - .22 * i / LAYERS).toFixed(3) + ')';
        lift.insertBefore(slab, lift.firstChild);
      }
      tile.appendChild(lift);
    });

    /* 3b. Rotation pilotée au curseur, sur 180°.
       Glisser fait tourner la scène ; sans glisser, le survol l'incline légèrement. */
    var RZ0 = 45, RX0 = 56;          // orientation de repos
    var SWEEP = 90;                  // ±90° => 180° d'amplitude totale
    var rz = RZ0, rx = RX0, trz = RZ0, trx = RX0;
    var raf = null, dragging = false, armed = false, lastX = 0, lastY = 0;
    var startX = 0, startY = 0, THRESHOLD = 4;   // px avant de basculer en glissement
    var reduceMotion = reduce;

    function apply() {
      plane.style.setProperty('--rz', rz.toFixed(2) + 'deg');
      plane.style.setProperty('--rx', rx.toFixed(2) + 'deg');
    }
    function tick() {
      rz += (trz - rz) * .12;
      rx += (trx - rx) * .12;
      apply();
      raf = (Math.abs(trz - rz) > .05 || Math.abs(trx - rx) > .05)
        ? requestAnimationFrame(tick) : null;
    }
    function nudge() { if (!raf) raf = requestAnimationFrame(tick); }

    stage.addEventListener('pointerdown', function (ev) {
      armed = true; dragging = false;
      startX = lastX = ev.clientX; startY = lastY = ev.clientY;
    });
    function endDrag(ev) {
      armed = false; dragging = false; stage.classList.remove('is-dragging');
      if (ev && ev.pointerId != null) {
        try { stage.releasePointerCapture(ev.pointerId); } catch (e) {}
      }
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    stage.addEventListener('pointermove', function (ev) {
      // on n'entre en glissement qu'au-delà du seuil : sinon un simple clic
      // sur une tuile ferait pivoter la scène.
      if (armed && !dragging &&
          Math.hypot(ev.clientX - startX, ev.clientY - startY) > THRESHOLD) {
        dragging = true;
        stage.classList.add('is-dragging');
        try { stage.setPointerCapture(ev.pointerId); } catch (e) {}
      }
      if (dragging) {
        trz += (ev.clientX - lastX) * .45;               // glisser : rotation libre
        trx = Math.max(8, Math.min(88, trx - (ev.clientY - lastY) * .3));
        trz = Math.max(RZ0 - SWEEP, Math.min(RZ0 + SWEEP, trz));   // bridé à 180°
        lastX = ev.clientX; lastY = ev.clientY;
        nudge();
      } else if (!reduceMotion && window.matchMedia('(hover:hover)').matches) {
        var r = stage.getBoundingClientRect();           // survol : inclinaison douce
        trz = RZ0 - ((ev.clientX - r.left) / r.width - .5) * 16;
        trx = RX0 + ((ev.clientY - r.top) / r.height - .5) * 10;
        nudge();
      }
    });
    stage.addEventListener('pointerleave', function () {
      endDrag();
      trz = RZ0; trx = RX0; nudge();                     // retour à l'orientation de repos
    });

    // double-clic : on remet la scène d'aplomb
    stage.addEventListener('dblclick', function () { trz = RZ0; trx = RX0; nudge(); });

    apply();
  }

  /* ---------- 4. Les jambes de la marque (nav) ---------- */
  (function legFlutter() {
    var mark  = document.querySelector('.brand .brand-mark');
    var legUp = mark && mark.querySelector('.k-leg-up');
    var legDn = mark && mark.querySelector('.k-leg-dn');
    if (!legUp || !legDn || !hasGSAP || reduce) return;   // sans GSAP : logo statique, intact

    var HIP   = '35 50';   // jonction des flux sur le tronc : le pivot
    var SWING = 7;         // amplitude : plus discrète, car la boucle tourne en continu
    var BEAT  = .46;       // durée d'un pas

    // Foulée sur place, en boucle : chaque jambe part du repos, va d'un côté,
    // passe de l'autre, revient à 0 — puis on recommence, indéfiniment.
    var tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: 'sine.inOut', svgOrigin: HIP }
    });
    tl.to(legUp, { rotation:  SWING, duration: BEAT }, 0)
      .to(legUp, { rotation: -SWING, duration: BEAT * 2 }, BEAT)
      .to(legUp, { rotation: 0,      duration: BEAT }, BEAT * 3)

      .to(legDn, { rotation: -SWING, duration: BEAT }, 0)
      .to(legDn, { rotation:  SWING, duration: BEAT * 2 }, BEAT)
      .to(legDn, { rotation: 0,      duration: BEAT }, BEAT * 3)

      // le tronc accompagne d'un rebond discret : un appui par pas
      .to(mark, { y: -1.5, duration: BEAT, ease: 'sine.out',
                  yoyo: true, repeat: 3, svgOrigin: null }, 0);

    // onglet en arrière-plan : on arrête, inutile de consommer
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) tl.pause();
      else tl.resume();
    });
  })();

  /* ---------- 5. Menu mobile ---------- */
  /* Sous 980px la barre de liens se replie dans un panneau. Sans ce bouton,
     les pages du site n'étaient atteignables sur aucun téléphone. */
  (function () {
    var bouton = document.querySelector('.nav-toggle');
    var menu = document.getElementById('nav-menu');
    if (!bouton || !menu) return;

    function fermer() {
      menu.classList.remove('is-open');
      bouton.setAttribute('aria-expanded', 'false');
      bouton.querySelector('.sr-only').textContent = 'Ouvrir le menu';
    }
    function basculer() {
      var ouvert = menu.classList.toggle('is-open');
      bouton.setAttribute('aria-expanded', String(ouvert));
      bouton.querySelector('.sr-only').textContent = ouvert ? 'Fermer le menu' : 'Ouvrir le menu';
    }

    bouton.addEventListener('click', basculer);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        fermer();
        bouton.focus();
      }
    });

    // un clic hors du panneau le referme
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (menu.contains(e.target) || bouton.contains(e.target)) return;
      fermer();
    });

    // si la fenêtre repasse au-dessus du seuil, le panneau n'a plus lieu d'être
    window.matchMedia('(min-width:981px)').addEventListener('change', function (m) {
      if (m.matches) fermer();
    });
  })();

  /* ---------- 6. Clic : maintien de l'élévation ---------- */
  document.querySelectorAll('[data-tile]').forEach(function (tile) {
    tile.addEventListener('click', function () {
      var was = tile.classList.contains('is-held');
      document.querySelectorAll('.is-held').forEach(function (t) {
        t.classList.remove('is-held');
      });
      if (!was) tile.classList.add('is-held');
    });
  });
})();
