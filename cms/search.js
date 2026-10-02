/* DenGX: サイト内検索（静的サイト用・ブラウザ側で /search-index.json を絞り込む） */
;(function () {
  'use strict'

  var params = new URLSearchParams(window.location.search)
  var q = (params.get('q') || params.get('query') || '').trim().slice(0, 100)
  var tag = (params.get('tag') || '').trim().slice(0, 100)

  var heading = document.querySelector('[data-search-heading]')
  var results = document.querySelector('[data-search-results]')
  var input = document.querySelector('[data-search-form] input[name="q"]')
  if (!heading || !results) return
  if (input && q) input.value = q
  if (!q && !tag) return

  var TYPE_LABEL = { news: 'NEWS', blog: 'BLOG', page: 'PAGE' }

  var longDate = function (d) {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo' })
    } catch (e) {
      return ''
    }
  }

  /** 前後の文脈つき抜粋 */
  var snippet = function (text, word) {
    if (!text) return ''
    var i = word ? text.toLowerCase().indexOf(word.toLowerCase()) : -1
    var start = Math.max(0, i - 40)
    return (start > 0 ? '…' : '') + text.slice(start, start + 140) + (text.length > start + 140 ? '…' : '')
  }

  var el = function (tagName, className, text) {
    var e = document.createElement(tagName)
    if (className) e.className = className
    if (text != null) e.textContent = text
    return e
  }

  var render = function (heads, list) {
    heading.textContent = heads
    document.title = heads + ' - DenGX Co.,LTD.'
    results.innerHTML = ''
    results.appendChild(el('p', 'cms-search-meta', list.length + '件'))
    list.forEach(function (r) {
      var a = el('a', 'cms-search-result')
      a.href = r.href
      a.appendChild(el('div', 'cms-search-meta', (TYPE_LABEL[r.type] || r.type) + (r.date ? ' ・ ' + longDate(r.date) : '')))
      a.appendChild(el('h3', 'cms-search-title', r.title))
      if (r.text) a.appendChild(el('p', 'cms-search-snippet', r.text))
      results.appendChild(a)
    })
    if (!list.length) results.appendChild(el('p', null, '該当する記事・ページはありませんでした。'))
  }

  heading.textContent = '検索中…'

  fetch('/search-index.json', { credentials: 'same-origin' })
    .then(function (r) {
      return r.json()
    })
    .then(function (index) {
      var items = index.items || []
      if (tag) {
        var t = (index.tags || []).filter(function (x) {
          return x.slug === tag
        })[0]
        var tagged = items
          .filter(function (it) {
            return it.tags && it.tags.indexOf(tag) >= 0
          })
          .map(function (it) {
            return { title: it.title, href: it.href, type: it.type, date: it.date, text: it.text ? it.text.slice(0, 140) : '' }
          })
        render(t ? '#' + t.title : 'タグが見つかりません', t ? tagged : [])
        return
      }
      var words = q.toLowerCase().split(/\s+/).filter(Boolean)
      var hits = items
        .filter(function (it) {
          var hay = (it.title + ' ' + it.text).toLowerCase()
          return words.every(function (w) {
            return hay.indexOf(w) >= 0
          })
        })
        .sort(function (a, b) {
          // タイトル一致を優先し、あとは新しい順
          var ta = a.title.toLowerCase().indexOf(words[0]) >= 0 ? 1 : 0
          var tb = b.title.toLowerCase().indexOf(words[0]) >= 0 ? 1 : 0
          if (ta !== tb) return tb - ta
          return (b.date || '').localeCompare(a.date || '')
        })
        .slice(0, 50)
        .map(function (it) {
          return { title: it.title, href: it.href, type: it.type, date: it.type === 'page' ? null : it.date, text: snippet(it.text, words[0]) }
        })
      render('「' + q + '」の検索結果', hits)
    })
    .catch(function () {
      render('検索', [])
    })
})()
