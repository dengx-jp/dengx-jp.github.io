/* DenGX: Webflow 依存機能の置き換え（フォーム送信・検索・旧URL互換） */
(function () {
  'use strict'

  // ── お問い合わせフォーム ─────────────────────────────
  // 静的サイトのためサーバー処理が無い。送信先は <head> の meta で指定する:
  //   <meta name="dengx-form-endpoint" content="https://…">  外部フォームサービス（Formspree 等）へ POST
  //   <meta name="dengx-contact-mailto" content="info@…">   未設定時はメールソフトを開いて送る
  // 表示の切替（.w-form-done / .w-form-fail）は Webflow と同じ挙動。
  var meta = function (name) {
    var m = document.querySelector('meta[name="' + name + '"]')
    return m ? (m.getAttribute('content') || '').trim() : ''
  }

  document.addEventListener(
    'submit',
    function (e) {
      var form = e.target
      if (!form || !form.matches || !form.matches('form[data-cms-form]')) return
      e.preventDefault()
      e.stopImmediatePropagation()

      var wrap = form.closest('.w-form') || form.parentNode
      var done = wrap.querySelector('.w-form-done')
      var fail = wrap.querySelector('.w-form-fail')
      var btn = form.querySelector('[type="submit"]')
      var original = btn ? btn.value : ''
      var endpoint = meta('dengx-form-endpoint')
      var mailto = meta('dengx-contact-mailto')

      var showDone = function () {
        form.style.display = 'none'
        if (done) done.style.display = 'block'
      }
      var showFail = function (message) {
        if (!fail) return
        var msg = fail.querySelector('div') || fail
        if (message) msg.textContent = message
        fail.style.display = 'block'
      }
      var reset = function () {
        if (btn) {
          btn.disabled = false
          btn.value = original
        }
      }

      if (fail) fail.style.display = 'none'
      var fd = new FormData(form)
      var lines = []
      fd.forEach(function (v, k) {
        if (typeof v === 'string' && v) lines.push(k + ': ' + v)
      })

      if (endpoint) {
        if (btn) {
          btn.disabled = true
          btn.value = btn.getAttribute('data-wait') || '送信中...'
        }
        fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
          .then(function (r) {
            if (!r.ok) throw new Error('error')
            showDone()
          })
          .catch(function () {
            showFail()
          })
          .finally(reset)
        return
      }

      if (mailto) {
        var subject = form.getAttribute('data-cms-subject') || 'Webサイトからのお問い合わせ'
        window.location.href = 'mailto:' + mailto + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'))
        showDone()
        return
      }

      showFail('現在フォームからの送信ができません。お手数ですがメールまたはお電話にてお問い合わせください。')
    },
    true,
  )

  // ── 旧URL互換: /news?page=2 → /news/page/2 ────────────────
  // （Webflow 時代の ?c144e501_page=2 と CMS 時代の ?page=2 の両方に対応）
  ;(function () {
    if (window.location.pathname.replace(/\/$/, '') !== '/news') return
    var sp = new URLSearchParams(window.location.search)
    var raw = sp.get('page')
    if (!raw) sp.forEach(function (v, k) { if (/_page$/.test(k)) raw = v })
    var n = parseInt(raw || '', 10)
    if (n > 1) window.location.replace('/news/page/' + n)
  })()

  // ── 検索フォーム（Webflow Site Search → /search?q=） ──────────
  document.addEventListener(
    'submit',
    function (e) {
      var form = e.target
      if (!form || !form.matches || !form.matches('form[action="/search"]')) return
      var input = form.querySelector('input[type="search"]')
      if (input && input.name !== 'q') {
        e.preventDefault()
        e.stopImmediatePropagation()
        window.location.href = '/search?q=' + encodeURIComponent(input.value || '')
      }
    },
    true,
  )
})()
