/* Kubotal — animations
   GSAP est optionnel : les états "from" ne sont posés que par GSAP lui-même.
   Sans GSAP (CDN bloqué, CSP), la page s'affiche complète et statique.   */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';

  /* ---------- 1. Révélations ---------- */
  /* Les apparitions sont désormais en CSS (@keyframes kb-apparait / kb-tuile).
     Une animation JS pose son état de départ tout de suite mais dépend de
     requestAnimationFrame pour en sortir : si l'horloge ne tourne pas — onglet
     en arrière-plan, rendu suspendu — le contenu reste invisible, et un filet
     à base de setTimeout est lui-même sujet au bridage. Une animation CSS,
     elle, se termine toujours seule dès que la page est peinte, et fonctionne
     sans JavaScript. Voir « RÉVÉLATIONS » dans assets/styles.css.

     GSAP reste utilisé pour ce qui est réellement interactif : compteurs,
     rotation du solide, marque animée. */
  if (window.ScrollTrigger && typeof window.gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
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

  /* ---------- 5. Recherche dans les articles ---------- */
  /* Le champ est injecté ici et non écrit dans le HTML : sans JavaScript il
     n'aurait rien à filtrer, et un champ inerte est pire que pas de champ.
     La liste paginée reste servie par le serveur ; dès qu'une recherche est
     saisie, on cherche dans le catalogue complet et on masque la pagination. */
  (function () {
    var data = document.getElementById('articles-data');
    var liste = document.getElementById('posts');
    var tete = document.querySelector('.posts-tete');
    if (!data || !liste || !tete) return;

    var articles;
    try { articles = JSON.parse(data.textContent); } catch (e) { return; }
    if (!articles.length) return;

    var vide = document.getElementById('posts-vide');
    var compte = document.getElementById('posts-compte');
    var pagination = document.querySelector('.pagination');
    var listeInitiale = liste.innerHTML;
    var compteInitial = compte ? compte.innerHTML : '';

    var boite = document.createElement('div');
    boite.className = 'recherche';
    boite.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>' +
      '<label class="sr-only" for="q">Rechercher un article</label>' +
      '<input id="q" type="search" placeholder="Rechercher un article" autocomplete="off">' +
      '<button class="recherche-vider" type="button">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '<span class="sr-only">Effacer la recherche</span></button>';
    tete.appendChild(boite);

    var champ = boite.querySelector('input');
    var vider = boite.querySelector('.recherche-vider');

    /* Comparaison sans accents ni casse : « securite » doit trouver « sécurité ». */
    function pliage(t) {
      return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function ligne(a) {
      return '<a class="glass post" href="/articles/' + a.s + '/" style="--tint:' + a.c + '">' +
        '<div><div class="post-meta"><span class="post-tag">' + a.g + '</span>' +
        '<time datetime="' + a.d + '">' + a.f + '</time>' +
        '<span aria-hidden="true">·</span><span>' + a.m + ' min de lecture</span></div>' +
        '<h3>' + a.t + '</h3><p>' + a.r + '</p></div>' +
        '<span class="post-go" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-arrow"/></svg></span></a>';
    }

    function chercher() {
      var q = pliage(champ.value.trim());
      boite.classList.toggle('a-du-texte', q.length > 0);

      if (!q) {                       // retour à la page servie par le serveur
        liste.innerHTML = listeInitiale;
        if (compte) compte.innerHTML = compteInitial;
        if (pagination) pagination.hidden = false;
        if (vide) vide.hidden = true;
        return;
      }

      var mots = q.split(/\s+/);
      var trouves = articles.filter(function (a) {
        var champs = pliage(a.t + ' ' + a.r + ' ' + a.g);
        return mots.every(function (m) { return champs.indexOf(m) !== -1; });
      });

      liste.innerHTML = trouves.map(ligne).join('');
      if (pagination) pagination.hidden = true;
      if (vide) vide.hidden = trouves.length > 0;
      if (compte) {
        compte.textContent = trouves.length === 0 ? 'Aucun résultat'
          : trouves.length + (trouves.length > 1 ? ' articles trouvés' : ' article trouvé');
      }
    }

    champ.addEventListener('input', chercher);
    champ.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && champ.value) { champ.value = ''; chercher(); }
    });
    vider.addEventListener('click', function () {
      champ.value = ''; chercher(); champ.focus();
    });
  })();

  /* ---------- 6. Sommaire d'article ---------- */
  /* Construit à partir des <h2> : un nouvel article n'a rien à déclarer.
     Sans JS le conteneur reste masqué et l'article s'affiche en une colonne. */
  (function () {
    var toc = document.getElementById('toc');
    if (!toc) return;
    var titres = [].slice.call(document.querySelectorAll('.article-body h2'));
    if (titres.length < 3) return;   // en dessous, un sommaire n'apporte rien

    var ol = document.createElement('ol');
    var liens = titres.map(function (h, i) {
      if (!h.id) {
        h.id = 'section-' + (i + 1) + '-' + h.textContent.trim().toLowerCase()
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      }
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.trim();
      li.appendChild(a);
      ol.appendChild(li);
      return a;
    });

    var titre = document.createElement('p');
    titre.className = 'toc-titre';
    titre.textContent = 'Sommaire';
    toc.appendChild(titre);
    toc.appendChild(ol);
    toc.hidden = false;

    /* Surlignage de la section courante. IntersectionObserver plutôt qu'un
       écouteur de scroll : pas de calcul à chaque pixel parcouru. */
    if (!('IntersectionObserver' in window)) return;
    var vus = new Map();
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { vus.set(e.target, e); });
      var courant = null;
      titres.forEach(function (h) {
        var e = vus.get(h);
        if (e && e.boundingClientRect.top <= window.innerHeight * .35) courant = h;
      });
      if (!courant) courant = titres[0];
      liens.forEach(function (a, i) {
        if (titres[i] === courant) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, {rootMargin: '-30% 0px -60% 0px', threshold: 0});
    titres.forEach(function (h) { obs.observe(h); });
  })();

  /* ---------- 7. Menu mobile ---------- */
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

  /* ---------- 8. Clic : maintien de l'élévation ---------- */
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
