// ATAB - Storage Manager (Dual-Layer Persistent Storage)

const StorageManager = {
  // Default values
  DEFAULTS: {
    atab_settings: {
      userName: '',
      clockFormat24: true,
      showSeconds: false,
      showDate: true,
      openLinksInNewTab: false,
      searchEngine: 'yandex',
      theme: 'dark',
      customTheme: {
        bgType: 'color', // 'color', 'gradient', 'image'
        bgColor: '#0f172a',
        bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%)',
        bgImage: '',
        cardBg: 'rgba(30, 41, 59, 0.7)',
        cardBlur: 16,
        cardOpacity: 85,
        accentColor: '#ef4444',
        textColor: '#f8fafc',
        textSecondary: '#94a3b8',
        borderRadius: 16,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        layoutColumns: 'auto'
      }
    },

    atab_search_engines: [
      { id: 'yandex', name: 'Yandex', searchUrl: 'https://yandex.com.tr/search/?text=%s', icon: 'yandex', isCustom: false },
      { id: 'google', name: 'Google', searchUrl: 'https://www.google.com/search?q=%s', icon: 'google', isCustom: false },
      { id: 'duckduckgo', name: 'DuckDuckGo', searchUrl: 'https://duckduckgo.com/?q=%s', icon: 'duckduckgo', isCustom: false },
      { id: 'bing', name: 'Bing', searchUrl: 'https://www.bing.com/search?q=%s', icon: 'bing', isCustom: false },
      { id: 'brave', name: 'Brave', searchUrl: 'https://search.brave.com/search?q=%s', icon: 'brave', isCustom: false },
      { id: 'youtube', name: 'YouTube', searchUrl: 'https://www.youtube.com/results?search_query=%s', icon: 'youtube', isCustom: false },
      { id: 'github', name: 'GitHub', searchUrl: 'https://github.com/search?q=%s', icon: 'github', isCustom: false },
      { id: 'wikipedia', name: 'Vikipedi', searchUrl: 'https://tr.wikipedia.org/w/index.php?search=%s', icon: 'wikipedia', isCustom: false },
      { id: 'reddit', name: 'Reddit', searchUrl: 'https://www.reddit.com/search/?q=%s', icon: 'reddit', isCustom: false }
    ],

    atab_cards: [
      {
        id: 'card_default',
        title: 'Sık Kullanılanlar',
        sites: [
          { id: 's_yt', title: 'YouTube', url: 'https://www.youtube.com', icon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=128' },
          { id: 's_ig', title: 'Instagram', url: 'https://www.instagram.com', icon: 'https://www.google.com/s2/favicons?domain=instagram.com&sz=128' },
          { id: 's_x', title: 'X (Twitter)', url: 'https://x.com', icon: 'https://www.google.com/s2/favicons?domain=x.com&sz=128' },
          { id: 's_rd', title: 'Reddit', url: 'https://www.reddit.com', icon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=128' }
        ]
      }
    ],

    atab_bookmarks: [],

    atab_categories: ['Genel', 'Geliştirme', 'Tasarım', 'Sosyal', 'Haberler', 'Araçlar'],

    atab_notes: [
      {
        id: 'note_welcome',
        title: 'Hoş Geldiniz! 🚀',
        content: '# ATAB Yeni Sekme Defteri\n\nBu not defteri **Markdown**, **interaktif yapılacaklar listesi**, **etiketler** ve **kişi atamalarını** destekler.\n\n### Hızlı İpuçları:\n- [x] Sekme açılışında saat ve arama hazır\n- [ ] İstediğin kadar yeni kart aç ve sitelerini ekle\n- [ ] Kart altındaki **Hepsini Aç** butonunu dene\n- [ ] İnternette gezerken `Alt + B` ile sayfaları yer imlerine kaydet\n- [ ] Görsel aramak için herhangi bir resmi kopyalayıp `Ctrl + V` ile yapıştır\n\n> @Furkan bu notu inceleyip #önemli etiketini ekledi.',
        tags: ['#rehber', '#hızlıbaşlangıç'],
        assignees: ['Furkan'],
        updatedAt: Date.now(),
        isPinned: true
      }
    ]
  },

  // Check if Chrome extension storage API is available
  hasChromeStorage() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  },

  // Get item with fallback
  async get(key) {
    const defaultValue = this.DEFAULTS[key] !== undefined ? this.DEFAULTS[key] : null;

    if (this.hasChromeStorage()) {
      try {
        const result = await chrome.storage.local.get([key]);
        if (result && result[key] !== undefined && result[key] !== null) {
          // Sync to localStorage as backup
          try {
            localStorage.setItem(key, JSON.stringify(result[key]));
          } catch (e) {}
          return result[key];
        }
      } catch (err) {
        console.warn('Chrome storage read error, falling back to localStorage:', err);
      }
    }

    // Fallback to localStorage
    try {
      const local = localStorage.getItem(key);
      if (local !== null) {
        const parsed = JSON.parse(local);
        // Sync to chrome storage if available
        if (this.hasChromeStorage()) {
          chrome.storage.local.set({ [key]: parsed });
        }
        return parsed;
      }
    } catch (e) {}

    // Initialize with default and save
    if (defaultValue !== null) {
      await this.set(key, defaultValue);
      return JSON.parse(JSON.stringify(defaultValue));
    }

    return null;
  },

  // Set item to both storages simultaneously
  async set(key, value) {
    // 1. Write to localStorage
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }

    // 2. Write to Chrome storage
    if (this.hasChromeStorage()) {
      try {
        await chrome.storage.local.set({ [key]: value });
      } catch (err) {
        console.error('Chrome storage write failed:', err);
      }
    }

    return value;
  },

  // Initialize all storage keys
  async init() {
    for (const key of Object.keys(this.DEFAULTS)) {
      await this.get(key);
    }
  },

  // Export full state as JSON
  async exportBackup() {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: await this.get('atab_settings'),
      searchEngines: await this.get('atab_search_engines'),
      cards: await this.get('atab_cards'),
      bookmarks: await this.get('atab_bookmarks'),
      categories: await this.get('atab_categories'),
      notes: await this.get('atab_notes')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `ATAB-Yedek-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Import full state from JSON
  async importBackup(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (data.settings) await this.set('atab_settings', { ...this.DEFAULTS.atab_settings, ...data.settings });
      if (data.searchEngines && Array.isArray(data.searchEngines)) await this.set('atab_search_engines', data.searchEngines);
      if (data.cards && Array.isArray(data.cards)) await this.set('atab_cards', data.cards);
      if (data.bookmarks && Array.isArray(data.bookmarks)) await this.set('atab_bookmarks', data.bookmarks);
      if (data.categories && Array.isArray(data.categories)) await this.set('atab_categories', data.categories);
      if (data.notes && Array.isArray(data.notes)) await this.set('atab_notes', data.notes);

      return true;
    } catch (err) {
      console.error('Import failed:', err);
      throw err;
    }
  },

  // Reset to factory defaults
  async resetDefaults() {
    for (const [key, val] of Object.entries(this.DEFAULTS)) {
      await this.set(key, val);
    }
  }
};
