(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMenu() {
    var button = qs('[data-menu-toggle]');
    var menu = qs('[data-mobile-menu]');
    if (!button || !menu) {
      return;
    }
    button.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function initHero() {
    var slides = qsa('[data-hero-slide]');
    if (slides.length < 2) {
      return;
    }
    var dots = qsa('[data-hero-dot]');
    var prev = qs('[data-hero-prev]');
    var next = qs('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    show(0);
    restart();
  }

  function initPlayer() {
    var video = qs('video[data-hls-src]');
    if (!video) {
      return;
    }
    var src = video.getAttribute('data-hls-src');
    var button = qs('[data-player-start]');
    var overlay = qs('[data-player-overlay]');
    var hls = null;

    function hideOverlay() {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    }

    function attachSource() {
      if (video.dataset.ready === 'true') {
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        video.src = src;
      }
      video.dataset.ready = 'true';
    }

    function playVideo() {
      attachSource();
      hideOverlay();
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
    }

    attachSource();

    if (button) {
      button.addEventListener('click', playVideo);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      }
    });

    video.addEventListener('play', hideOverlay);
    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  function renderSearchCard(movie) {
    return [
      '<article class="movie-card">',
      '  <a class="poster" href="./' + movie.file + '">',
      '    <img src="' + movie.cover + '" alt="' + movie.title.replace(/"/g, '&quot;') + '" loading="lazy">',
      '    <span class="poster-gradient"></span>',
      '    <span class="score-badge">' + movie.score + '</span>',
      '  </a>',
      '  <div class="card-body">',
      '    <a href="./' + movie.file + '" class="card-title">' + movie.title + '</a>',
      '    <p>' + movie.oneLine + '</p>',
      '    <div class="meta-row"><span>' + movie.year + '</span><span>' + movie.type + '</span><span>' + movie.region + '</span></div>',
      '    <div class="tag-row"><span>' + movie.category + '</span></div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function initSearch() {
    var input = qs('[data-search-input]');
    var results = qs('[data-search-results]');
    if (!input || !results || !window.MOVIE_SEARCH_DATA) {
      return;
    }
    var data = window.MOVIE_SEARCH_DATA;

    function search() {
      var keyword = input.value.trim().toLowerCase();
      if (!keyword) {
        results.innerHTML = '<div class="empty-state">输入片名、类型、地区或标签开始搜索。</div>';
        return;
      }
      var matched = data.filter(function (movie) {
        return movie.searchText.indexOf(keyword) !== -1;
      }).slice(0, 80);
      if (!matched.length) {
        results.innerHTML = '<div class="empty-state">未找到相关内容，请尝试更换关键词。</div>';
        return;
      }
      results.innerHTML = matched.map(renderSearchCard).join('');
    }

    input.addEventListener('input', search);
    search();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initHero();
    initPlayer();
    initSearch();
  });
})();
