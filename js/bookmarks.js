// ATAB - Bookmarks Management Module with Category & Tag System

const BookmarksManager = {
  bookmarks: [],
  categories: ['Genel', 'Geliştirme', 'Tasarım', 'Sosyal', 'Haberler', 'Araçlar'],
  settings: null,
  activeCategory: 'all',

  async init(settings, bookmarks, categories) {
    this.settings = settings;
    this.bookmarks = (bookmarks || []).map(b => ({
      ...b,
      category: b.category || 'Genel',
      tags: b.tags || []
    }));

    if (categories && Array.isArray(categories) && categories.length > 0) {
      this.categories = categories;
    }

    this.render();
    this.setupEventListeners();
    this.listenForBackgroundUpdates();
  },

  save() {
    StorageManager.set('atab_bookmarks', this.bookmarks);
    StorageManager.set('atab_categories', this.categories);
  },

  // Listen for bookmarks added via Alt+B / context menu while newtab is open
  listenForBackgroundUpdates() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.atab_bookmarks) {
          this.bookmarks = (changes.atab_bookmarks.newValue || []).map(b => ({
            ...b,
            category: b.category || 'Genel',
            tags: b.tags || []
          }));
          this.render();
        }
      });
    }
  },

  // Add new category
  addCategory(name) {
    if (!name || !name.trim()) return;
    const clean = name.trim();
    if (!this.categories.includes(clean)) {
      this.categories.push(clean);
      this.save();
      this.render();
      App.showToast(`"${clean}" kategorisi oluşturuldu.`);
    }
  },

  // Change bookmark category
  setBookmarkCategory(bmId, newCategory) {
    const bm = this.bookmarks.find(b => b.id === bmId);
    if (bm) {
      bm.category = newCategory;
      this.save();
      this.render();
      App.showToast(`Yer imi "${newCategory}" kategorisine taşındı.`);
    }
  },

  render(searchFilter = '') {
    this.renderCategoryTabs();
    this.renderBookmarksList(searchFilter);
  },

  renderCategoryTabs() {
    const pillsContainer = document.getElementById('bookmarks-category-pills');
    if (!pillsContainer) return;

    // Calculate count per category
    const counts = { all: this.bookmarks.length };
    this.categories.forEach(c => { counts[c] = 0; });
    this.bookmarks.forEach(b => {
      const cat = b.category || 'Genel';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    let html = `
      <button class="cat-pill ${this.activeCategory === 'all' ? 'active' : ''}" data-cat="all">
        Tümü (${counts.all || 0})
      </button>
    `;

    this.categories.forEach(cat => {
      const count = counts[cat] || 0;
      const isAct = this.activeCategory === cat;
      html += `
        <button class="cat-pill ${isAct ? 'active' : ''}" data-cat="${this.escapeHtml(cat)}">
          🏷️ ${this.escapeHtml(cat)} (${count})
        </button>
      `;
    });

    // Add Category Button
    html += `
      <button class="cat-pill cat-pill-add" id="btn-add-bm-category" title="Yeni Kategori Oluştur">
        + Kategori
      </button>
    `;

    pillsContainer.innerHTML = html;
  },

  renderBookmarksList(filter = '') {
    const listEl = document.getElementById('bookmarks-list');
    const countBadge = document.getElementById('bookmarks-count-badge');
    const headerCount = document.getElementById('bookmarks-header-count');

    if (countBadge) {
      countBadge.textContent = this.bookmarks.length;
      countBadge.style.display = this.bookmarks.length > 0 ? 'inline-flex' : 'none';
    }

    if (headerCount) {
      headerCount.textContent = `(${this.bookmarks.length})`;
    }

    if (!listEl) return;

    let filtered = this.bookmarks;

    // Filter by Category
    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(b => (b.category || 'Genel') === this.activeCategory);
    }

    // Filter by Search Query
    if (filter.trim() !== '') {
      const q = filter.toLowerCase();
      filtered = filtered.filter(b => 
        (b.title && b.title.toLowerCase().includes(q)) || 
        (b.url && b.url.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="bookmarks-empty-state">
          <div class="empty-icon">🔖</div>
          <h4>Bu kategoride yer imi bulunamadı</h4>
          <p>Herhangi bir web sayfasındayken <strong>Alt + B</strong> tuşlarına basarak buraya kaydedebilirsiniz.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(bm => {
      const date = new Date(bm.createdAt || Date.now());
      const dateStr = `${date.getDate()} ${['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][date.getMonth()]}`;
      const currentCat = bm.category || 'Genel';

      return `
        <div class="bookmark-item" data-bm-id="${bm.id}">
          <div class="bookmark-icon-box">
            <img src="${bm.icon || `https://www.google.com/s2/favicons?domain=${this.getHostname(bm.url)}&sz=128`}" 
                 alt="" 
                 class="bookmark-icon"
                 onerror="this.src='https://icons.duckduckgo.com/ip3/${this.getHostname(bm.url)}.ico'">
          </div>
          <div class="bookmark-info">
            <a href="${this.escapeHtml(bm.url)}" class="bookmark-title site-link" target="_self" title="${this.escapeHtml(bm.title)}">
              ${this.escapeHtml(bm.title || bm.url)}
            </a>
            <div class="bookmark-meta">
              <span class="bookmark-domain">${this.getHostname(bm.url)}</span>
              
              <!-- Category Selector Dropdown Trigger -->
              <div class="bm-category-wrapper">
                <select class="bm-category-select" data-bm-id="${bm.id}" title="Kategoriyi Değiştir">
                  ${this.categories.map(cat => `
                    <option value="${this.escapeHtml(cat)}" ${cat === currentCat ? 'selected' : ''}>
                      🏷️ ${this.escapeHtml(cat)}
                    </option>
                  `).join('')}
                </select>
              </div>

              <span class="bookmark-date">${dateStr}</span>
            </div>
          </div>
          <div class="bookmark-actions">
            <button class="bm-btn btn-add-to-card" data-bm-id="${bm.id}" title="Bir Karta Ekle">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              <span>Karta Ekle</span>
            </button>
            <button class="bm-btn btn-delete-bm" data-bm-id="${bm.id}" title="Sil">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  getHostname(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Open all filtered bookmarks
  openAll() {
    let toOpen = this.bookmarks;
    if (this.activeCategory !== 'all') {
      toOpen = toOpen.filter(b => (b.category || 'Genel') === this.activeCategory);
    }

    if (!toOpen || toOpen.length === 0) return;

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      toOpen.forEach(bm => {
        chrome.tabs.create({ url: bm.url, active: false });
      });
    } else {
      toOpen.forEach(bm => {
        window.open(bm.url, '_blank');
      });
    }

    App.showToast(`${toOpen.length} yer imi açıldı.`);
  },

  // Delete bookmark
  deleteBookmark(id) {
    this.bookmarks = this.bookmarks.filter(b => b.id !== id);
    this.save();
    this.render();
    App.showToast('Yer imi silindi.');
  },

  // Add bookmark to a card
  showAddToCardModal(bookmarkId) {
    const bm = this.bookmarks.find(b => b.id === bookmarkId);
    if (!bm) return;

    const cards = CardsManager.cards;
    if (!cards || cards.length === 0) {
      alert('Önce bir kart oluşturmalısınız.');
      return;
    }

    const modal = document.getElementById('add-to-card-modal');
    const select = document.getElementById('select-target-card');
    const previewName = document.getElementById('add-to-card-item-name');
    const submitBtn = document.getElementById('btn-confirm-add-to-card');
    const closeBtn = document.getElementById('add-to-card-close');
    const cancelBtn = document.getElementById('add-to-card-cancel');

    if (!modal || !select || !submitBtn) return;

    previewName.textContent = bm.title;
    select.innerHTML = cards.map(c => `
      <option value="${c.id}">${this.escapeHtml(c.title)} (${c.sites ? c.sites.length : 0} site)</option>
    `).join('');

    modal.classList.add('active');

    const cleanup = () => {
      modal.classList.remove('active');
    };

    if (closeBtn) closeBtn.onclick = cleanup;
    if (cancelBtn) cancelBtn.onclick = cleanup;
    modal.onclick = (e) => {
      if (e.target === modal) cleanup();
    };

    submitBtn.onclick = () => {
      const selectedId = select.value;
      const targetCard = cards.find(c => c.id === selectedId);
      if (targetCard) {
        if (!targetCard.sites) targetCard.sites = [];
        targetCard.sites.push({
          id: 'site_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          title: bm.title,
          url: bm.url,
          icon: bm.icon || `https://www.google.com/s2/favicons?domain=${this.getHostname(bm.url)}&sz=128`
        });
        CardsManager.save();
        CardsManager.render();
        App.showToast(`"${bm.title}" ${targetCard.title} kartına eklendi.`);
      }
      cleanup();
    };
  },

  setupEventListeners() {
    const listEl = document.getElementById('bookmarks-list');
    const searchInput = document.getElementById('bookmarks-search-input');
    const openAllBtn = document.getElementById('btn-open-all-bookmarks');
    const clearAllBtn = document.getElementById('btn-clear-all-bookmarks');
    const categoryBar = document.getElementById('bookmarks-category-pills');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.renderBookmarksList(searchInput.value);
      });
    }

    if (openAllBtn) {
      openAllBtn.addEventListener('click', () => this.openAll());
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (this.bookmarks.length === 0) return;
        if (confirm('Tüm kayıtlı yer imlerini temizlemek istediğinizden emin misiniz?')) {
          this.bookmarks = [];
          this.save();
          this.render();
          App.showToast('Yer imleri temizlendi.');
        }
      });
    }

    // Category Tabs click
    if (categoryBar) {
      categoryBar.addEventListener('click', (e) => {
        // Add Category Button
        if (e.target.closest('#btn-add-bm-category')) {
          const newCat = prompt('Yeni kategori adını girin:');
          if (newCat) this.addCategory(newCat);
          return;
        }

        const pill = e.target.closest('.cat-pill');
        if (pill) {
          this.activeCategory = pill.getAttribute('data-cat') || 'all';
          this.render();
        }
      });
    }

    if (listEl) {
      // Category change dropdown
      listEl.addEventListener('change', (e) => {
        if (e.target.classList.contains('bm-category-select')) {
          const bmId = e.target.getAttribute('data-bm-id');
          const newCat = e.target.value;
          if (bmId && newCat) {
            this.setBookmarkCategory(bmId, newCat);
          }
        }
      });

      // Delete or Add to card clicks
      listEl.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete-bm');
        if (deleteBtn) {
          const bmId = deleteBtn.getAttribute('data-bm-id');
          if (bmId) this.deleteBookmark(bmId);
          return;
        }

        const addToCardBtn = e.target.closest('.btn-add-to-card');
        if (addToCardBtn) {
          const bmId = addToCardBtn.getAttribute('data-bm-id');
          if (bmId) this.showAddToCardModal(bmId);
          return;
        }

        // Bookmark link click (open in same tab)
        const siteLink = e.target.closest('.bookmark-title');
        if (siteLink) {
          const url = siteLink.getAttribute('href');
          if (url) {
            e.preventDefault();
            if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.update) {
              chrome.tabs.update({ url: url });
            } else {
              window.location.href = url;
            }
          }
        }
      });
    }
  }
};
