/* DenGX エディトリアル版の動き（ヘッダー・メニュー・ヒーローの章送り・事業一覧の切替・表示演出） */
(function () {
  var root = document.querySelector('.ed');
  if (!root) return;
  root.classList.add('has-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- ヘッダー: ヒーローを過ぎたら白地に ----
  var header = root.querySelector('[data-ed-header]');
  var hero = root.querySelector('[data-ed-hero]');
  function onScroll() {
    if (!header) return;
    var limit = hero ? hero.offsetHeight - header.offsetHeight - 10 : 10;
    header.classList.toggle('is-solid', window.scrollY > limit);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- スマホ用メニュー ----
  var menuBtn = root.querySelector('[data-ed-menu]');
  var drawer = root.querySelector('[data-ed-drawer]');
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') !== 'true';
      menuBtn.setAttribute('aria-expanded', String(open));
      drawer.hidden = !open;
      root.classList.toggle('is-menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) menuBtn.click();
    });
  }

  // ---- ヒーロー: 章ごとに自動で切り替え（一時停止・章の直接選択つき） ----
  if (hero) {
    var slides = hero.querySelectorAll('[data-ed-slide]');
    var chapters = hero.querySelectorAll('[data-ed-goto]');
    var pauseBtn = hero.querySelector('[data-ed-pause]');
    var pauseLabel = hero.querySelector('[data-ed-pause-label]');
    var interval = (parseFloat(hero.getAttribute('data-interval')) || 6) * 1000;
    hero.style.setProperty('--ed-interval', interval / 1000 + 's');
    var current = 0;
    var timer = null;
    var paused = reduce;

    function show(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === current); });
      chapters.forEach(function (c, k) {
        c.classList.remove('is-active');
        if (k === current) { void c.offsetWidth; c.classList.add('is-active'); } // 進捗バーのアニメーションを先頭から
      });
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (!paused) timer = setTimeout(function () { show(current + 1); }, interval);
    }
    function setPaused(p) {
      paused = p;
      hero.classList.toggle('is-paused', p);
      if (pauseBtn) pauseBtn.setAttribute('aria-pressed', String(p));
      if (pauseLabel) pauseLabel.textContent = p ? '再生' : '一時停止';
      schedule();
    }
    chapters.forEach(function (c) {
      c.addEventListener('click', function () { show(parseInt(c.getAttribute('data-ed-goto'), 10)); });
    });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!paused); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer); else schedule();
    });
    setPaused(paused);
  }

  // ---- 事業一覧: 右の説明がスクロールで中央に来たら、左の画像と番号を切り替える ----
  var biz = root.querySelector('[data-ed-biz]');
  if (biz) {
    var imgs = biz.querySelectorAll('.ed-biz__img');
    var tabs = biz.querySelectorAll('[data-ed-biz-tab]');
    var items = biz.querySelectorAll('[data-ed-biz-item]');
    var active = 0;
    // 画面の中央にいちばん近い項目を「いま見ている事業」とする
    function pickBiz() {
      var mid = window.innerHeight / 2;
      var best = 0;
      var bestDist = Infinity;
      items.forEach(function (it, k) {
        var r = it.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) { bestDist = d; best = k; }
      });
      if (best === active) return;
      active = best;
      imgs.forEach(function (im, k) { im.classList.toggle('is-active', k === best); });
      tabs.forEach(function (t, k) { t.classList.toggle('is-active', k === best); });
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      setTimeout(function () { ticking = false; pickBiz(); }, 60);
    }, { passive: true });
    pickBiz();
    tabs.forEach(function (t) {
      t.style.cursor = 'pointer';
      t.addEventListener('click', function () {
        var target = items[parseInt(t.getAttribute('data-ed-biz-tab'), 10)];
        if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
    });
  }

  // ---- 表示演出: 画面に入ったらふわっと出す ----
  var reveals = root.querySelectorAll('[data-ed-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
  }
})();
