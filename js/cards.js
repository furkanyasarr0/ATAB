// ATAB - Cards & Sites Management Module

const CardsManager = {
  cards: [],
  settings: null,
  draggedSiteInfo: null, // { cardId, siteId, siteIndex }
  draggedCardIndex: null,

  async init(settings, cards) {
    this.settings = settings;
    this.cards = cards || [];
    this.render();
    this.setupEventListeners();
  },

  getDomainFromUrl(url) {
    try {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      const parsed = new URL(cleanUrl);
      return parsed.hostname;
    } catch (e) {
      return url;
    }
  },

  getFaviconUrl(url) {
    const domain = this.getDomainFromUrl(url);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  },

  save() {
    return StorageManager.set('atab_cards', this.cards);
  },

  render() {
    const container = document.getElementById('cards-grid');
    if (!container) return;

    if (!this.cards || this.cards.length === 0) {
      container.innerHTML = `
        <div class="empty-cards-state">
          <div class="empty-icon">🗂️</div>
          <h3>Henüz kart eklenmemiş</h3>
          <p>Sık kullandığınız siteleri kategorilere ayırmak için yeni bir kart oluşturun.</p>
          <button class="btn btn-primary" id="btn-empty-add-card">+ Yeni Kart Ekle</button>
        </div>
      `;
      const btn = document.getElementById('btn-empty-add-card');
      if (btn) btn.onclick = () => this.showAddCardModal();
      return;
    }

    let html = '';

    this.cards.forEach((card, cardIndex) => {
      const sitesCount = card.sites ? card.sites.length : 0;

      html += `
        <div class="atab-card" data-card-id="${card.id}" data-card-index="${cardIndex}" draggable="true">
          <div class="card-header">
            <div class="card-title-wrap">
              <span class="card-drag-handle" title="Kartı Taşımak İçin Sürükle">⋮⋮</span>
              <h2 class="card-title" title="${this.escapeHtml(card.title)}">${this.escapeHtml(card.title)}</h2>
              <span class="card-site-count">${sitesCount}</span>
            </div>
            <div class="card-actions">
              <button class="card-action-btn btn-add-site" data-card-id="${card.id}" title="Site Ekle">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              </button>
              <button class="card-action-btn btn-edit-card" data-card-id="${card.id}" title="Kartı Düzenle">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="card-action-btn btn-delete-card" data-card-id="${card.id}" title="Kartı Sil">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>

          <div class="card-sites-list" data-card-id="${card.id}">
            ${sitesCount === 0 ? `
              <div class="card-empty-sites">
                <span>Bu kartta henüz site yok</span>
                <button class="btn btn-sm btn-ghost btn-add-site-empty" data-card-id="${card.id}">+ Site Ekle</button>
              </div>
            ` : (card.sites || []).map((site, siteIndex) => `
              <div class="site-item" data-site-id="${site.id}" data-card-id="${card.id}" data-site-index="${siteIndex}" draggable="true">
                <span class="site-drag-handle" title="Siteyi Sırala">⋮⋮</span>
                <a href="${this.escapeHtml(site.url)}" class="site-link" target="_self">
                  <div class="site-icon-box">
                    <img src="${site.icon || this.getFaviconUrl(site.url)}" 
                         alt="" 
                         class="site-icon" 
                         loading="lazy"
                         onerror="this.onerror=null; this.src='https://icons.duckduckgo.com/ip3/${this.getDomainFromUrl(site.url)}.ico'; this.onerror=function(){this.parentElement.innerHTML='<span class=\\'site-fallback-avatar\\'>${site.title.charAt(0).toUpperCase()}</span>'}">
                  </div>
                  <span class="site-title">${this.escapeHtml(site.title)}</span>
                </a>
                <div class="site-actions">
                  <button class="site-action-btn btn-edit-site" data-card-id="${card.id}" data-site-id="${site.id}" title="Düzenle">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="site-action-btn btn-delete-site" data-card-id="${card.id}" data-site-id="${site.id}" title="Sil">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="card-footer">
            <button class="btn-open-all ${sitesCount === 0 ? 'disabled' : ''}" data-card-id="${card.id}" ${sitesCount === 0 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>
              <span>Hepsini Aç</span>
              <span class="open-all-badge">${sitesCount}</span>
            </button>
          </div>
        </div>
      `;
    });

    // Append Add Card Card
    html += `
      <div class="atab-card add-card-placeholder" id="btn-add-new-card">
        <div class="add-card-inner">
          <div class="add-card-icon">+</div>
          <div class="add-card-label">Yeni Kart Ekle</div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.setupCardDragEvents();
    this.setupSiteDragEvents();
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Open All Links in a Card
  openAllSitesInCard(cardId) {
    const card = this.cards.find(c => c.id === cardId);
    if (!card || !card.sites || card.sites.length === 0) return;

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      card.sites.forEach(site => {
        let url = site.url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        chrome.tabs.create({ url, active: false });
      });
    } else {
      card.sites.forEach(site => {
        let url = site.url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        window.open(url, '_blank');
      });
    }

    App.showToast(`"${card.title}" kartındaki ${card.sites.length} site açıldı.`);
  },

  // Add Card Modal
  showAddCardModal(cardToEdit = null) {
    const modal = document.getElementById('card-modal');
    const titleInput = document.getElementById('modal-card-title');
    const modalHeader = document.getElementById('modal-card-header');
    const form = document.getElementById('card-form');

    if (!modal || !titleInput || !form) return;

    if (cardToEdit) {
      modalHeader.textContent = 'Kartı Düzenle';
      titleInput.value = cardToEdit.title;
      form.dataset.editCardId = cardToEdit.id;
    } else {
      modalHeader.textContent = 'Yeni Kart Ekle';
      titleInput.value = '';
      delete form.dataset.editCardId;
    }

    modal.classList.add('active');
    setTimeout(() => titleInput.focus(), 50);

    const closeBtn = document.getElementById('modal-card-close');
    const cancelBtn = document.getElementById('modal-card-cancel');

    const cleanup = () => {
      modal.classList.remove('active');
    };

    if (closeBtn) closeBtn.onclick = cleanup;
    if (cancelBtn) cancelBtn.onclick = cleanup;
    modal.onclick = (e) => {
      if (e.target === modal) cleanup();
    };

    form.onsubmit = (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      if (!title) return;

      if (form.dataset.editCardId) {
        // Edit existing card
        const card = this.cards.find(c => c.id === form.dataset.editCardId);
        if (card) card.title = title;
        App.showToast('Kart güncellendi.');
      } else {
        // Add new card
        const newCard = {
          id: 'card_' + Date.now(),
          title: title,
          sites: []
        };
        this.cards.push(newCard);
        App.showToast('Yeni kart oluşturuldu.');
      }

      this.save();
      this.render();
      cleanup();
    };
  },

  // Delete Card
  deleteCard(cardId) {
    const card = this.cards.find(c => c.id === cardId);
    if (!card) return;

    if (confirm(`"${card.title}" kartını ve içindeki tüm siteleri silmek istediğinizden emin misiniz?`)) {
      this.cards = this.cards.filter(c => c.id !== cardId);
      this.save();
      this.render();
      App.showToast('Kart silindi.');
    }
  },

  // Add / Edit Site Modal
  showSiteModal(cardId, siteToEdit = null) {
    const modal = document.getElementById('site-modal');
    const nameInput = document.getElementById('modal-site-title');
    const urlInput = document.getElementById('modal-site-url');
    const modalHeader = document.getElementById('modal-site-header');
    const iconPreview = document.getElementById('modal-site-icon-preview');
    const form = document.getElementById('site-form');

    if (!modal || !nameInput || !urlInput || !form) return;

    const updatePreview = () => {
      let rawUrl = urlInput.value.trim();
      if (rawUrl) {
        if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
          rawUrl = 'https://' + rawUrl;
        }
        try {
          const domain = new URL(rawUrl).hostname;
          iconPreview.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
          iconPreview.style.display = 'block';
        } catch (e) {
          iconPreview.style.display = 'none';
        }
      } else {
        iconPreview.style.display = 'none';
      }
    };

    urlInput.oninput = () => {
      updatePreview();
      // Auto-suggest name if empty
      if (!nameInput.value.trim()) {
        try {
          let u = urlInput.value.trim();
          if (!u.startsWith('http')) u = 'https://' + u;
          let host = new URL(u).hostname.replace('www.', '').split('.')[0];
          if (host) {
            nameInput.value = host.charAt(0).toUpperCase() + host.slice(1);
          }
        } catch (e) {}
      }
    };

    if (siteToEdit) {
      modalHeader.textContent = 'Siteyi Düzenle';
      nameInput.value = siteToEdit.title;
      urlInput.value = siteToEdit.url;
      form.dataset.editCardId = cardId;
      form.dataset.editSiteId = siteToEdit.id;
      updatePreview();
    } else {
      modalHeader.textContent = 'Yeni Site Ekle';
      nameInput.value = '';
      urlInput.value = '';
      form.dataset.targetCardId = cardId;
      delete form.dataset.editSiteId;
      if (iconPreview) iconPreview.style.display = 'none';
    }

    modal.classList.add('active');
    setTimeout(() => (urlInput.value ? nameInput.focus() : urlInput.focus()), 50);

    const closeBtn = document.getElementById('modal-site-close');
    const cancelBtn = document.getElementById('modal-site-cancel');

    const cleanup = () => {
      modal.classList.remove('active');
    };

    if (closeBtn) closeBtn.onclick = cleanup;
    if (cancelBtn) cancelBtn.onclick = cleanup;
    modal.onclick = (e) => {
      if (e.target === modal) cleanup();
    };

    form.onsubmit = (e) => {
      e.preventDefault();
      let title = nameInput.value.trim();
      let rawUrl = urlInput.value.trim();

      if (!rawUrl) return;
      if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'https://' + rawUrl;
      }
      if (!title) {
        title = this.getDomainFromUrl(rawUrl);
      }

      const domain = this.getDomainFromUrl(rawUrl);
      const icon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      if (form.dataset.editSiteId) {
        // Editing site
        const card = this.cards.find(c => c.id === form.dataset.editCardId);
        if (card && card.sites) {
          const site = card.sites.find(s => s.id === form.dataset.editSiteId);
          if (site) {
            site.title = title;
            site.url = rawUrl;
            site.icon = icon;
          }
        }
        App.showToast('Site güncellendi.');
      } else {
        // Adding new site
        const card = this.cards.find(c => c.id === form.dataset.targetCardId);
        if (card) {
          if (!card.sites) card.sites = [];
          card.sites.push({
            id: 'site_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            title: title,
            url: rawUrl,
            icon: icon
          });
          App.showToast('Site eklendi.');
        }
      }

      this.save();
      this.render();
      cleanup();
    };
  },

  // Delete Site from Card
  deleteSite(cardId, siteId) {
    const card = this.cards.find(c => c.id === cardId);
    if (!card || !card.sites) return;

    card.sites = card.sites.filter(s => s.id !== siteId);
    this.save();
    this.render();
    App.showToast('Site kaldırıldı.');
  },

  // Setup Click Events via Event Delegation
  setupEventListeners() {
    const container = document.getElementById('cards-grid');
    if (!container) return;

    container.addEventListener('click', (e) => {
      // 1. Open All Button
      const openAllBtn = e.target.closest('.btn-open-all');
      if (openAllBtn && !openAllBtn.classList.contains('disabled')) {
        const cardId = openAllBtn.getAttribute('data-card-id');
        if (cardId) this.openAllSitesInCard(cardId);
        return;
      }

      // 2. Add New Card Placeholder
      const addCardBtn = e.target.closest('#btn-add-new-card');
      if (addCardBtn) {
        this.showAddCardModal();
        return;
      }

      // 3. Add Site Button on Card
      const addSiteBtn = e.target.closest('.btn-add-site, .btn-add-site-empty');
      if (addSiteBtn) {
        const cardId = addSiteBtn.getAttribute('data-card-id');
        if (cardId) this.showSiteModal(cardId);
        return;
      }

      // 4. Edit Card Button
      const editCardBtn = e.target.closest('.btn-edit-card');
      if (editCardBtn) {
        const cardId = editCardBtn.getAttribute('data-card-id');
        const card = this.cards.find(c => c.id === cardId);
        if (card) this.showAddCardModal(card);
        return;
      }

      // 5. Delete Card Button
      const deleteCardBtn = e.target.closest('.btn-delete-card');
      if (deleteCardBtn) {
        const cardId = deleteCardBtn.getAttribute('data-card-id');
        if (cardId) this.deleteCard(cardId);
        return;
      }

      // 6. Edit Site Button
      const editSiteBtn = e.target.closest('.btn-edit-site');
      if (editSiteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const cardId = editSiteBtn.getAttribute('data-card-id');
        const siteId = editSiteBtn.getAttribute('data-site-id');
        const card = this.cards.find(c => c.id === cardId);
        if (card && card.sites) {
          const site = card.sites.find(s => s.id === siteId);
          if (site) this.showSiteModal(cardId, site);
        }
        return;
      }

      // 7. Delete Site Button
      const deleteSiteBtn = e.target.closest('.btn-delete-site');
      if (deleteSiteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const cardId = deleteSiteBtn.getAttribute('data-card-id');
        const siteId = deleteSiteBtn.getAttribute('data-site-id');
        if (cardId && siteId) this.deleteSite(cardId, siteId);
        return;
      }

      // 8. Site Link Click Navigation (Open in Same Tab)
      const siteLink = e.target.closest('.site-link');
      if (siteLink && !e.target.closest('.site-action-btn') && !e.target.closest('.site-drag-handle')) {
        const url = siteLink.getAttribute('href');
        if (url && url !== '#') {
          e.preventDefault();
          if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.update) {
            chrome.tabs.update({ url: url });
          } else {
            window.location.href = url;
          }
        }
        return;
      }
    });
  },

  // Card Drag & Drop Reordering
  setupCardDragEvents() {
    const cards = document.querySelectorAll('.atab-card:not(#btn-add-new-card)');
    cards.forEach(cardEl => {
      cardEl.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('site-item')) return; // Ignore if dragging site
        const index = parseInt(cardEl.getAttribute('data-card-index'), 10);
        this.draggedCardIndex = index;
        cardEl.classList.add('card-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `card:${index}`);
      });

      cardEl.addEventListener('dragend', () => {
        cardEl.classList.remove('card-dragging');
        this.draggedCardIndex = null;
        document.querySelectorAll('.atab-card').forEach(c => c.classList.remove('card-drag-over'));
      });

      cardEl.addEventListener('dragover', (e) => {
        if (this.draggedCardIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        cardEl.classList.add('card-drag-over');
      });

      cardEl.addEventListener('dragleave', () => {
        cardEl.classList.remove('card-drag-over');
      });

      cardEl.addEventListener('drop', (e) => {
        if (this.draggedCardIndex === null) return;
        e.preventDefault();
        cardEl.classList.remove('card-drag-over');
        const targetIndex = parseInt(cardEl.getAttribute('data-card-index'), 10);

        if (this.draggedCardIndex !== targetIndex && !isNaN(targetIndex)) {
          const [movedCard] = this.cards.splice(this.draggedCardIndex, 1);
          this.cards.splice(targetIndex, 0, movedCard);
          this.save();
          this.render();
          App.showToast('Kartlar yeniden sıralandı.');
        }
      });
    });
  },

  // Site Drag & Drop Reordering (Within and Across Cards)
  setupSiteDragEvents() {
    const siteElements = document.querySelectorAll('.site-item');
    siteElements.forEach(siteEl => {
      siteEl.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        const cardId = siteEl.getAttribute('data-card-id');
        const siteId = siteEl.getAttribute('data-site-id');
        const siteIndex = parseInt(siteEl.getAttribute('data-site-index'), 10);

        this.draggedSiteInfo = { cardId, siteId, siteIndex };
        siteEl.classList.add('site-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `site:${cardId}:${siteId}`);
      });

      siteEl.addEventListener('dragend', () => {
        siteEl.classList.remove('site-dragging');
        this.draggedSiteInfo = null;
        document.querySelectorAll('.site-item').forEach(s => s.classList.remove('site-drag-over'));
      });

      siteEl.addEventListener('dragover', (e) => {
        if (!this.draggedSiteInfo) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        siteEl.classList.add('site-drag-over');
      });

      siteEl.addEventListener('dragleave', () => {
        siteEl.classList.remove('site-drag-over');
      });

      siteEl.addEventListener('drop', (e) => {
        if (!this.draggedSiteInfo) return;
        e.preventDefault();
        e.stopPropagation();
        siteEl.classList.remove('site-drag-over');

        const targetCardId = siteEl.getAttribute('data-card-id');
        const targetSiteIndex = parseInt(siteEl.getAttribute('data-site-index'), 10);

        const sourceCard = this.cards.find(c => c.id === this.draggedSiteInfo.cardId);
        const targetCard = this.cards.find(c => c.id === targetCardId);

        if (!sourceCard || !targetCard) return;

        // Move site
        const [movedSite] = sourceCard.sites.splice(this.draggedSiteInfo.siteIndex, 1);
        targetCard.sites.splice(targetSiteIndex, 0, movedSite);

        this.save();
        this.render();
      });
    });
  }
};
