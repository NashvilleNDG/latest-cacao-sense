(function () {
  'use strict';

  function tsFormatMoney(cents, format) {
    if (typeof cents !== 'number') {
      cents = parseInt(cents, 10);
    }
    if (isNaN(cents)) {
      return '';
    }
    var formatString = format || '${{amount}}';
    var placeholder = /\{\{\s*(\w+)\s*\}\}/;
    var match = formatString.match(placeholder);

    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = precision == null ? 2 : precision;
      thousands = thousands || ',';
      decimal = decimal || '.';
      if (isNaN(number) || number == null) {
        return '';
      }
      var n = (number / 100.0).toFixed(precision);
      var parts = n.split('.');
      var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      var centsAmount = parts[1] ? decimal + parts[1] : '';
      return dollarsAmount + centsAmount;
    }

    if (!match) {
      return formatWithDelimiters(cents, 2);
    }
    var value;
    switch (match[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      default:
        value = formatWithDelimiters(cents, 2);
    }
    return formatString.replace(placeholder, value);
  }

  function initProductPage() {
    var root = document.querySelector('[data-ts-product-page]');
    if (!root) {
      return;
    }

    var fmt = typeof window.TS_MONEY_FORMAT === 'string' ? window.TS_MONEY_FORMAT : '${{amount}}';
    var variantsEl = document.getElementById('ts-product-variants-data');
    var variants = [];
    if (variantsEl && variantsEl.textContent) {
      try {
        variants = JSON.parse(variantsEl.textContent);
      } catch (e) {
        variants = [];
      }
    }

    var mainImg = root.querySelector('[data-ts-main-image]');
    var thumbs = root.querySelectorAll('[data-ts-product-thumb]');
    var variantSelect = root.querySelector('[data-ts-variant-select]');
    var qtyInput = root.querySelector('[data-ts-qty]');
    var decBtn = root.querySelector('[data-ts-qty-dec]');
    var incBtn = root.querySelector('[data-ts-qty-inc]');
    var priceEl = root.querySelector('[data-ts-price]');
    var compareEl = root.querySelector('[data-ts-compare]');
    var saveEl = root.querySelector('[data-ts-save]');
    var atcPriceEl = root.querySelector('[data-ts-atc-price]');
    var wishBtn = root.querySelector('[data-ts-wishlist]');

    function getVariantById(id) {
      var n = parseInt(id, 10);
      for (var i = 0; i < variants.length; i++) {
        if (variants[i].id === n) {
          return variants[i];
        }
      }
      return variants[0] || null;
    }

    function getSelectedVariant() {
      if (variantSelect) {
        return getVariantById(variantSelect.value);
      }
      return variants[0] || null;
    }

    function getQty() {
      if (!qtyInput) {
        return 1;
      }
      var q = parseInt(qtyInput.value, 10);
      if (isNaN(q) || q < 1) {
        return 1;
      }
      return q;
    }

    function syncThumbActive(src) {
      thumbs.forEach(function (t) {
        var s = t.getAttribute('data-image-src') || '';
        t.classList.toggle('is-active', s === src);
        t.setAttribute('aria-selected', s === src ? 'true' : 'false');
      });
    }

    function updateUiFromVariant() {
      var v = getSelectedVariant();
      if (!v || !priceEl) {
        return;
      }
      var qty = getQty();
      priceEl.textContent = tsFormatMoney(v.price, fmt);

      if (compareEl) {
        if (v.compare_at_price && v.compare_at_price > v.price) {
          compareEl.hidden = false;
          compareEl.textContent = tsFormatMoney(v.compare_at_price, fmt);
        } else {
          compareEl.hidden = true;
          compareEl.textContent = '';
        }
      }

      if (saveEl) {
        var tpl = saveEl.getAttribute('data-ts-save-template') || '';
        if (v.compare_at_price && v.compare_at_price > v.price) {
          saveEl.hidden = false;
          var saveCents = v.compare_at_price - v.price;
          var saveStr = tsFormatMoney(saveCents, fmt);
          saveEl.textContent = tpl.indexOf('__AMT__') !== -1 ? tpl.replace(/__AMT__/g, saveStr) : saveStr;
        } else {
          saveEl.hidden = true;
          saveEl.textContent = '';
        }
      }

      if (atcPriceEl) {
        atcPriceEl.textContent = tsFormatMoney(v.price * qty, fmt);
      }

      if (mainImg && v.featured_image) {
        mainImg.src = v.featured_image;
        syncThumbActive(v.featured_image);
      }
    }

    thumbs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-image-src');
        var alt = btn.getAttribute('data-image-alt') || '';
        if (mainImg && src) {
          mainImg.src = src;
          mainImg.alt = alt;
          syncThumbActive(src);
        }
      });
    });

    if (variantSelect) {
      variantSelect.addEventListener('change', updateUiFromVariant);
    }

    function bumpQty(delta) {
      if (!qtyInput) {
        return;
      }
      var q = getQty() + delta;
      if (q < 1) {
        q = 1;
      }
      qtyInput.value = String(q);
      updateUiFromVariant();
    }

    if (decBtn) {
      decBtn.addEventListener('click', function () {
        bumpQty(-1);
      });
    }
    if (incBtn) {
      incBtn.addEventListener('click', function () {
        bumpQty(1);
      });
    }
    if (qtyInput) {
      qtyInput.addEventListener('input', function () {
        updateUiFromVariant();
      });
    }

    if (wishBtn) {
      wishBtn.addEventListener('click', function () {
        wishBtn.classList.toggle('is-active');
      });
    }

    updateUiFromVariant();
  }

  function initHeader() {
    var nav = document.querySelector('[data-ts-header]');
    if (!nav) return;

    function onScroll() {
      nav.classList.toggle('ts-header--scrolled', window.scrollY > 60);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var toggle = nav.querySelector('[data-ts-nav-toggle]');
    var panel = nav.querySelector('[data-ts-nav-panel]');
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        var open = panel.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      panel.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          panel.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  function initScrollTop() {
    var btn = document.querySelector('[data-ts-scroll-top]');
    if (!btn) {
      return;
    }

    var threshold = 400;

    function updateVisibility() {
      var y = window.scrollY || document.documentElement.scrollTop;
      btn.classList.toggle('is-visible', y > threshold);
    }

    btn.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        window.scrollTo(0, 0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
  }

  function initDropdowns() {
    var dropdowns = document.querySelectorAll('[data-ts-dropdown]');
    if (!dropdowns.length) {
      return;
    }

    function closeAll(except) {
      dropdowns.forEach(function (dd) {
        if (dd === except) {
          return;
        }
        dd.classList.remove('is-open');
        var t = dd.querySelector('[data-ts-dropdown-toggle]');
        if (t) {
          t.setAttribute('aria-expanded', 'false');
        }
      });
    }

    dropdowns.forEach(function (dd) {
      var toggle = dd.querySelector('[data-ts-dropdown-toggle]');
      if (!toggle) {
        return;
      }
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        var open = dd.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          closeAll(dd);
        }
      });
    });

    document.addEventListener('click', function (e) {
      dropdowns.forEach(function (dd) {
        if (!dd.contains(e.target)) {
          dd.classList.remove('is-open');
          var t = dd.querySelector('[data-ts-dropdown-toggle]');
          if (t) {
            t.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        closeAll(null);
      }
    });
  }

  function initProductFilters() {
    var root = document.querySelector('[data-ts-products]');
    if (!root) return;

    var buttons = root.querySelectorAll('[data-ts-filter-btn]');
    var cards = root.querySelectorAll('[data-ts-product-card]');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = (btn.getAttribute('data-ts-filter-btn') || 'all').toLowerCase();

        buttons.forEach(function (b) {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');

        cards.forEach(function (card) {
          var badges = (card.getAttribute('data-ts-badges') || '').toLowerCase();
          var show = filter === 'all' || badges.indexOf(filter) !== -1;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initHeader();
      initDropdowns();
      initScrollTop();
      initProductFilters();
      initProductPage();
    });
  } else {
    initHeader();
    initDropdowns();
    initScrollTop();
    initProductFilters();
    initProductPage();
  }
})();
