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

  /* Product galleries */
  document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
    var slides = gallery.querySelectorAll('[data-media-id]');
    var thumbs = gallery.querySelectorAll('[data-thumb-id]');
    gallery.showMedia = function (id) {
      var found = false;
      slides.forEach(function (s) {
        var match = s.dataset.mediaId === String(id);
        s.classList.toggle('is-active', match);
        if (match) found = true;
      });
      if (!found) return;
      thumbs.forEach(function (t) {
        var active = t.dataset.thumbId === String(id);
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-current', active ? 'true' : 'false');
      });
    };
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () { gallery.showMedia(t.dataset.thumbId); });
    });
  });

  /* Variant picker */
  document.querySelectorAll('[data-variant-select]').forEach(function (select) {
    var sectionId = select.dataset.section;
    var dataEl = document.getElementById('ProductVariants-' + sectionId);
    if (!dataEl) return;
    var variants;
    try { variants = JSON.parse(dataEl.textContent); } catch (err) { return; }

    select.addEventListener('change', function () {
      var variant = variants.find(function (v) { return String(v.id) === select.value; });
      if (!variant) return;

      document.querySelectorAll('[data-variant-id="' + sectionId + '"]').forEach(function (input) {
        input.value = variant.id;
      });

      var priceEl = document.getElementById('Price-' + sectionId);
      if (priceEl) {
        var html = '';
        if (variant.compare) {
          html += '<span class="price__current">' + variant.price + '</span>';
          html += '<s class="price__compare">' + variant.compare + '</s>';
          priceEl.classList.add('price--sale');
        } else {
          html += '<span class="price__current">' + variant.price + '</span>';
          priceEl.classList.remove('price--sale');
        }
        priceEl.innerHTML = html;
      }

      var addBtn = document.getElementById('AddToCart-' + sectionId);
      if (addBtn) {
        addBtn.disabled = !variant.available;
        addBtn.textContent = variant.available ? addBtn.dataset.labelAdd : addBtn.dataset.labelSoldOut;
      }

      if (variant.media) {
        var gallery = document.querySelector('[data-gallery="' + sectionId + '"]');
        if (gallery && gallery.showMedia) gallery.showMedia(variant.media);
      }

      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }
    });
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
