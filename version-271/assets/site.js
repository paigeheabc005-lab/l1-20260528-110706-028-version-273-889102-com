(function () {
    var body = document.body;
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');

    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            mobilePanel.classList.toggle('is-open');
            body.classList.toggle('menu-open');
        });
    }

    function initHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }

        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var previous = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var active = 0;
        var timer = null;

        function show(index) {
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === active);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === active);
            });
        }

        function restart() {
            if (timer) {
                clearInterval(timer);
            }
            timer = setInterval(function () {
                show(active + 1);
            }, 5200);
        }

        if (slides.length <= 1) {
            return;
        }

        if (previous) {
            previous.addEventListener('click', function () {
                show(active - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(active + 1);
                restart();
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
                restart();
            });
        });

        restart();
    }

    function initFilters() {
        var form = document.querySelector('[data-filter-form]');
        var grid = document.querySelector('[data-card-grid]');
        if (!form || !grid) {
            return;
        }

        var textInput = form.querySelector('[data-filter-text]');
        var yearSelect = form.querySelector('[data-filter-year]');
        var categorySelect = form.querySelector('[data-filter-category]');
        var emptyState = document.querySelector('[data-empty-state]');
        var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
        var params = new URLSearchParams(window.location.search);
        var q = params.get('q');

        if (q && textInput) {
            textInput.value = q;
        }

        function normalize(value) {
            return String(value || '').trim().toLowerCase();
        }

        function applyFilter() {
            var text = normalize(textInput ? textInput.value : '');
            var year = normalize(yearSelect ? yearSelect.value : '');
            var category = normalize(categorySelect ? categorySelect.value : '');
            var visible = 0;

            cards.forEach(function (card) {
                var bag = normalize([
                    card.dataset.title,
                    card.dataset.region,
                    card.dataset.type,
                    card.dataset.tags,
                    card.dataset.category,
                    card.dataset.year
                ].join(' '));
                var matchedText = !text || bag.indexOf(text) !== -1;
                var matchedYear = !year || normalize(card.dataset.year) === year;
                var matchedCategory = !category || normalize(card.dataset.category) === category;
                var matched = matchedText && matchedYear && matchedCategory;
                card.classList.toggle('is-hidden', !matched);
                if (matched) {
                    visible += 1;
                }
            });

            if (emptyState) {
                emptyState.classList.toggle('is-visible', visible === 0);
            }
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            applyFilter();
        });

        [textInput, yearSelect, categorySelect].forEach(function (control) {
            if (control) {
                control.addEventListener('input', applyFilter);
                control.addEventListener('change', applyFilter);
            }
        });

        applyFilter();
    }

    function initPlayer() {
        var shell = document.querySelector('[data-player]');
        var config = window.__PLAYER_CONFIG__;
        if (!shell || !config || !config.source) {
            return;
        }

        var video = shell.querySelector('video');
        var cover = shell.querySelector('[data-player-cover]');
        var button = shell.querySelector('[data-play-button]');
        var hls = null;
        var loaded = false;

        function playVideo() {
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {});
            }
        }

        function loadVideo() {
            if (loaded) {
                playVideo();
                return;
            }

            loaded = true;

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = config.source;
                video.addEventListener('loadedmetadata', playVideo, { once: true });
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hls.loadSource(config.source);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
            } else {
                video.src = config.source;
                video.addEventListener('loadedmetadata', playVideo, { once: true });
            }
        }

        function start() {
            if (cover) {
                cover.classList.add('is-hidden');
            }
            video.controls = true;
            loadVideo();
        }

        if (cover) {
            cover.addEventListener('click', start);
        }

        if (button) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                start();
            });
        }

        video.addEventListener('click', function () {
            if (video.paused) {
                start();
            }
        });

        window.addEventListener('beforeunload', function () {
            if (hls) {
                hls.destroy();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initHero();
        initFilters();
        initPlayer();
    });
})();
