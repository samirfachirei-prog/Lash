/* Lashlume theme — small, dependency-free helpers */
(function () {
  'use strict';

  /* Sticky header shadow */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Lock page scroll while mobile menu is open */
  document.querySelectorAll('[data-mobile-nav]').forEach(function (nav) {
    nav.addEventListener('toggle', function () {
      document.documentElement.style.overflow = nav.open ? 'hidden' : '';
    });
  });

  /* Quantity steppers */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-qty-change]');
    if (!btn) return;
    var wrap = btn.closest('.qty');
    var input = wrap && wrap.querySelector('input');
    if (!input) return;
    var min = parseInt(input.min || '0', 10);
    var next = Math.max(min, (parseInt(input.value, 10) || 0) + parseInt(btn.dataset.qtyChange, 10));
    input.value = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* Product galleries (swipe on touch layouts, fade on desktop) */
  document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
    var main = gallery.querySelector('.gallery__main');
    var slides = gallery.querySelectorAll('[data-media-id]');
    var thumbs = gallery.querySelectorAll('[data-thumb-id]');
    var swipe = window.matchMedia('(max-width: 989px)');
    var counter = null;
    if (slides.length > 1) {
      counter = document.createElement('span');
      counter.className = 'gallery__count';
      counter.setAttribute('aria-hidden', 'true');
      gallery.appendChild(counter);
    }
    var expand = gallery.querySelector('[data-gallery-expand]');
    if (expand) gallery.appendChild(expand);

    function setActive(id, index) {
      slides.forEach(function (s) { s.classList.toggle('is-active', s.dataset.mediaId === String(id)); });
      thumbs.forEach(function (t) {
        var active = t.dataset.thumbId === String(id);
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-current', active ? 'true' : 'false');
        if (active && t.scrollIntoView && swipe.matches) {
          var bar = t.parentElement;
          if (bar) bar.scrollTo({ left: t.offsetLeft - 12, behavior: 'smooth' });
        }
      });
      if (counter) counter.textContent = (index + 1) + ' / ' + slides.length;
    }

    gallery.showMedia = function (id) {
      var index = -1;
      slides.forEach(function (s, i) { if (s.dataset.mediaId === String(id)) index = i; });
      if (index < 0) return;
      setActive(id, index);
      if (swipe.matches && main) main.scrollTo({ left: slides[index].offsetLeft, behavior: 'smooth' });
    };
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () { gallery.showMedia(t.dataset.thumbId); });
    });

    if (main && slides.length > 1) {
      var timer;
      main.addEventListener('scroll', function () {
        if (!swipe.matches) return;
        clearTimeout(timer);
        timer = setTimeout(function () {
          var index = Math.round(main.scrollLeft / Math.max(main.clientWidth, 1));
          index = Math.max(0, Math.min(slides.length - 1, index));
          setActive(slides[index].dataset.mediaId, index);
        }, 60);
      }, { passive: true });
    }

    var first = -1;
    slides.forEach(function (s, i) { if (s.classList.contains('is-active') && first < 0) first = i; });
    if (first < 0) first = 0;
    if (slides[first]) {
      setActive(slides[first].dataset.mediaId, first);
      if (swipe.matches && main && first > 0) main.scrollTo({ left: slides[first].offsetLeft });
    }
  });

  /* Variant picker (select or swatches) */
  function initVariants(sectionId) {
    var dataEl = document.getElementById('ProductVariants-' + sectionId);
    if (!dataEl) return;
    var variants;
    try { variants = JSON.parse(dataEl.textContent); } catch (err) { return; }

    function apply(id) {
      var variant = variants.find(function (v) { return String(v.id) === String(id); });
      if (!variant) return;

      document.querySelectorAll('[data-variant-id="' + sectionId + '"]').forEach(function (input) { input.value = variant.id; });
      document.querySelectorAll('[data-variant-select][data-section="' + sectionId + '"]').forEach(function (sel) { sel.value = variant.id; });

      var priceHtml = variant.compare
        ? '<span class="price__current">' + variant.price + '</span><s class="price__compare">' + variant.compare + '</s>'
        : '<span class="price__current">' + variant.price + '</span>';
      var priceEl = document.getElementById('Price-' + sectionId);
      if (priceEl) {
        priceEl.innerHTML = priceHtml;
        priceEl.classList.toggle('price--sale', !!variant.compare);
      }
      document.querySelectorAll('[data-sticky-price] .price').forEach(function (el) {
        el.innerHTML = priceHtml;
        el.classList.toggle('price--sale', !!variant.compare);
      });

      var addBtn = document.getElementById('AddToCart-' + sectionId);
      if (addBtn) {
        addBtn.disabled = !variant.available;
        var label = addBtn.querySelector('[data-btn-label]');
        var price = addBtn.querySelector('[data-btn-price]');
        if (label) label.textContent = variant.available ? addBtn.dataset.labelAdd : addBtn.dataset.labelSoldOut;
        if (price) { price.hidden = !variant.available; price.innerHTML = '&ndash; ' + variant.price; }
      }
      document.querySelectorAll('[data-sticky-atc] button').forEach(function (b) { b.disabled = !variant.available; });
      document.querySelectorAll('[data-stock]').forEach(function (el) { el.hidden = !variant.available; });
      document.querySelectorAll('[data-save-pill]').forEach(function (el) {
        el.hidden = !variant.save;
        var val = el.querySelector('[data-save-value]');
        if (val) val.textContent = variant.save;
      });

      if (variant.media) {
        var gallery = document.querySelector('[data-gallery="' + sectionId + '"]');
        if (gallery && gallery.showMedia) gallery.showMedia(variant.media);
      }
      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }
    }

    document.querySelectorAll('[data-variant-select][data-section="' + sectionId + '"]').forEach(function (sel) {
      sel.addEventListener('change', function () { apply(sel.value); });
    });
    document.querySelectorAll('[data-variant-radio][data-section="' + sectionId + '"]').forEach(function (radio) {
      radio.addEventListener('change', function () { if (radio.checked) apply(radio.value); });
    });
  }
  document.querySelectorAll('[data-gallery]').forEach(function (g) { initVariants(g.dataset.gallery); });

  /* Gallery: fullscreen */
  document.querySelectorAll('[data-gallery-expand]').forEach(function (btn) {
    var galleryEl = btn.closest('[data-gallery]');
    var target = galleryEl && galleryEl.querySelector('.gallery__main');
    if (!target || !target.requestFullscreen) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else target.requestFullscreen();
    });
  });

  /* Sticky add-to-cart bar: shown once the main buy button scrolled out of view */
  document.querySelectorAll('[data-sticky-atc]').forEach(function (bar) {
    var buy = document.querySelector('[data-buy]');
    if (!buy || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      bar.hidden = e.isIntersecting || e.boundingClientRect.top > 0;
      document.body.classList.toggle('has-sticky-atc', !bar.hidden);
    }).observe(buy);
  });

  /* Collection sorting */
  document.querySelectorAll('[data-sort-select]').forEach(function (select) {
    select.addEventListener('change', function () {
      var url = new URL(window.location.href);
      url.searchParams.set('sort_by', select.value);
      url.searchParams.delete('page');
      window.location.href = url.toString();
    });
  });

  /* Cart: submit when a quantity changes */
  document.querySelectorAll('[data-cart-form]').forEach(function (form) {
    var timer;
    form.addEventListener('change', function (e) {
      if (!e.target.matches('[data-cart-qty]')) return;
      clearTimeout(timer);
      timer = setTimeout(function () { form.submit(); }, 400);
    });
  });

  /* Confirm before destructive actions (address delete) */
  document.querySelectorAll('[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm(form.dataset.confirm)) e.preventDefault();
    });
  });

  /* Customer address forms: country / province selectors + toggles */
  function initAddressSelectors() {
    if (!window.Shopify || !window.Shopify.CountryProvinceSelector) return;
    document.querySelectorAll('[data-address-country]').forEach(function (select) {
      var id = select.id;
      var provinceId = select.dataset.provinceId;
      var containerId = select.dataset.provinceContainer;
      if (!id || !provinceId) return;
      new window.Shopify.CountryProvinceSelector(id, provinceId, { hideElement: containerId });
    });
  }
  document.querySelectorAll('[data-toggle-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.dataset.toggleTarget);
      if (target) target.hidden = !target.hidden;
    });
  });
  if (document.readyState === 'complete') initAddressSelectors();
  else window.addEventListener('load', initAddressSelectors);
})();
