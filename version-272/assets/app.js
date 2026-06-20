const qs = (selector, parent = document) => parent.querySelector(selector);
const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

function setupMobileMenu() {
    const button = qs('[data-menu-button]');
    const menu = qs('[data-mobile-menu]');
    if (!button || !menu) {
        return;
    }
    button.addEventListener('click', () => {
        menu.classList.toggle('is-open');
    });
}

function setupHeroCarousel() {
    const carousel = qs('[data-hero-carousel]');
    if (!carousel) {
        return;
    }

    const slides = qsa('[data-hero-slide]', carousel);
    const dots = qsa('[data-hero-dot]', carousel);
    const prev = qs('[data-hero-prev]', carousel);
    const next = qs('[data-hero-next]', carousel);
    let current = 0;
    let timer = null;

    const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('is-active', slideIndex === current);
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('is-active', dotIndex === current);
        });
    };

    const schedule = () => {
        clearInterval(timer);
        timer = setInterval(() => show(current + 1), 5200);
    };

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            show(index);
            schedule();
        });
    });

    if (prev) {
        prev.addEventListener('click', () => {
            show(current - 1);
            schedule();
        });
    }

    if (next) {
        next.addEventListener('click', () => {
            show(current + 1);
            schedule();
        });
    }

    show(0);
    schedule();
}

function normalize(value) {
    return String(value || '').toLowerCase().trim();
}

function cardText(card) {
    return normalize([
        card.dataset.title,
        card.dataset.year,
        card.dataset.region,
        card.dataset.type,
        card.dataset.category,
        card.textContent
    ].join(' '));
}

function setupFiltering() {
    const input = qs('.js-search-input');
    const cards = qsa('.js-movie-card');
    const emptyTip = qs('[data-empty-tip]');

    if (!input || cards.length === 0) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) {
        input.value = query;
    }

    const run = () => {
        const keyword = normalize(input.value);
        let visibleCount = 0;

        cards.forEach((card) => {
            const matched = !keyword || cardText(card).includes(keyword);
            card.hidden = !matched;
            if (matched) {
                visibleCount += 1;
            }
        });

        if (emptyTip) {
            emptyTip.hidden = visibleCount !== 0;
        }
    };

    input.addEventListener('input', run);
    run();
}

function setupSorting() {
    const select = qs('.js-sort-select');
    const list = qs('[data-card-list]');

    if (!select || !list) {
        return;
    }

    const sortCards = () => {
        const cards = qsa('.js-movie-card', list);
        const value = select.value;

        cards.sort((a, b) => {
            if (value === 'title-asc') {
                return String(a.dataset.title || '').localeCompare(String(b.dataset.title || ''), 'zh-Hans-CN');
            }

            if (value === 'score-desc') {
                return Number(b.dataset.score || 0) - Number(a.dataset.score || 0);
            }

            return Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
        });

        cards.forEach((card) => list.appendChild(card));
    };

    select.addEventListener('change', sortCards);
    sortCards();
}

async function attachHls(video, source) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        return;
    }

    const module = await import('./hls-vendor-dru42stk.js');
    const Hls = module.H;

    if (Hls && Hls.isSupported()) {
        const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        video._hls = hls;
    } else {
        video.src = source;
    }
}

function setupPlayers() {
    qsa('[data-video-frame]').forEach((frame) => {
        const video = qs('video[data-src]', frame);
        const button = qs('[data-play-button]', frame);

        if (!video || !button) {
            return;
        }

        const startPlayback = async () => {
            try {
                if (!video.dataset.ready) {
                    await attachHls(video, video.dataset.src);
                    video.dataset.ready = 'true';
                }
                frame.classList.add('is-playing');
                await video.play();
            } catch (error) {
                frame.classList.add('is-playing');
                console.error('播放器初始化失败', error);
            }
        };

        button.addEventListener('click', startPlayback);
        video.addEventListener('play', () => frame.classList.add('is-playing'));
    });
}

function setupImageFallback() {
    qsa('img').forEach((image) => {
        image.addEventListener('error', () => {
            image.style.opacity = '0';
            const parent = image.parentElement;
            if (parent) {
                parent.setAttribute('data-image-missing', 'true');
            }
        }, { once: true });
    });
}

setupMobileMenu();
setupHeroCarousel();
setupFiltering();
setupSorting();
setupPlayers();
setupImageFallback();
