(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function initMenu() {
    var toggle = document.querySelector(".mobile-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("open");
    });
  }

  function initHero() {
    var slider = document.querySelector(".hero-slider");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var prev = document.querySelector("[data-hero-prev]");
    var next = document.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      slides[index].classList.remove("active");
      index = (nextIndex + slides.length) % slides.length;
      slides[index].classList.add("active");
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      start();
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }
    start();
  }

  function cardText(card) {
    return [
      card.getAttribute("data-title"),
      card.getAttribute("data-year"),
      card.getAttribute("data-type"),
      card.getAttribute("data-genre"),
      card.getAttribute("data-tags")
    ].join(" ").toLowerCase();
  }

  function initFilters() {
    var filterRoot = document.querySelector("[data-filter-root]");
    if (!filterRoot) {
      return;
    }
    var input = filterRoot.querySelector("[data-filter-input]");
    var year = filterRoot.querySelector("[data-filter-year]");
    var type = filterRoot.querySelector("[data-filter-type]");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));

    function apply() {
      var keyword = input ? input.value.trim().toLowerCase() : "";
      var yearValue = year ? year.value : "";
      var typeValue = type ? type.value : "";
      cards.forEach(function (card) {
        var text = cardText(card);
        var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
        var matchYear = !yearValue || card.getAttribute("data-year") === yearValue;
        var matchType = !typeValue || card.getAttribute("data-type").indexOf(typeValue) !== -1;
        card.classList.toggle("hidden-card", !(matchKeyword && matchYear && matchType));
      });
    }

    [input, year, type].forEach(function (node) {
      if (node) {
        node.addEventListener("input", apply);
        node.addEventListener("change", apply);
      }
    });
  }

  function initSearchPage() {
    var root = document.querySelector("[data-search-page]");
    if (!root || !window.SEARCH_MOVIES) {
      return;
    }
    var form = root.querySelector("form");
    var input = root.querySelector("input[name='q']");
    var results = document.querySelector("[data-search-results]");
    var empty = document.querySelector("[data-search-empty]");
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    input.value = initial;

    function render(items) {
      results.innerHTML = items.map(function (movie, idx) {
        return [
          '<article class="movie-card" data-title="', escapeHtml(movie.title), '" data-year="', escapeHtml(movie.year), '" data-type="', escapeHtml(movie.type), '" data-genre="', escapeHtml(movie.genre), '" data-tags="', escapeHtml(movie.tags.join(" ")), '">',
          '<a class="poster-link" href="', movie.file, '">',
          '<img src="', movie.cover, '" alt="', escapeHtml(movie.title), '" loading="lazy">',
          idx < 20 ? '<span class="rank-badge">' + (idx + 1) + '</span>' : '',
          '<span class="poster-glow"></span>',
          '</a>',
          '<div class="card-body">',
          '<div class="meta-line"><span>', escapeHtml(movie.year), '</span><span>', escapeHtml(movie.type), '</span><span>', escapeHtml(movie.region), '</span></div>',
          '<h2><a href="', movie.file, '">', escapeHtml(movie.title), '</a></h2>',
          '<p>', escapeHtml(movie.description), '</p>',
          '<div class="tag-row">', movie.tags.slice(0, 3).map(function (tag) { return '<span>' + escapeHtml(tag) + '</span>'; }).join(""), '</div>',
          '</div>',
          '</article>'
        ].join("");
      }).join("");
      empty.classList.toggle("show", items.length === 0);
    }

    function search() {
      var q = input.value.trim().toLowerCase();
      var items = window.SEARCH_MOVIES.filter(function (movie) {
        if (!q) {
          return movie.hot;
        }
        return [movie.title, movie.year, movie.type, movie.region, movie.genre, movie.tags.join(" "), movie.description].join(" ").toLowerCase().indexOf(q) !== -1;
      }).slice(0, 120);
      render(items);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var q = input.value.trim();
      var url = q ? "search.html?q=" + encodeURIComponent(q) : "search.html";
      history.replaceState(null, "", url);
      search();
    });
    input.addEventListener("input", search);
    search();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  window.initMoviePlayer = function (streamUrl) {
    var video = document.getElementById("moviePlayer");
    var button = document.getElementById("playButton");
    if (!video || !button || !streamUrl) {
      return;
    }
    var mounted = false;
    var hls = null;

    function mount() {
      if (mounted) {
        return Promise.resolve();
      }
      mounted = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        return Promise.resolve();
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        return new Promise(function (resolve) {
          hls.on(window.Hls.Events.MANIFEST_PARSED, resolve);
        });
      }
      video.src = streamUrl;
      return Promise.resolve();
    }

    function play() {
      button.classList.add("hidden");
      mount().then(function () {
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            button.classList.remove("hidden");
          });
        }
      });
    }

    button.addEventListener("click", play);
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      button.classList.add("hidden");
    });
  };

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initSearchPage();
  });
})();
