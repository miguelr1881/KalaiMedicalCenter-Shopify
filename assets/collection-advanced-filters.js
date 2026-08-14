document.addEventListener('DOMContentLoaded', () => {
  const filterGroups = document.querySelectorAll('[data-collection-custom-filter]');
  if (!filterGroups.length) return;

  const productItems = Array.from(document.querySelectorAll('.product-grid__item'));
  if (!productItems.length) return;

  const normalize = (value) => {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9áéíóúñü\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const extractCategoryValues = (tags) => {
    const values = [];
    for (const tag of tags) {
      const normalizedTag = normalize(tag);
      if (!normalizedTag) continue;
      if (normalizedTag.startsWith('categoria:')) {
        values.push(normalizedTag.replace(/^categoria:/, '').trim());
      } else if (normalizedTag.startsWith('category:')) {
        values.push(normalizedTag.replace(/^category:/, '').trim());
      }
    }
    return [...new Set(values.filter(Boolean))];
  };

  const extractBrandValues = (tags, vendor) => {
    const values = [];
    for (const tag of tags) {
      const normalizedTag = normalize(tag);
      if (!normalizedTag) continue;
      if (normalizedTag.startsWith('marca:')) {
        values.push(normalizedTag.replace(/^marca:/, '').trim());
      } else if (normalizedTag.startsWith('brand:')) {
        values.push(normalizedTag.replace(/^brand:/, '').trim());
      }
    }
    if (vendor) values.push(normalize(vendor));
    return [...new Set(values.filter(Boolean))];
  };

  const matchesSelectedValues = (selectedValues, productValues) => {
    if (selectedValues.size === 0) return true;
    return [...selectedValues].some((selected) => {
      const normalizedSelected = normalize(selected);
      return productValues.some((value) => normalize(value) === normalizedSelected);
    });
  };

  const state = {
    category: new Set(),
    brand: new Set(),
  };

  const applyFilters = () => {
    let visibleCount = 0;

    productItems.forEach((item) => {
      const tags = String(item.dataset.productTags || '').split(',').map((tag) => tag.trim());
      const vendor = item.dataset.productBrand || '';
      const categoryValues = extractCategoryValues(tags);
      const brandValues = extractBrandValues(tags, vendor);

      const categoryMatch = matchesSelectedValues(state.category, categoryValues);
      const brandMatch = matchesSelectedValues(state.brand, brandValues);

      const shouldShow = categoryMatch && brandMatch;
      item.hidden = !shouldShow;
      if (shouldShow) visibleCount += 1;
    });

    const emptyState = document.querySelector('[data-collection-empty-state]');
    if (emptyState) emptyState.hidden = visibleCount !== 0;

    const clearButtons = document.querySelectorAll('[data-clear-collection-filters]');
    clearButtons.forEach((button) => {
      button.disabled = state.category.size === 0 && state.brand.size === 0;
    });
  };

  filterGroups.forEach((panel) => {
    const group = panel.dataset.collectionCustomFilter;
    const inputs = panel.querySelectorAll('input[type="checkbox"]');

    inputs.forEach((input) => {
      input.addEventListener('change', () => {
        const selected = input.value;
        const set = state[group];

        if (input.checked) {
          set.add(normalize(selected));
        } else {
          set.delete(normalize(selected));
        }

        applyFilters();
      });
    });

    const clearButton = panel.querySelector('[data-clear-collection-filters]');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        state[group].clear();
        inputs.forEach((input) => {
          input.checked = false;
        });
        applyFilters();
      });
    }
  });

  applyFilters();
});
