document.addEventListener('DOMContentLoaded', () => {
  const filterPanel = document.querySelector('[data-collection-filter-panel]');
  if (!filterPanel) return;

  const productItems = Array.from(document.querySelectorAll('.product-grid__item'));
  const emptyState = document.querySelector('[data-collection-empty-state]');
  const categoryContainer = filterPanel.querySelector('[data-filter-group="category"]');
  const brandContainer = filterPanel.querySelector('[data-filter-group="brand"]');

  if (!categoryContainer || !brandContainer || productItems.length === 0) return;

  const categoryOptions = parseOptions(filterPanel.dataset.categoryOptions || '');
  const brandOptions = parseOptions(filterPanel.dataset.brandOptions || '');

  const state = {
    category: new Set(),
    brand: new Set(),
  };

  function parseOptions(rawString) {
    return [...new Set(
      String(rawString)
        .split('|')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => value.replace(/^\s*[-–—]\s*/, ''))
    )].sort((a, b) => a.localeCompare(b));
  }

  function normalizeValue(value) {
    return String(value || '').trim();
  }

  function parseTags(rawTags) {
    return String(rawTags || '')
      .split(',')
      .map((tag) => normalizeValue(tag))
      .filter(Boolean);
  }

  function resolveCategoryValues(tags) {
    const values = [];

    for (const tag of tags) {
      const cleanTag = normalizeValue(tag);
      const lowerTag = cleanTag.toLowerCase();
      if (lowerTag.startsWith('categoria:')) {
        values.push(cleanTag.slice('categoria:'.length).trim());
      } else if (lowerTag.startsWith('category:')) {
        values.push(cleanTag.slice('category:'.length).trim());
      } else if (lowerTag && !lowerTag.startsWith('marca:') && !lowerTag.startsWith('brand:')) {
        values.push(cleanTag);
      }
    }

    return [...new Set(values.filter(Boolean))];
  }

  function resolveBrandValues(tags, vendor) {
    const values = [];

    for (const tag of tags) {
      const cleanTag = normalizeValue(tag);
      const lowerTag = cleanTag.toLowerCase();
      if (lowerTag.startsWith('marca:')) {
        values.push(cleanTag.slice('marca:'.length).trim());
      } else if (lowerTag.startsWith('brand:')) {
        values.push(cleanTag.slice('brand:'.length).trim());
      }
    }

    if (vendor) values.push(normalizeValue(vendor));
    return [...new Set(values.filter(Boolean))];
  }

  function createCheckbox(group, value, name) {
    const label = document.createElement('label');
    label.className = 'collection-advanced-filters__item';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = name;
    input.value = value;
    input.setAttribute('data-filter-group', group);

    input.addEventListener('change', (event) => {
      const checkbox = event.currentTarget;
      const selectedValue = checkbox.value;
      const currentSet = state[group];

      if (checkbox.checked) {
        currentSet.add(selectedValue);
      } else {
        currentSet.delete(selectedValue);
      }

      applyFilters();
    });

    const span = document.createElement('span');
    span.textContent = value;

    label.appendChild(input);
    label.appendChild(span);
    return label;
  }

  function buildFilterOptions(container, options, groupName) {
    if (!options.length) {
      container.innerHTML = '<p class="collection-advanced-filters__empty">Sin opciones disponibles</p>';
      return;
    }

    const fragment = document.createDocumentFragment();

    options.forEach((value) => {
      fragment.appendChild(createCheckbox(groupName, value, groupName));
    });

    container.appendChild(fragment);
  }

  function matchesFilter(item) {
    const tags = parseTags(item.dataset.productTags || '');
    const vendor = normalizeValue(item.dataset.productBrand || '');

    const categories = resolveCategoryValues(tags);
    const brands = resolveBrandValues(tags, vendor);

    const categoryMatch =
      state.category.size === 0 ||
      [...state.category].some((selected) => categories.includes(selected));

    const brandMatch =
      state.brand.size === 0 ||
      [...state.brand].some((selected) => brands.includes(selected));

    return categoryMatch && brandMatch;
  }

  function applyFilters() {
    let visibleCount = 0;

    productItems.forEach((item) => {
      const shouldShow = matchesFilter(item);
      item.hidden = !shouldShow;
      if (shouldShow) visibleCount += 1;
    });

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }

    const clearButton = filterPanel.querySelector('[data-clear-filters]');
    if (clearButton) {
      clearButton.disabled = state.category.size === 0 && state.brand.size === 0;
    }
  }

  function clearFilters() {
    state.category.clear();
    state.brand.clear();

    filterPanel.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = false;
    });

    applyFilters();
  }

  buildFilterOptions(categoryContainer, categoryOptions, 'category');
  buildFilterOptions(brandContainer, brandOptions, 'brand');

  const clearButton = filterPanel.querySelector('[data-clear-filters]');
  if (clearButton) {
    clearButton.addEventListener('click', clearFilters);
  }

  applyFilters();
});
