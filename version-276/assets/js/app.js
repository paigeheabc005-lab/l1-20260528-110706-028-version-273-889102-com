(function() {
  var images = document.querySelectorAll("[data-media-image]");
  images.forEach(function(image) {
    image.addEventListener("error", function() {
      image.classList.add("is-broken");
    });
  });

  var menuToggle = document.querySelector("[data-menu-toggle]");
  var mobilePanel = document.querySelector("[data-mobile-panel]");
  if (menuToggle && mobilePanel) {
    menuToggle.addEventListener("click", function() {
      mobilePanel.classList.toggle("is-open");
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
  var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
  var current = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function(slide, slideIndex) {
      slide.classList.toggle("is-active", slideIndex === current);
    });
    dots.forEach(function(dot, dotIndex) {
      dot.classList.toggle("is-active", dotIndex === current);
    });
  }

  dots.forEach(function(dot) {
    dot.addEventListener("click", function() {
      showSlide(Number(dot.getAttribute("data-hero-dot")) || 0);
    });
  });

  if (slides.length > 1) {
    setInterval(function() {
      showSlide(current + 1);
    }, 5600);
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function bindFilter(scope) {
    var input = scope.querySelector("[data-filter-input]");
    var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-search-text]"));
    var result = scope.querySelector("[data-result-count]");
    var empty = scope.querySelector("[data-empty-state]");

    function apply() {
      var query = normalize(input ? input.value : "");
      var visible = 0;
      cards.forEach(function(card) {
        var text = normalize(card.getAttribute("data-search-text"));
        var matched = !query || text.indexOf(query) !== -1;
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });
      if (result) {
        result.textContent = query ? "找到 " + visible + " 部匹配影片" : "浏览精选片单内容";
      }
      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    if (input) {
      input.addEventListener("input", apply);
    }
    apply();
  }

  var scopes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]"));
  scopes.forEach(function(scope) {
    var input = scope.querySelector("[data-filter-input]");
    if (scope.hasAttribute("data-search-page") && input) {
      var params = new URLSearchParams(window.location.search);
      var keyword = params.get("q");
      if (keyword) {
        input.value = keyword;
      }
    }
    bindFilter(scope);
  });
}());
