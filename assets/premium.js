/* =========================================================================
   FRESHAIR MJ - warstwa PREMIUM (interakcje)
   Wszystko jest addytywne: gdy skrypt nie wystartuje, strona działa jak zwykła
   statyczna wizytówka (galeria widoczna, FAQ rozwijane natywnie przez <details>,
   telefon klikalny). Zero zewnętrznych bibliotek.
   ========================================================================= */
(function () {
  'use strict';

  /* --- 1) DIAGRAM: przełącznik zima / lato --------------------------------- */
  var dgBtns = document.querySelectorAll('.dg-switch button');
  if (dgBtns.length) {
    dgBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var mode = b.dataset.mode;
        dgBtns.forEach(function (x) { x.classList.toggle('on', x === b); });
        document.querySelectorAll('[data-dg]').forEach(function (el) {
          el.style.display = (el.dataset.dg === mode) ? '' : 'none';
        });
      });
    });
  }

  /* --- 2) GALERIA: filtry kategorii ---------------------------------------- */
  var filters = document.querySelectorAll('.gal-filters button');
  if (filters.length) {
    filters.forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.dataset.cat;
        filters.forEach(function (x) { x.classList.toggle('on', x === b); });
        document.querySelectorAll('.m-tile').forEach(function (t) {
          t.classList.toggle('is-hidden', cat !== 'all' && t.dataset.cat !== cat);
        });
      });
    });
  }

  /* --- 3) PODGLĄD ZDJĘĆ (lightbox) ----------------------------------------- */
  var zoomables = Array.prototype.slice.call(document.querySelectorAll('.m-tile, .cert'));
  if (zoomables.length) {
    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.innerHTML = '<button class="lb-x" aria-label="Zamknij">&times;</button>' +
      '<button class="lb-prev" aria-label="Poprzednie">&#8249;</button>' +
      '<button class="lb-next" aria-label="Następne">&#8250;</button>' +
      '<img alt=""><div class="lb-cap"></div>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap'), idx = 0;

    function visible() {
      return zoomables.filter(function (t) { return !t.classList.contains('is-hidden'); });
    }
    function show(i) {
      var list = visible();
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var t = list[idx], img = t.querySelector('img');
      if (!img) return;
      lbImg.src = img.getAttribute('src');
      lbImg.alt = img.getAttribute('alt') || '';
      var cap = t.querySelector('.cap, .ct-t b');
      lbCap.textContent = cap ? cap.textContent.trim() : (img.getAttribute('alt') || '');
      lb.classList.add('on');
      document.body.style.overflow = 'hidden';
    }
    function close() { lb.classList.remove('on'); document.body.style.overflow = ''; lbImg.src = ''; }

    zoomables.forEach(function (t) {
      t.addEventListener('click', function () { show(visible().indexOf(t)); });
    });
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbImg) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* --- 4) FORMULARZ: składa wiadomość i otwiera pocztę --------------------- */
  var qf = document.querySelector('form.qform');
  if (qf) {
    qf.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { var el = qf.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      var tresc =
        'Imię i nazwisko: ' + v('imie') + '\n' +
        'Telefon: ' + v('tel') + '\n' +
        'Miejscowość: ' + v('miasto') + '\n' +
        'Czego dotyczy: ' + v('zakres') + '\n' +
        'Etap budowy: ' + v('etap') + '\n' +
        'Metraż: ' + v('metraz') + '\n\n' +
        'Opis:\n' + v('opis') + '\n';
      window.location.href = 'mailto:freshhomeair@gmail.com' +
        '?subject=' + encodeURIComponent('Zapytanie ze strony - ' + (v('zakres') || 'wentylacja')) +
        '&body=' + encodeURIComponent(tresc);
      var ok = qf.querySelector('.qf-ok');
      if (ok) ok.textContent = 'Otwieramy Twój program pocztowy z gotową wiadomością. Jeśli się nie otworzył, zadzwoń: +48 665 327 238.';
    });
  }

  /* --- 5) ROK W STOPCE ------------------------------------------------------ */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();

