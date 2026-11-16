/* Kubotal — interactions et accessibilité progressive
   GSAP est optionnel : la page reste entièrement lisible et interactive sans lui. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';

  /* ---------- 1. Révélations ---------- */
  /* Les apparitions restent gérées en CSS (@keyframes kb-apparait). */

  /* ---------- 2. Compteurs ---------- */
  function runCounter(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    if (reduce || !hasGSAP || isNaN(target)) return;
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.1, ease: 'power2.out',
      onStart: function () { el.textContent = '0' + suffix; },
      onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; },
      onComplete: function () { el.textContent = target + suffix; }
    });
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
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
  }

  /* ---------- 3. Filtre interactif du schéma d'architecture (Hero) ---------- */
  (function () {
    var stage = document.getElementById('iso');
    var filter = document.querySelector('[data-arch-filter]');
    if (!stage || !filter) return;

    function updateLayer() {
      var checked = filter.querySelector('input[type="radio"]:checked');
      stage.setAttribute('data-active-layer', checked ? checked.value : 'all');
    }
    filter.addEventListener('change', updateLayer);
    updateLayer();
  })();

  /* ---------- 4. Marque Kubotal : immobile au repos, micro-pas au survol/focus ---------- */
  (function legHover() {
    var brand = document.querySelector('.nav .brand');
    var mark  = brand && brand.querySelector('.brand-mark');
    var legUp = mark && mark.querySelector('.k-leg-up');
    var legDn = mark && mark.querySelector('.k-leg-dn');
    if (!brand || !legUp || !legDn || !hasGSAP || reduce) return;

    var HIP   = '35 50';
    var SWING = 5;
    var BEAT  = .24;
    var tl = null;

    function playOnce() {
      if (tl && tl.isActive()) return;
      tl = gsap.timeline({ defaults: { ease: 'sine.inOut' } });
      tl.to(legUp, { rotation:  SWING, duration: BEAT,     svgOrigin: HIP }, 0)
        .to(legUp, { rotation: -SWING, duration: BEAT * 1.4, svgOrigin: HIP }, BEAT)
        .to(legUp, { rotation: 0,      duration: BEAT,     svgOrigin: HIP }, BEAT * 2.4)
        .to(legDn, { rotation: -SWING, duration: BEAT,     svgOrigin: HIP }, 0)
        .to(legDn, { rotation:  SWING, duration: BEAT * 1.4, svgOrigin: HIP }, BEAT)
        .to(legDn, { rotation: 0,      duration: BEAT,     svgOrigin: HIP }, BEAT * 2.4);
    }

    brand.addEventListener('mouseenter', playOnce);
    brand.addEventListener('focus', playOnce);
  })();

  /* ---------- 5. Recherche dans les articles ---------- */
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

    function pliage(t) {
      return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function ligne(a) {
      return '<a class="glass post" href="/articles/' + a.s + '/" style="--tint:' + a.c + '">' +
        '<div><div class="post-meta"><span class="post-tag">' + a.g + '</span>' +
        '<span aria-hidden="true">·</span>' +
        '<time datetime="' + a.d + '">' + a.f + '</time>' +
        '<span aria-hidden="true">·</span><span>' + a.m + ' min de lecture</span></div>' +
        '<h3>' + a.t + '</h3><p>' + a.r + '</p></div>' +
        '<span class="post-go" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-arrow"/></svg></span></a>';
    }

    function chercher() {
      var q = pliage(champ.value.trim());
      boite.classList.toggle('a-du-texte', q.length > 0);

      if (!q) {
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

    function memoriser() {
      if (!window.history || !history.replaceState) return;
      var url = new URL(location.href);
      if (champ.value.trim()) url.searchParams.set('q', champ.value.trim());
      else url.searchParams.delete('q');
      history.replaceState(null, '', url);
    }

    champ.addEventListener('input', function () { chercher(); memoriser(); });
    champ.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && champ.value) { champ.value = ''; chercher(); memoriser(); }
    });
    vider.addEventListener('click', function () {
      champ.value = ''; chercher(); memoriser(); champ.focus();
    });

    var initial = new URLSearchParams(location.search).get('q');
    if (initial) { champ.value = initial; chercher(); }
  })();

  /* ---------- 6. Sommaire d'article ---------- */
  (function () {
    var toc = document.getElementById('toc');
    if (!toc) return;
    var titres = [].slice.call(document.querySelectorAll('.article-body h2'));
    if (titres.length < 3) return;

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

  /* ---------- 7. Navigation adaptative et menu popover ---------- */
  (function () {
    var header = document.querySelector('.nav');
    var inner = header && header.querySelector('.nav-inner');
    var bouton = document.querySelector('.nav-toggle');
    var menu = document.getElementById('nav-menu');
    if (!header || !inner || !bouton || !menu) return;

    var hasPopover = Object.hasOwn(HTMLElement.prototype, 'popover');
    var lastWidth = 0;

    function fermer() {
      if (hasPopover && menu.hasAttribute('popover')) {
        try { if (menu.matches(':popover-open')) menu.hidePopover(); } catch (e) {}
      }
      menu.classList.remove('is-open');
      bouton.setAttribute('aria-expanded', 'false');
    }

    function syncLayout() {
      var wasOpen = hasPopover && menu.hasAttribute('popover') && menu.matches(':popover-open');
      header.classList.add('is-measuring', 'is-wide');
      menu.removeAttribute('popover');

      var wide = inner.scrollWidth <= inner.clientWidth + 1;
      if (wide) {
        header.classList.add('is-wide');
        menu.removeAttribute('popover');
        menu.classList.remove('is-open');
        bouton.setAttribute('aria-expanded', 'false');
      } else {
        header.classList.remove('is-wide');
        if (hasPopover) {
          menu.setAttribute('popover', 'auto');
          if (wasOpen) {
            try { menu.showPopover(); } catch (e) {}
          }
        }
      }
      lastWidth = header.clientWidth;
      requestAnimationFrame(function () {
        header.classList.remove('is-measuring');
      });
    }

    if (hasPopover) {
      menu.addEventListener('toggle', function (e) {
        bouton.setAttribute('aria-expanded', String(e.newState === 'open'));
      });
    } else {
      bouton.addEventListener('click', function () {
        var ouvert = menu.classList.toggle('is-open');
        bouton.setAttribute('aria-expanded', String(ouvert));
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) {
          fermer();
          bouton.focus();
        }
      });
      document.addEventListener('click', function (e) {
        if (!menu.classList.contains('is-open')) return;
        if (menu.contains(e.target) || bouton.contains(e.target)) return;
        fermer();
      });
    }

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a') && !header.classList.contains('is-wide')) fermer();
    });

    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function () {
        if (header.classList.contains('is-wide') || header.clientWidth > lastWidth) {
          syncLayout();
        } else {
          lastWidth = header.clientWidth;
        }
      });
      ro.observe(header);
      ro.observe(menu);
    } else {
      window.addEventListener('resize', syncLayout);
    }

    syncLayout();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncLayout);
    }

    /* Fallback de séparation du header au défilement */
    if (!CSS.supports('(animation-timeline: scroll()) and (animation-range: 0% 100%)')) {
      var syncScroll = function () {
        header.classList.toggle('is-scrolled', window.scrollY > 12);
      };
      window.addEventListener('scroll', syncScroll, { passive: true });
      syncScroll();
    }
  })();

  /* ---------- 8. Section courante dans la landing ---------- */
  (function () {
    var main = document.querySelector('main[data-page="home"]');
    if (!main) return;
    var sections = [].slice.call(main.querySelectorAll('[data-nav-section]'));
    var liens = [].slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
    if (!sections.length || !liens.length || !('IntersectionObserver' in window)) return;

    var liensParId = new Map(liens.map(function (lien) {
      return [lien.getAttribute('href').slice(1), lien];
    }));

    function activer(id) {
      liens.forEach(function (lien) { lien.removeAttribute('aria-current'); });
      var lien = liensParId.get(id);
      if (lien) lien.setAttribute('aria-current', 'location');
    }

    liens.forEach(function (lien) {
      lien.addEventListener('click', function () {
        activer(lien.getAttribute('href').slice(1));
      });
    });

    var visibles = new Map();
    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        if (entree.isIntersecting) visibles.set(entree.target.id, entree.intersectionRatio);
        else visibles.delete(entree.target.id);
      });
      var courant = [].slice.call(visibles.entries()).sort(function (a, b) {
        return b[1] - a[1];
      })[0];
      if (courant) activer(courant[0]);
    }, {rootMargin: '-20% 0px -55% 0px', threshold: [0, .15, .4, .7]});

    sections.forEach(function (section) {
      observateur.observe(section);
    });
  })();

  /* ---------- 9. Tableaux responsives accessibles ---------- */
  (function () {
    var wraps = document.querySelectorAll('.article-table-wrap');
    wraps.forEach(function (wrap) {
      var table = wrap.querySelector('.article-table');
      if (!table) return;
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'region');
      if (!wrap.hasAttribute('aria-label')) {
        var prev = wrap.previousElementSibling;
        while (prev && !/^H[2-4]$/.test(prev.tagName)) prev = prev.previousElementSibling;
        wrap.setAttribute('aria-label', prev ? prev.textContent.trim() : 'Tableau comparatif');
      }

      var headers = [].slice.call(table.querySelectorAll('thead th')).map(function (th) {
        return th.textContent.trim();
      });
      if (!headers.length) return;
      table.querySelectorAll('tbody tr').forEach(function (tr) {
        [].slice.call(tr.children).forEach(function (cell, index) {
          if (cell.tagName === 'TD' && headers[index]) {
            cell.setAttribute('data-label', headers[index]);
          }
        });
      });
    });
  })();
})();
