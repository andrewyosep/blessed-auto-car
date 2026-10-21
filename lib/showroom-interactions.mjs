import { blankFilters, filterCars, activeFilterChips, parseFilterSearch, serializeFilters, filterArrayKeys } from './catalog-filters.mjs';
import { cardsMarkup, modelListMarkup, detailMarkup, imageMarkup, escapeHtml, icon } from './showroom-view.mjs';

export function mountShowroom(root, data) {
  const { cars, settings } = data;
  const $ = selector => root.querySelector(selector), $$ = selector => [...root.querySelectorAll(selector)];
  let filters = parseFilterSearch(location.search), draft = null, sort = 'newest', limit = 6, selected = null, photoIndex = 0, slide = 0, manuallyPaused = false, heroHovered = false, heroFocused = false, heroVisible = true, toastTimer, searchTimer, saved = [], lastDialogTrigger;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  try { const values = JSON.parse(localStorage.getItem('bac-favorites') || '[]'); if (Array.isArray(values)) saved = values.filter(id => typeof id === 'string' && cars.some(c => c.id === id)); } catch {}
  const cleanups = [], seenImages = new WeakSet();
  const on = (node, name, fn, options) => { node.addEventListener(name, fn, options); cleanups.push(() => node.removeEventListener(name, fn, options)); };
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => { for (const e of entries) if (e.isIntersecting) { e.target.classList.add('revealed'); revealObserver.unobserve(e.target); } }, { threshold: 0.06 }) : null;
  function reveal() { $$('.reveal:not(.revealed)').forEach(el => { if (reducedMotion.matches || !revealObserver) el.classList.add('revealed'); else revealObserver.observe(el); }); }
  const fallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="#ecebe7"/><g fill="none" stroke="#82847b" stroke-width="8" stroke-linejoin="round"><path d="m270 320 55-90h230l70 90 35 25v80H240v-80zM250 325h400M310 365h45m190 0h45M280 425v35m340-35v35"/></g><text x="450" y="520" font-family="Arial" text-anchor="middle" fill="#5b6059" font-size="22">Foto belum tersedia</text></svg>');
  function watchPhotos(scope = root) { scope.querySelectorAll('.photo-frame img').forEach(img => { if (seenImages.has(img)) return; seenImages.add(img); const done = () => img.closest('.photo-frame').classList.add('loaded'); const fail = () => { img.removeAttribute('srcset'); img.src = fallback; done(); }; img.addEventListener('load', done, { once: true }); img.addEventListener('error', fail, { once: true }); if (img.complete) { if (img.naturalWidth) done(); else fail(); } }); }
  root.classList.add('showroom-enhanced');
  function toast(message) { clearTimeout(toastTimer); $('[data-toast] span').textContent = message; $('[data-toast]').hidden = false; toastTimer = setTimeout(() => $('[data-toast]').hidden = true, 4500); }
  function syncSaved() { $$('[data-saved-count]').forEach(el => el.textContent = String(saved.length)); $$('[data-saved-view]').forEach(el => { el.setAttribute('aria-pressed', String(filters.savedOnly)); el.classList.toggle('active', filters.savedOnly); }); }
  function syncFilterUI(f, scope, refreshModels = false) {
    if (refreshModels) scope.querySelector('[data-model-list]').innerHTML = modelListMarkup(cars, f.brands);
    scope.querySelectorAll('[data-filter]').forEach(el => { const key = el.dataset.filter; if (el.type === 'checkbox') el.checked = f[key].includes(el.value); else el.value = f[key]; });
    scope.querySelectorAll('[data-price-slider]').forEach(el => el.value = f.priceMax ? Math.min(1000, Number(f.priceMax)) : 1000);
    scope.querySelectorAll('[data-price-label]').forEach(el => el.textContent = f.priceMax ? `Rp ${f.priceMax} juta` : 'Semua harga');
    scope.querySelectorAll('[data-price-min]').forEach(el => { const chosen = String(f.priceMin || '0') === el.dataset.priceMin && f.priceMax === el.dataset.priceMax; el.classList.toggle('active', chosen); el.setAttribute('aria-pressed', String(chosen)); });
    scope.querySelector('[data-price-error]').hidden = !(f.priceMin && f.priceMax && Number(f.priceMin) > Number(f.priceMax));
    scope.querySelector('[data-year-error]').hidden = !(f.yearMin && f.yearMax && Number(f.yearMin) > Number(f.yearMax));
  }
  function updateUrl() { const query = serializeFilters(filters); try { history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + location.hash); } catch {} }
  function renderResults({ refreshModels = false, url = true } = {}) {
    $$('[data-quick-brand]').forEach(el => { const active = filters.brands.includes(el.dataset.quickBrand); el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active)); });
    const found = filterCars(cars, filters, saved, sort), chips = activeFilterChips(filters);
    $('[data-car-grid]').querySelectorAll('.reveal').forEach(el => revealObserver?.unobserve(el));
    $('[data-car-grid]').innerHTML = cardsMarkup(found.slice(0, limit), saved);
    $('[data-results-count]').innerHTML = `<strong>${found.length}</strong> mobil ditemukan${filters.savedOnly ? ' dalam daftar disimpan' : ''}`;
    $('[data-empty]').hidden = found.length > 0; $('[data-load-more]').hidden = found.length <= limit;
    $('[data-showing]').textContent = `Menampilkan ${Math.min(limit, found.length)} dari ${found.length} mobil`;
    $('[data-active-filters]').hidden = !chips.length;
    $('[data-active-filters]').innerHTML = chips.map(c => `<button data-remove-filter="${c.key}" data-remove-value="${escapeHtml(c.value)}" aria-label="Hapus filter ${escapeHtml(c.label)}">${escapeHtml(c.label)}${icon('close', 13)}</button>`).join('') + (chips.length ? '<button class="clear-filters" data-reset>Hapus semua</button>' : '');
    $$('[data-status]').forEach(el => { const active = el.dataset.status === filters.status; el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active)); });
    $$('[data-filter-count]').forEach(el => { el.textContent = chips.length; el.hidden = !chips.length; });
    $('[data-query]').value = filters.q; syncFilterUI(filters, $('[data-filter-panel="desktop"]'), refreshModels);
    syncSaved(); watchPhotos(); reveal(); if (url) updateUrl();
  }
  function setFilter(panel, key, value, isCheckbox = false) {
    const f = panel.dataset.filterPanel === 'mobile' ? draft : filters; if (!f) return;
    if (isCheckbox) f[key] = f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value]; else f[key] = value;
    if (key === 'brands') f.models = f.models.filter(name => cars.some(c => c.name === name && (!f.brands.length || f.brands.includes(c.brand))));
    if (f === draft) { syncFilterUI(draft, panel, key === 'brands'); $('[data-apply-filters]').innerHTML = `Tampilkan ${filterCars(cars, draft, saved, sort).length} mobil ${icon('right', 17)}`; }
    else { limit = 6; renderResults({ refreshModels: key === 'brands' }); }
  }
  function resetAll() { filters = blankFilters(); limit = 6; $$('[data-brand-search]').forEach(el => { el.value = ''; el.closest('.filter-panel').querySelectorAll('.brand-options .filter-check').forEach(row => row.hidden = false); }); renderResults({ refreshModels: true }); }
  function openDialog(dialog) { lastDialogTrigger = document.activeElement; dialog.showModal(); document.body.style.overflow = 'hidden'; }
  function closeDialog(dialog) { dialog.close(); }
  $$('dialog').forEach(dialog => { on(dialog, 'close', () => { document.body.style.overflow = ''; lastDialogTrigger?.focus?.(); }); on(dialog, 'click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(dialog); } }); });
  function contact(car) {
    if (car?.demo) return toast('Ini unit ilustrasi. Hubungi showroom untuk menanyakan stok asli.');
    const digits = settings.whatsapp.replace(/\D/g, '').replace(/^0/, '62'); if (!/^62\d{8,13}$/.test(digits)) return toast('Kontak showroom sedang disiapkan.');
    const message = `Halo ${settings.name}, saya ingin bertanya ${car ? `tentang ${car.brand} ${car.name} ${car.year}.` : 'tentang mobil yang tersedia.'}`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }
  function showPhoto(index) { if (!selected) return; photoIndex = (index + selected.photos.length) % selected.photos.length; $('[data-detail-photo]').innerHTML = imageMarkup(selected.photos[photoIndex], `${selected.brand} ${selected.name}, foto ${photoIndex + 1}`); $('[data-gallery-count]').textContent = `${photoIndex + 1} / ${selected.photos.length}`; $$('[data-gallery-index]').forEach(el => { const active = Number(el.dataset.galleryIndex) === photoIndex; el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active)); }); watchPhotos($('[data-detail-dialog]')); }
  function goSlide(index) {
    slide = (index + settings.slides.length) % settings.slides.length; const s = settings.slides[slide];
    $('[data-hero-media]').innerHTML = imageMarkup(s.image, 'Ilustrasi mobil pilihan showroom', { hero: true }); $$('[data-hero-copy-slide]').forEach(el => { const active = Number(el.dataset.heroCopySlide) === slide; el.classList.toggle('active',active); el.setAttribute('aria-hidden',String(!active)); });
    $('[data-slide-count]').textContent = `${String(slide + 1).padStart(2, '0')} / ${String(settings.slides.length).padStart(2, '0')}`;
    $$('[data-slide]').forEach(el => { el.classList.toggle('active', Number(el.dataset.slide) === slide); el.setAttribute('aria-current', String(Number(el.dataset.slide) === slide)); }); watchPhotos($('[data-hero-media]'));
  }
  on(root, 'click', e => {
    const b = e.target.closest('button,a'); if (!b || !root.contains(b)) return;
    if (b.hasAttribute('data-reset')) { if (b.closest('[data-filter-panel="mobile"]')) { draft = blankFilters(); syncFilterUI(draft, $('[data-filter-panel="mobile"]'), true); $('[data-apply-filters]').innerHTML = `Tampilkan ${cars.length} mobil ${icon('right', 17)}`; } else resetAll(); }
    else if (b.hasAttribute('data-remove-filter')) { const key = b.dataset.removeFilter; if (filterArrayKeys.includes(key)) filters[key] = filters[key].filter(v => v !== b.dataset.removeValue); else filters[key] = key === 'savedOnly' ? false : ''; limit = 6; renderResults({ refreshModels: key === 'brands' }); }
    else if (b.hasAttribute('data-status')) { filters.status = b.dataset.status; filters.savedOnly = false; limit = 6; renderResults(); }
    else if (b.hasAttribute('data-saved-view')) { filters.savedOnly = !filters.savedOnly; limit = 6; renderResults(); $('#katalog').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' }); }
    else if (b.hasAttribute('data-save')) { const id = b.dataset.save; saved = saved.includes(id) ? saved.filter(v => v !== id) : [...saved, id]; try { localStorage.setItem('bac-favorites', JSON.stringify(saved)); } catch {} if (filters.savedOnly) renderResults(); else { b.classList.toggle('saved', saved.includes(id)); b.setAttribute('aria-pressed', String(saved.includes(id))); b.setAttribute('aria-label', `${saved.includes(id) ? 'Hapus dari disimpan' : 'Simpan mobil'} ${cars.find(c => c.id === id)?.name || ''}`); syncSaved(); } }
    else if (b.hasAttribute('data-detail')) { selected = cars.find(c => c.id === b.dataset.detail); if (selected) { $('[data-detail-dialog]').classList.remove('gallery-expanded'); photoIndex = 0; $('[data-detail-content]').innerHTML = detailMarkup(selected); openDialog($('[data-detail-dialog]')); watchPhotos($('[data-detail-dialog]')); } }
    else if (b.hasAttribute('data-close-detail')) closeDialog($('[data-detail-dialog]'));
    else if (b.hasAttribute('data-gallery-zoom')) { const expanded = $('[data-detail-dialog]').classList.toggle('gallery-expanded'); b.setAttribute('aria-pressed', String(expanded)); b.innerHTML = icon('photo',16) + (expanded ? ' Kecilkan' : ' Perbesar'); }
    else if (b.hasAttribute('data-gallery-step')) showPhoto(photoIndex + Number(b.dataset.galleryStep));
    else if (b.hasAttribute('data-gallery-index')) showPhoto(Number(b.dataset.galleryIndex));
    else if (b.hasAttribute('data-contact-car')) contact(cars.find(c => c.id === b.dataset.contactCar));
    else if (b.hasAttribute('data-contact')) contact();
    else if (b.hasAttribute('data-price-min')) { const panel = b.closest('[data-filter-panel]'), f = panel.dataset.filterPanel === 'mobile' ? draft : filters; f.priceMin = b.dataset.priceMin === '0' ? '' : b.dataset.priceMin; setFilter(panel, 'priceMax', b.dataset.priceMax); }
    else if (b.hasAttribute('data-quick-brand')) { filters.brands = [b.dataset.quickBrand]; filters.models = []; limit = 6; renderResults({ refreshModels: true }); $('#katalog').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' }); }
    else if (b.hasAttribute('data-load-more')) { limit += 6; renderResults(); }
    else if (b.hasAttribute('data-view')) { $('[data-car-grid]').classList.toggle('list-view', b.dataset.view === 'list'); $$('[data-view]').forEach(el => { el.classList.toggle('active', el === b); el.setAttribute('aria-pressed', String(el === b)); }); }
    else if (b.hasAttribute('data-open-filters')) { draft = JSON.parse(JSON.stringify(filters)); syncFilterUI(draft, $('[data-filter-panel="mobile"]'), true); $('[data-apply-filters]').innerHTML = `Tampilkan ${filterCars(cars, draft, saved, sort).length} mobil ${icon('right', 17)}`; openDialog($('[data-filter-drawer]')); }
    else if (b.hasAttribute('data-close-filters')) closeDialog($('[data-filter-drawer]'));
    else if (b.hasAttribute('data-reset-draft')) { draft = blankFilters(); syncFilterUI(draft, $('[data-filter-panel="mobile"]'), true); $('[data-apply-filters]').innerHTML = `Tampilkan ${cars.length} mobil ${icon('right', 17)}`; }
    else if (b.hasAttribute('data-apply-filters')) { filters = draft; draft = null; limit = 6; closeDialog($('[data-filter-drawer]')); renderResults({ refreshModels: true }); }
    else if (b.hasAttribute('data-slide-step')) goSlide(slide + Number(b.dataset.slideStep));
    else if (b.hasAttribute('data-slide')) goSlide(Number(b.dataset.slide));
    else if (b.hasAttribute('data-pause')) { manuallyPaused = !manuallyPaused; b.innerHTML = icon(manuallyPaused ? 'play' : 'pause', 16); b.setAttribute('aria-label', manuallyPaused ? 'Putar slideshow' : 'Jeda slideshow'); b.setAttribute('aria-pressed', String(manuallyPaused)); }
    else if (b.hasAttribute('data-menu')) { const open = $('.nav-links').classList.toggle('open'); b.setAttribute('aria-expanded', String(open)); }
    else if (b.matches('.nav-links a')) { $('.nav-links').classList.remove('open'); $('[data-menu]').setAttribute('aria-expanded', 'false'); }
    else if (b.hasAttribute('data-close-toast')) $('[data-toast]').hidden = true;
    else if (b.hasAttribute('data-admin-preview')) { e.preventDefault(); openDialog($('[data-admin-dialog]')); }
    else if (b.hasAttribute('data-close-admin')) closeDialog($('[data-admin-dialog]'));
  });
  on(root, 'keydown', e => { if ($('[data-detail-dialog]').open && e.target.closest('.detail-gallery') && ['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); showPhoto(photoIndex + (e.key === 'ArrowRight' ? 1 : -1)); } });
  let galleryStartX = null;
  on(root, 'pointerdown', e => { if (e.target.closest('[data-detail-photo]')) galleryStartX = e.clientX; });
  on(root, 'pointerup', e => { if (galleryStartX !== null && e.target.closest('[data-detail-photo]')) { const delta=e.clientX-galleryStartX; if (Math.abs(delta)>50) showPhoto(photoIndex+(delta<0?1:-1)); } galleryStartX=null; });
  on(root, 'pointercancel', () => galleryStartX=null);
  on(root, 'change', e => { const el = e.target; if (el.matches('[data-filter]')) { const value = el.type === 'number' ? el.value.replace(/\D/g, '').slice(0, 9) : el.value; setFilter(el.closest('[data-filter-panel]'), el.dataset.filter, value, el.type === 'checkbox'); } else if (el.matches('[data-sort]')) { sort = el.value; renderResults(); } });
  on(root, 'input', e => { const el = e.target; if (el.matches('[data-brand-search]')) { const q = el.value.toLowerCase(); el.closest('.filter-panel').querySelectorAll('.brand-options .filter-check').forEach(row => row.hidden = !row.textContent.toLowerCase().includes(q)); } else if (el.matches('[data-price-slider]')) setFilter(el.closest('[data-filter-panel]'), 'priceMax', el.value); else if (el.matches('[data-query]')) { clearTimeout(searchTimer); filters.q = el.value; searchTimer = setTimeout(() => { limit = 6; renderResults(); }, 180); } });
  on($('.catalog-search'), 'submit', e => { e.preventDefault(); clearTimeout(searchTimer); filters.q = $('[data-query]').value; limit = 6; renderResults(); });
  on(window, 'popstate', () => { filters = parseFilterSearch(location.search); limit = 6; renderResults({ refreshModels: true, url: false }); });
  on($('.hero'), 'mouseenter', () => heroHovered = true); on($('.hero'), 'mouseleave', () => heroHovered = false); on($('.hero'), 'focusin', () => heroFocused = true); on($('.hero'), 'focusout', e => { if (!$('.hero').contains(e.relatedTarget)) heroFocused = false; });
  const heroObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => heroVisible = entries[0].isIntersecting) : null; heroObserver?.observe($('.hero'));
  const slideTimer = setInterval(() => { if (!manuallyPaused && !heroHovered && !heroFocused && heroVisible && !document.hidden && !reducedMotion.matches) goSlide(slide + 1); }, 6500);
  on(reducedMotion, 'change', () => { if (reducedMotion.matches) $$('.reveal').forEach(el => el.classList.add('revealed')); });
  renderResults({ refreshModels: true, url: false });
  return () => { clearTimeout(toastTimer); clearTimeout(searchTimer); clearInterval(slideTimer); revealObserver?.disconnect(); heroObserver?.disconnect(); cleanups.forEach(fn => fn()); root.classList.remove('showroom-enhanced'); if ($$('dialog[open]').length) document.body.style.overflow = ''; };
}
