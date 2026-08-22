// ATAB - Application Orchestrator & UI Controller

const App = {
  settings: null,
  searchEngines: null,
  cards: null,
  bookmarks: null,
  notes: null,

  async init() {
    try {
      // 1. Initialize Storage
      await StorageManager.init();

      // 2. Fetch all state in parallel
      [this.settings, this.searchEngines, this.cards, this.bookmarks, this.categories, this.notes] = await Promise.all([
        StorageManager.get('atab_settings'),
        StorageManager.get('atab_search_engines'),
        StorageManager.get('atab_cards'),
        StorageManager.get('atab_bookmarks'),
        StorageManager.get('atab_categories'),
        StorageManager.get('atab_notes')
      ]);

      // 3. Initialize Modules
      ThemeManager.init(this.settings);
      ClockManager.init(this.settings);
      SearchManager.init(this.settings, this.searchEngines);
      CardsManager.init(this.settings, this.cards);
      BookmarksManager.init(this.settings, this.bookmarks, this.categories);
      NotesManager.init(this.notes);
      SettingsManager.init(this.settings, this.searchEngines);
      if (typeof UpdateManager !== 'undefined') {
        UpdateManager.init();
      }

      // 4. Setup Global UI Events
      this.setupGlobalEvents();
      this.setupDrawerToggles();

      // Focus search bar smoothly if not opening a modal
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 150);
      }
    } catch (err) {
      console.error('ATAB initialization failed:', err);
    }
  },

  // Global Keyboard Shortcuts
  setupGlobalEvents() {
    document.addEventListener('keydown', (e) => {
      const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable;

      // 1. Focus Search Bar on '/' or 'Ctrl+K' / 'Cmd+K'
      if (!isInputActive && (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey)))) {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // 2. Close active modals / drawers on 'Escape'
      if (e.key === 'Escape') {
        this.closeAllModalsAndDrawers();
      }

      // 3. Open Shortcuts modal on '?'
      if (!isInputActive && e.key === '?') {
        e.preventDefault();
        this.toggleShortcutsModal();
      }
    });
  },

  // Drawers setup (Bookmarks & Notes)
  setupDrawerToggles() {
    const btnBookmarks = document.getElementById('btn-open-bookmarks');
    const btnNotes = document.getElementById('btn-open-notes');
    const bookmarksDrawer = document.getElementById('bookmarks-drawer');
    const notesDrawer = document.getElementById('notes-drawer');
    const bookmarksClose = document.getElementById('bookmarks-drawer-close');
    const notesClose = document.getElementById('notes-drawer-close');

    if (btnBookmarks && bookmarksDrawer) {
      btnBookmarks.addEventListener('click', () => {
        this.closeNotesDrawer();
        bookmarksDrawer.classList.toggle('active');
        if (bookmarksDrawer.classList.contains('active')) {
          BookmarksManager.render();
          const input = document.getElementById('bookmarks-search-input');
          if (input) setTimeout(() => input.focus(), 100);
        }
      });
    }

    if (btnNotes && notesDrawer) {
      btnNotes.addEventListener('click', () => {
        this.closeBookmarksDrawer();
        notesDrawer.classList.toggle('active');
        if (notesDrawer.classList.contains('active')) {
          NotesManager.render();
        }
      });
    }

    if (bookmarksClose && bookmarksDrawer) {
      bookmarksClose.addEventListener('click', () => this.closeBookmarksDrawer());
    }

    if (notesClose && notesDrawer) {
      notesClose.addEventListener('click', () => this.closeNotesDrawer());
    }

    // Close on overlay backdrop click
    document.querySelectorAll('.drawer-overlay').forEach(overlay => {
      overlay.addEventListener('click', () => {
        this.closeBookmarksDrawer();
        this.closeNotesDrawer();
      });
    });
  },

  closeBookmarksDrawer() {
    const drawer = document.getElementById('bookmarks-drawer');
    if (drawer) drawer.classList.remove('active');
  },

  closeNotesDrawer() {
    const drawer = document.getElementById('notes-drawer');
    if (drawer) drawer.classList.remove('active');
  },

  closeAllModalsAndDrawers() {
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    this.closeBookmarksDrawer();
    this.closeNotesDrawer();
    SearchManager.closeDropdown();
  },

  toggleShortcutsModal() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) {
      modal.classList.toggle('active');
      const closeBtn = document.getElementById('shortcuts-modal-close');
      if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
      modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('active');
      };
    }
  },

  // Toast Notification System
  showToast(message, type = 'info', duration = 2800) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, duration);
  }
};

// Bootstrap when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
