(function () {
  var body = document.body;
  var menuButton = document.querySelector('[data-menu-button]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      var open = mobilePanel.classList.toggle('is-open');
      body.classList.toggle('menu-open', open);
    });
  }

  document.querySelectorAll('[data-search-input]').forEach(function (input) {
    var targetSelector = input.getAttribute('data-search-target');
    var target = targetSelector ? document.querySelector(targetSelector) : document;
    if (!target) {
      return;
    }

    var items = Array.prototype.slice.call(target.querySelectorAll('[data-search-item]'));

    input.addEventListener('input', function () {
      var query = input.value.trim().toLowerCase();

      items.forEach(function (item) {
        var text = item.getAttribute('data-search') || item.textContent.toLowerCase();
        item.hidden = query.length > 0 && text.indexOf(query) === -1;
      });
    });
  });

  function attachStream(video, url) {
    if (!video || !url) {
      return;
    }

    if (video.getAttribute('data-ready') === '1') {
      return;
    }

    video.setAttribute('data-ready', '1');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      video._hls = hls;
      return;
    }

    video.src = url;
  }

  function playBox(box) {
    var video = box.querySelector('video');
    var cover = box.querySelector('.play-cover');

    if (!video) {
      return;
    }

    var url = video.getAttribute('data-stream');
    attachStream(video, url);
    video.controls = true;

    if (cover) {
      cover.classList.add('is-hidden');
    }

    var playResult = video.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(function () {});
    }
  }

  document.querySelectorAll('[data-player]').forEach(function (box) {
    var cover = box.querySelector('.play-cover');
    var video = box.querySelector('video');

    if (cover) {
      cover.addEventListener('click', function () {
        playBox(box);
      });
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.getAttribute('data-ready') !== '1') {
          playBox(box);
        }
      });
    }
  });
})();
