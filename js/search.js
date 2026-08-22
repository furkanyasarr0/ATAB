// ATAB - Search Module (Engines, Suggestions, Voice, Image Search & Ctrl+V)

const SearchManager = {
  activeEngineId: 'yandex',
  engines: [],
  settings: null,
  pastedImageFile: null,

  // Built-in engine icon definitions (crisp SVGs)
  ICONS: {
    yandex: `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="11" fill="#FC3F1D"/><path fill="#FFF" d="M13.5 17h-2.1l-3.2-5.4V17H6.3V7h4.3c2.4 0 3.9 1.3 3.9 3.2 0 1.5-.8 2.6-2.1 3l3.1 3.8zm-2.1-6.7c1.2 0 1.8-.6 1.8-1.5s-.6-1.5-1.8-1.5H8.3v3h3.1z"/></svg>`,
    google: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`,
    duckduckgo: `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="10" fill="#DE5833"/><path fill="#FFF" d="M12 5c-3.87 0-7 2.69-7 6 0 1.95 1.1 3.68 2.8 4.79-.1.35-.38 1.25-.8 1.83 0 0 1.5 0 2.85-.92.73.2 1.48.3 2.15.3 3.87 0 7-2.69 7-6s-3.13-6-7-6zm-1 8.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
    bing: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#008373" d="M4 3l4.5 1.6v12.2l5.7-3.3-2.8-4.2 4.4-1.5 4.2 7.2-11.5 6V3z"/></svg>`,
    brave: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#FB542B" d="M12 2l-7 4v6c0 5.55 3.84 10.74 7 12 3.16-1.26 7-6.45 7-12V6l-7-4zm0 4.18l4.5 2.57v3.75c0 3.52-2.3 6.81-4.5 7.82-2.2-1.01-4.5-4.3-4.5-7.82V8.75l4.5-2.57z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#FF0000" d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81z"/><polygon fill="#FFF" points="10,15 15.5,12 10,9"/></svg>`,
    github: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#FFF" fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
    wikipedia: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#FFF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.8 14.5l-1.3-4.1-1.3 4.1H9.8L7.5 7.5h1.7l1.5 6 1.3-4.1h1.4l1.3 4.1 1.5-6h1.7l-2.3 9h-1.3z"/></svg>`,
    reddit: `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="10" fill="#FF4500"/><path fill="#FFF" d="M16.5 13.5c0-.6-.4-1.1-.9-1.2.1-.3.2-.6.2-.9 0-1.7-1.7-3-3.8-3-.4 0-.7 0-1 .1l.7-3.1 2.2.5c0 .5.4.9.9.9.6 0 1-.4 1-1s-.4-1-1-1c-.4 0-.8.3-.9.7l-2.5-.5c-.2 0-.4.1-.4.3l-.9 4c-1.8.3-3.1 1.6-3.1 3.1 0 .3 0 .6.2.9-.5.1-.9.6-.9 1.2 0 .7.5 1.2 1.2 1.2.1 0 .2 0 .3-.1.1.9 1.5 1.6 3.1 1.6s3-.7 3.1-1.6c.1 0 .2.1.3.1.7 0 1.2-.5 1.2-1.2z"/></svg>`,
    custom: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`
  },

  async init(settings, searchEngines) {
    this.settings = settings;
    this.engines = searchEngines || [];
    this.activeEngineId = (settings && settings.searchEngine) || 'yandex';

    this.renderEngineSelector();
    this.setupEventListeners();
    this.setupClipboardPaste();
  },

  getEngine(id) {
    return this.engines.find(e => e.id === id) || this.engines[0] || {
      id: 'yandex',
      name: 'Yandex',
      searchUrl: 'https://yandex.com.tr/search/?text=%s'
    };
  },

  getEngineIcon(engine) {
    if (engine.customIcon && engine.customIcon.startsWith('http')) {
      return `<img src="${engine.customIcon}" alt="${engine.name}" class="search-engine-img-icon" onerror="this.src='https://www.google.com/s2/favicons?domain=${new URL(engine.searchUrl).hostname}&sz=64'">`;
    }
    return this.ICONS[engine.id] || this.ICONS.custom;
  },

  renderEngineSelector() {
    const currentEngine = this.getEngine(this.activeEngineId);
    const triggerBtn = document.getElementById('search-engine-btn');
    const dropdownList = document.getElementById('search-engine-dropdown');

    if (triggerBtn) {
      triggerBtn.innerHTML = `
        <span class="engine-icon">${this.getEngineIcon(currentEngine)}</span>
        <span class="engine-arrow">▾</span>
      `;
      triggerBtn.title = `Aktif Motor: ${currentEngine.name} (Değiştirmek için tıkla)`;
    }

    if (dropdownList) {
      dropdownList.innerHTML = this.engines.map(eng => `
        <div class="engine-dropdown-item ${eng.id === this.activeEngineId ? 'active' : ''}" data-id="${eng.id}">
          <span class="engine-dropdown-icon">${this.getEngineIcon(eng)}</span>
          <span class="engine-dropdown-name">${eng.name}</span>
          ${eng.id === this.activeEngineId ? '<span class="engine-check">✓</span>' : ''}
        </div>
      `).join('');
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.placeholder = `${currentEngine.name} ile ara veya URL gir...`;
    }
  },

  setActiveEngine(engineId) {
    this.activeEngineId = engineId;
    this.settings.searchEngine = engineId;
    StorageManager.set('atab_settings', this.settings);
    this.renderEngineSelector();
    this.closeDropdown();
  },

  toggleDropdown() {
    const dropdown = document.getElementById('search-engine-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  },

  closeDropdown() {
    const dropdown = document.getElementById('search-engine-dropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
    }
  },

  executeSearch(query) {
    if (!query || query.trim() === '') return;
    const cleanQuery = query.trim();

    // Check if query is direct URL
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
    if (urlPattern.test(cleanQuery) && !cleanQuery.includes(' ')) {
      let targetUrl = cleanQuery;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      this.navigate(targetUrl);
      return;
    }

    // Standard search query
    const engine = this.getEngine(this.activeEngineId);
    let targetUrl = engine.searchUrl.replace('%s', encodeURIComponent(cleanQuery));
    if (!targetUrl.includes(encodeURIComponent(cleanQuery))) {
      targetUrl += encodeURIComponent(cleanQuery);
    }
    this.navigate(targetUrl);
  },

  navigate(url) {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.update) {
      chrome.tabs.update({ url: url });
    } else {
      window.location.href = url;
    }
  },

  // Setup Event Listeners
  setupEventListeners() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const triggerBtn = document.getElementById('search-engine-btn');
    const dropdownList = document.getElementById('search-engine-dropdown');
    const clearBtn = document.getElementById('search-clear-btn');
    const voiceBtn = document.getElementById('search-voice-btn');
    const imageUploadBtn = document.getElementById('search-image-btn');
    const imageFileInput = document.getElementById('image-file-input');

    // Submit form
    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.executeSearch(searchInput.value);
      });

      // Clear button
      searchInput.addEventListener('input', () => {
        if (clearBtn) {
          clearBtn.style.display = searchInput.value.length > 0 ? 'flex' : 'none';
        }
      });

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          searchInput.focus();
          clearBtn.style.display = 'none';
        });
      }
    }

    // Toggle engine dropdown
    if (triggerBtn) {
      triggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    if (dropdownList) {
      dropdownList.addEventListener('click', (e) => {
        const item = e.target.closest('.engine-dropdown-item');
        if (item) {
          const engineId = item.getAttribute('data-id');
          if (engineId) this.setActiveEngine(engineId);
        }
      });
    }

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-engine-selector')) {
        this.closeDropdown();
      }
    });

    // Voice Search
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => this.startVoiceRecognition());
    }

    // Image Upload Button
    if (imageUploadBtn && imageFileInput) {
      imageUploadBtn.addEventListener('click', () => {
        imageFileInput.click();
      });

      imageFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleImageFile(e.target.files[0]);
          imageFileInput.value = '';
        }
      });
    }

    // Drag & Drop image onto search bar
    const searchBarContainer = document.querySelector('.search-bar-container');
    if (searchBarContainer) {
      ['dragenter', 'dragover'].forEach(eventName => {
        searchBarContainer.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          searchBarContainer.classList.add('drag-active');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        searchBarContainer.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          searchBarContainer.classList.remove('drag-active');
        });
      });

      searchBarContainer.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
          this.handleImageFile(files[0]);
        }
      });
    }
  },

  // Global Clipboard (Ctrl+V) Image Listener
  setupClipboardPaste() {
    window.addEventListener('paste', (e) => {
      // Don't intercept if actively typing inside an input/textarea and text is being pasted
      const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            e.preventDefault();
            const blob = item.getAsFile();
            if (blob) {
              this.handleImageFile(blob);
              return;
            }
          }
        }
      }
    });
  },

  // Handle Image File for Visual Search
  handleImageFile(file) {
    this.pastedImageFile = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      this.showImageSearchModal(dataUrl, file);
    };
    reader.readAsDataURL(file);
  },

  // Display Image Search Modal with Engines
  showImageSearchModal(dataUrl, file) {
    const modal = document.getElementById('image-search-modal');
    const previewImg = document.getElementById('image-search-preview');
    if (!modal || !previewImg) return;

    previewImg.src = dataUrl;
    modal.classList.add('active');

    const yandexBtn = document.getElementById('img-search-yandex');
    const googleBtn = document.getElementById('img-search-google');
    const bingBtn = document.getElementById('img-search-bing');
    const closeBtn = document.getElementById('img-search-close');

    const cleanup = () => {
      modal.classList.remove('active');
    };

    if (closeBtn) closeBtn.onclick = cleanup;
    modal.onclick = (e) => {
      if (e.target === modal) cleanup();
    };

    if (yandexBtn) {
      yandexBtn.onclick = () => {
        // Redirect to Yandex Visual Search
        window.open('https://yandex.com.tr/images/search?rpt=imageview', '_blank');
        cleanup();
        App.showToast('Görsel Yandex Görsel Arama için hazırlandı.');
      };
    }

    if (googleBtn) {
      googleBtn.onclick = () => {
        // Redirect to Google Lens
        window.open('https://lens.google.com/upload', '_blank');
        cleanup();
        App.showToast('Google Lens sayfası açıldı.');
      };
    }

    if (bingBtn) {
      bingBtn.onclick = () => {
        window.open('https://www.bing.com/visualsearch', '_blank');
        cleanup();
        App.showToast('Bing Görsel Arama sayfası açıldı.');
      };
    }
  },

  // Web Speech API Voice Search
  startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tarayıcınız sesli aramayı desteklemiyor.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const voiceBtn = document.getElementById('search-voice-btn');
    if (voiceBtn) voiceBtn.classList.add('listening');

    recognition.onstart = () => {
      App.showToast('Dinleniyor... Konuşun');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = transcript;
        this.executeSearch(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      App.showToast('Ses algılanamadı.');
      if (voiceBtn) voiceBtn.classList.remove('listening');
    };

    recognition.onend = () => {
      if (voiceBtn) voiceBtn.classList.remove('listening');
    };

    recognition.start();
  }
};