/* =========================================================================
   WARSTWA PREMIUM v2 (2026-07-27)
   Konfigurator doboru (rekuperacja / klimatyzacja), przekazanie wyniku do
   formularza wyceny, powrót do góry. Wszystko addytywne: bez skryptu strona
   nadal działa, a konfigurator po prostu się nie pokazuje.
   ========================================================================= */
(function () {
  'use strict';

  var calc = document.querySelector('[data-calc]');
  if (calc) {
    /* --- przełącznik zakładek --------------------------------------------- */
    var tabs = calc.querySelectorAll('.calc-tabs button');
    var panes = calc.querySelectorAll('.calc-pane');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.toggle('on', x === b); });
        panes.forEach(function (p) { p.classList.toggle('on', p.dataset.pane === b.dataset.tab); });
        liczRek(); liczKlim();
      });
    });

    var num = function (id, dflt) {
      var el = calc.querySelector('#' + id);
      if (!el) return dflt;
      var v = parseFloat(el.value);
      return isNaN(v) ? dflt : v;
    };
    var val = function (id, dflt) {
      var el = calc.querySelector('#' + id);
      return el ? el.value : dflt;
    };
    var put = function (sel, txt) {
      var el = calc.querySelector(sel);
      if (el) el.textContent = txt;
    };

    /* --- REKUPERACJA -------------------------------------------------------
       Strumienie wywiewane wg PN-83/B-03430: kuchnia z oknem 70 m3/h przy
       kuchence gazowej i 50 przy elektrycznej, łazienka 50, osobne WC 30,
       pomieszczenie bez okna 15. Kontrolnie liczymy też 20 m3/h na osobę
       oraz wymianę z kubatury. Wynik = wartość największa + zapas 20%.      */
    function liczRek() {
      var m2 = num('c-metraz', 150);
      var osoby = num('c-osoby', 4);
      var lazienki = num('c-lazienki', 2);
      var wc = num('c-wc', 1);
      var bezokien = num('c-bezokien', 1);
      var kuchnia = val('c-kuchnia', 'gaz') === 'gaz' ? 70 : 50;

      var wywiew = kuchnia + lazienki * 50 + wc * 30 + bezokien * 15;
      var naOsobe = osoby * 20;
      var kubatura = m2 * 2.6 * 0.5;                  // 0,5 wymiany na godzinę
      var wymagany = Math.max(wywiew, naOsobe, kubatura);
      wymagany = Math.ceil(wymagany / 10) * 10;
      var centrala = Math.ceil((wymagany * 1.2) / 25) * 25;   // zapas na opory i tryb boost
      var krotnosc = (wymagany / (m2 * 2.6));
      var anemo = lazienki + (wc > 0 ? wc : 0) + 1 + bezokien; // punkty wywiewne
      var nawiewy = Math.max(3, Math.round(m2 / 22));

      put('#co-rek-n', String(centrala));
      put('#co-rek-wymagany', wymagany + ' m3/h');
      put('#co-rek-krotnosc', krotnosc.toFixed(2).replace('.', ',') + ' wym./h');
      put('#co-rek-punkty', nawiewy + ' nawiewy / ' + anemo + ' wywiewy');
      put('#co-rek-gwc', centrala >= 350 ? 'wskazany, przy tej wydajności daje najwięcej' : 'opcjonalny, wart rozważenia przy nowej budowie');

      var link = calc.querySelector('#co-rek-cta');
      if (link) {
        link.href = 'kontakt.html?zakres=Rekuperacja&metraz=' + encodeURIComponent(m2 + ' m2') +
          '&opis=' + encodeURIComponent(
            'Wynik z konfiguratora na stronie:\n' +
            '- dom ' + m2 + ' m2, ' + osoby + ' os., ' + lazienki + ' łazienki, ' + wc + ' WC\n' +
            '- wymagany strumień powietrza: ' + wymagany + ' m3/h\n' +
            '- proponowana wydajność centrali: ok. ' + centrala + ' m3/h');
      }
    }

    /* --- KLIMATYZACJA ------------------------------------------------------
       Zapotrzebowanie chłodnicze liczone wskaźnikowo: bazowe W/m2 zależnie od
       strony świata i przeszkleń, korekta na poddasze i liczbę osób.        */
    function liczKlim() {
      var m2 = num('k-metraz', 25);
      var strona = val('k-strona', 'poludnie');
      var typ = val('k-typ', 'standard');
      var osoby = num('k-osoby', 2);

      var baza = { polnoc: 75, wschod: 90, zachod: 100, poludnie: 110 }[strona] || 100;
      if (typ === 'poddasze') baza *= 1.25;
      if (typ === 'przeszklone') baza *= 1.15;
      if (typ === 'nowy') baza *= 0.85;

      var watty = m2 * baza + Math.max(0, osoby - 2) * 100;
      var kw = watty / 1000;
      var szereg = [2.0, 2.5, 3.5, 5.0, 6.0, 7.1, 9.0, 12.0];
      var dobrana = szereg.find(function (s) { return s >= kw; }) || 12.0;

      put('#co-kl-n', dobrana.toFixed(1).replace('.', ','));
      put('#co-kl-zapotrz', kw.toFixed(1).replace('.', ',') + ' kW');
      put('#co-kl-typ', m2 <= 35 ? 'jednostka ścienna split' : (m2 <= 60 ? 'ścienna o większej mocy albo dwie jednostki' : 'multi split, dwie lub trzy jednostki wewnętrzne'));
      put('#co-kl-uwaga', baza >= 105 ? 'strona południowa, warto pomyśleć o zacienieniu okien' : 'układ standardowy, bez dodatkowych zabiegów');

      var link = calc.querySelector('#co-kl-cta');
      if (link) {
        link.href = 'kontakt.html?zakres=Klimatyzacja&metraz=' + encodeURIComponent(m2 + ' m2') +
          '&opis=' + encodeURIComponent(
            'Wynik z konfiguratora na stronie:\n' +
            '- pomieszczenie ' + m2 + ' m2, okna na ' + strona + ', ' + osoby + ' os.\n' +
            '- szacowane zapotrzebowanie: ' + kw.toFixed(1).replace('.', ',') + ' kW\n' +
            '- proponowana jednostka: ' + dobrana.toFixed(1).replace('.', ',') + ' kW');
      }
    }

    calc.querySelectorAll('input,select').forEach(function (el) {
      el.addEventListener('input', function () {
        var out = el.parentElement && el.parentElement.querySelector('.cr-v');
        if (out) out.textContent = el.value + (el.dataset.unit || '');
        liczRek(); liczKlim();
      });
      el.addEventListener('change', function () { liczRek(); liczKlim(); });
    });
    calc.querySelectorAll('.cr-v').forEach(function (out) {
      var el = out.parentElement.querySelector('input');
      if (el) out.textContent = el.value + (el.dataset.unit || '');
    });
    liczRek(); liczKlim();
  }

  /* --- FORMULARZ: uzupełnienie danymi z konfiguratora ---------------------- */
  var qf = document.querySelector('form.qform');
  if (qf && window.location.search) {
    var p = new URLSearchParams(window.location.search);
    ['zakres', 'metraz', 'opis', 'etap'].forEach(function (k) {
      var v = p.get(k);
      if (!v) return;
      var f = qf.querySelector('[name="' + k + '"]');
      if (!f) return;
      if (f.tagName === 'SELECT') {
        Array.prototype.forEach.call(f.options, function (o) {
          if (o.value.toLowerCase() === v.toLowerCase() || o.textContent.trim().toLowerCase() === v.toLowerCase()) f.value = o.value;
        });
      } else {
        f.value = v;
      }
    });
    var box = qf.querySelector('.qf-prefill');
    if (box && p.get('opis')) box.style.display = 'block';
  }

  /* --- POWRÓT DO GÓRY ------------------------------------------------------ */
  var tt = document.createElement('button');
  tt.className = 'totop';
  tt.setAttribute('aria-label', 'Wróć na górę strony');
  tt.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m0 0-6 6m6-6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(tt);
  tt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  var ttTick = false;
  window.addEventListener('scroll', function () {
    if (ttTick) return;
    ttTick = true;
    requestAnimationFrame(function () {
      tt.classList.toggle('on', window.scrollY > 700);
      ttTick = false;
    });
  }, { passive: true });
})();
