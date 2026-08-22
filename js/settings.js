// ATAB - Settings Modal & Backup/Restore Manager

const SettingsManager = {
  settings: null,
  searchEngines: [],

  async init(settings, searchEngines) {
    this.settings = settings;
    this.searchEngines = searchEngines;
    this.setupEventListeners();
  },

  openModal(defaultTab = 'general') {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    this.populateGeneralTab();
    this.populateEnginesTab();
    this.populateThemeTab();
    if (typeof UpdateManager !== 'undefined') UpdateManager.updateSettingsInfo();
    this.switchTab(defaultTab);

    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('active');
  },

  switchTab(tabId) {
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.settings-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-pane-${tabId}`);
    });

    if (tabId === 'about' && typeof UpdateManager !== 'undefined') {
      UpdateManager.updateSettingsInfo();
    }
  },

  // 1. General Tab
  populateGeneralTab() {
    const userNameInput = document.getElementById('setting-user-name');
    const clock24Checkbox = document.getElementById('setting-clock-24');
    const showSecondsCheckbox = document.getElementById('setting-show-seconds');
    const showDateCheckbox = document.getElementById('setting-show-date');
    const openNewTabCheckbox = document.getElementById('setting-open-newtab');

    if (userNameInput) userNameInput.value = this.settings.userName || '';
    if (clock24Checkbox) clock24Checkbox.checked = this.settings.clockFormat24 !== false;
    if (showSecondsCheckbox) showSecondsCheckbox.checked = this.settings.showSeconds === true;
    if (showDateCheckbox) showDateCheckbox.checked = this.settings.showDate !== false;
    if (openNewTabCheckbox) openNewTabCheckbox.checked = this.settings.openLinksInNewTab !== false;
  },

  saveGeneralSettings() {
    const userNameInput = document.getElementById('setting-user-name');
    const clock24Checkbox = document.getElementById('setting-clock-24');
    const showSecondsCheckbox = document.getElementById('setting-show-seconds');
    const showDateCheckbox = document.getElementById('setting-show-date');
    const openNewTabCheckbox = document.getElementById('setting-open-newtab');

    if (userNameInput) this.settings.userName = userNameInput.value.trim();
    if (clock24Checkbox) this.settings.clockFormat24 = clock24Checkbox.checked;
    if (showSecondsCheckbox) this.settings.showSeconds = showSecondsCheckbox.checked;
    if (showDateCheckbox) this.settings.showDate = showDateCheckbox.checked;
    if (openNewTabCheckbox) this.settings.openLinksInNewTab = openNewTabCheckbox.checked;

    StorageManager.set('atab_settings', this.settings);
    ClockManager.updateSettings(this.settings);
    CardsManager.settings = this.settings;
    App.showToast('Ayarlar kaydedildi.');
  },

  // 2. Search Engines Tab
  populateEnginesTab() {
    const listEl = document.getElementById('settings-engines-list');
    if (!listEl) return;

    listEl.innerHTML = this.searchEngines.map(eng => {
      const isDefault = eng.id === this.settings.searchEngine;

      return `
        <div class="settings-engine-row ${isDefault ? 'default-engine' : ''}">
          <div class="engine-row-left">
            <span class="engine-row-icon">${SearchManager.getEngineIcon(eng)}</span>
            <div class="engine-row-details">
              <strong>${eng.name}</strong>
              <span class="engine-row-url">${eng.searchUrl}</span>
            </div>
          </div>
          <div class="engine-row-right">
            ${isDefault ? `
              <span class="badge badge-primary">Varsayılan</span>
            ` : `
              <button class="btn btn-sm btn-ghost btn-set-default-engine" data-engine-id="${eng.id}">Varsayılan Yap</button>
            `}
            ${eng.isCustom ? `
              <button class="btn btn-sm btn-ghost btn-delete-custom-engine" data-engine-id="${eng.id}" title="Sil">🗑</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  addCustomEngine(name, searchUrl, iconUrl) {
    if (!name || !searchUrl) return;

    let cleanUrl = searchUrl.trim();
    if (!cleanUrl.includes('%s')) {
      cleanUrl += '%s';
    }

    const newEngine = {
      id: 'custom_' + Date.now(),
      name: name.trim(),
      searchUrl: cleanUrl,
      customIcon: iconUrl ? iconUrl.trim() : '',
      isCustom: true
    };

    this.searchEngines.push(newEngine);
    StorageManager.set('atab_search_engines', this.searchEngines);
    SearchManager.engines = this.searchEngines;
    SearchManager.renderEngineSelector();
    this.populateEnginesTab();
    App.showToast(`"${name}" arama motoru eklendi.`);
  },

  deleteCustomEngine(engineId) {
    this.searchEngines = this.searchEngines.filter(e => e.id !== engineId);
    if (this.settings.searchEngine === engineId) {
      this.settings.searchEngine = 'yandex';
      StorageManager.set('atab_settings', this.settings);
      SearchManager.setActiveEngine('yandex');
    }
    StorageManager.set('atab_search_engines', this.searchEngines);
    SearchManager.engines = this.searchEngines;
    SearchManager.renderEngineSelector();
    this.populateEnginesTab();
    App.showToast('Özel motor silindi.');
  },

  // 3. Themes Tab
  populateThemeTab() {
    const presetsContainer = document.getElementById('theme-presets-grid');
    if (!presetsContainer) return;

    const currentTheme = this.settings.theme || 'dark';

    presetsContainer.innerHTML = Object.entries(ThemeManager.PRESETS).map(([key, preset]) => {
      const isSelected = key === currentTheme;
      return `
        <div class="theme-preset-card ${isSelected ? 'selected' : ''}" data-theme-key="${key}">
          <div class="preset-preview" style="background: ${preset.bgGradient || preset.bgColor}; border: 2px solid ${preset.accentColor};">
            <div class="preset-card-sample" style="background: ${preset.cardBg};"></div>
          </div>
          <span class="preset-name">${preset.name}</span>
          ${isSelected ? '<span class="preset-badge">Aktif</span>' : ''}
        </div>
      `;
    }).join('');

    // Fill custom theme inputs
    const custom = this.settings.customTheme || {};
    const accentInput = document.getElementById('theme-custom-accent');
    const blurInput = document.getElementById('theme-custom-blur');
    const blurVal = document.getElementById('theme-custom-blur-val');
    const radiusInput = document.getElementById('theme-custom-radius');
    const radiusVal = document.getElementById('theme-custom-radius-val');
    const bgTypeSelect = document.getElementById('theme-custom-bgtype');
    const bgColorInput = document.getElementById('theme-custom-bgcolor');
    const bgUrlInput = document.getElementById('theme-custom-bgurl');

    if (accentInput) accentInput.value = custom.accentColor || '#ef4444';
    if (blurInput) {
      blurInput.value = custom.cardBlur || 16;
      if (blurVal) blurVal.textContent = `${custom.cardBlur || 16}px`;
    }
    if (radiusInput) {
      radiusInput.value = custom.borderRadius || 16;
      if (radiusVal) radiusVal.textContent = `${custom.borderRadius || 16}px`;
    }
    if (bgTypeSelect) bgTypeSelect.value = custom.bgType || 'color';
    if (bgColorInput) bgColorInput.value = custom.bgColor || '#0f172a';
    if (bgUrlInput) bgUrlInput.value = custom.bgImage || '';
  },

  setupEventListeners() {
    const settingsBtn = document.getElementById('btn-open-settings');
    const closeBtn = document.getElementById('settings-modal-close');
    const modal = document.getElementById('settings-modal');

    // Open settings
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    // Tabs navigation
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // General settings change listeners
    ['setting-user-name', 'setting-clock-24', 'setting-show-seconds', 'setting-show-date', 'setting-open-newtab'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.saveGeneralSettings());
        if (el.tagName === 'INPUT' && el.type === 'text') {
          el.addEventListener('input', () => this.saveGeneralSettings());
        }
      }
    });

    // Preset theme clicks
    const presetsContainer = document.getElementById('theme-presets-grid');
    if (presetsContainer) {
      presetsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.theme-preset-card');
        if (card) {
          const themeKey = card.getAttribute('data-theme-key');
          if (themeKey) {
            ThemeManager.setPreset(themeKey);
            this.populateThemeTab();
            App.showToast(`Tema değiştirildi: ${ThemeManager.PRESETS[themeKey].name}`);
          }
        }
      });
    }

    // Custom Theme inputs
    const accentInput = document.getElementById('theme-custom-accent');
    if (accentInput) {
      accentInput.addEventListener('input', (e) => {
        ThemeManager.setCustomTheme({ accentColor: e.target.value });
      });
    }

    const blurInput = document.getElementById('theme-custom-blur');
    const blurVal = document.getElementById('theme-custom-blur-val');
    if (blurInput) {
      blurInput.addEventListener('input', (e) => {
        if (blurVal) blurVal.textContent = `${e.target.value}px`;
        ThemeManager.setCustomTheme({ cardBlur: parseInt(e.target.value, 10) });
      });
    }

    const radiusInput = document.getElementById('theme-custom-radius');
    const radiusVal = document.getElementById('theme-custom-radius-val');
    if (radiusInput) {
      radiusInput.addEventListener('input', (e) => {
        if (radiusVal) radiusVal.textContent = `${e.target.value}px`;
        ThemeManager.setCustomTheme({ borderRadius: parseInt(e.target.value, 10) });
      });
    }

    const bgTypeSelect = document.getElementById('theme-custom-bgtype');
    const bgColorInput = document.getElementById('theme-custom-bgcolor');
    const bgUrlInput = document.getElementById('theme-custom-bgurl');
    const bgFileInput = document.getElementById('theme-custom-bgfile');

    if (bgTypeSelect) {
      bgTypeSelect.addEventListener('change', (e) => {
        ThemeManager.setCustomTheme({ bgType: e.target.value });
      });
    }

    if (bgColorInput) {
      bgColorInput.addEventListener('input', (e) => {
        ThemeManager.setCustomTheme({ bgType: 'color', bgColor: e.target.value });
      });
    }

    if (bgUrlInput) {
      bgUrlInput.addEventListener('input', (e) => {
        ThemeManager.setCustomTheme({ bgType: 'image', bgImage: e.target.value });
      });
    }

    if (bgFileInput) {
      bgFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target.result;
            ThemeManager.setCustomTheme({ bgType: 'image', bgImage: base64 });
            App.showToast('Özel duvar kağıdı yüklendi.');
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });
    }

    // Engine settings events
    const listEl = document.getElementById('settings-engines-list');
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const defaultBtn = e.target.closest('.btn-set-default-engine');
        if (defaultBtn) {
          const id = defaultBtn.getAttribute('data-engine-id');
          SearchManager.setActiveEngine(id);
          this.populateEnginesTab();
          App.showToast('Varsayılan arama motoru güncellendi.');
          return;
        }

        const deleteBtn = e.target.closest('.btn-delete-custom-engine');
        if (deleteBtn) {
          const id = deleteBtn.getAttribute('data-engine-id');
          this.deleteCustomEngine(id);
          return;
        }
      });
    }

    // Add custom engine form
    const addEngineForm = document.getElementById('form-add-custom-engine');
    if (addEngineForm) {
      addEngineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('new-engine-name');
        const urlInput = document.getElementById('new-engine-url');
        const iconInput = document.getElementById('new-engine-icon');

        if (nameInput && urlInput) {
          this.addCustomEngine(nameInput.value, urlInput.value, iconInput ? iconInput.value : '');
          addEngineForm.reset();
        }
      });
    }

    // Export Backup JSON
    const exportBtn = document.getElementById('btn-export-backup');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        StorageManager.exportBackup();
        App.showToast('Yedek dosyası indirildi.');
      });
    }

    // Import Backup JSON
    const importInput = document.getElementById('backup-file-input');
    const importBtn = document.getElementById('btn-import-backup');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => {
        importInput.click();
      });

      importInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              await StorageManager.importBackup(event.target.result);
              App.showToast('Yedek başarıyla yüklendi! Sayfa yenileniyor...');
              setTimeout(() => window.location.reload(), 800);
            } catch (err) {
              alert('Geçersiz yedek JSON dosyası.');
            }
          };
          reader.readAsText(e.target.files[0]);
        }
      });
    }

    // Reset Defaults
    const resetBtn = document.getElementById('btn-reset-defaults');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (confirm('Tüm kartlar, siteler ve ayarlar varsayılan haline döndürülecektir. Devam etmek istiyor musunuz?')) {
          await StorageManager.resetDefaults();
          App.showToast('Varsayılanlara dönüldü. Sayfa yenileniyor...');
          setTimeout(() => window.location.reload(), 600);
        }
      });
    }

    // GitHub Repo Save
    const btnSaveRepo = document.getElementById('btn-save-github-repo');
    const inputRepo = document.getElementById('setting-github-repo');
    if (btnSaveRepo && inputRepo) {
      btnSaveRepo.addEventListener('click', async () => {
        const rawVal = inputRepo.value.trim();
        if (rawVal) {
          const val = typeof UpdateManager !== 'undefined' ? UpdateManager.cleanRepoName(rawVal) : rawVal;
          inputRepo.value = val;
          await StorageManager.set('atab_github_repo', val);
          if (typeof UpdateManager !== 'undefined') {
            UpdateManager.repo = val;
          }
          const link = document.getElementById('about-repo-link');
          if (link) {
            link.href = `https://github.com/${val}`;
            link.textContent = `GitHub / ${val}`;
          }
          App.showToast('GitHub deposu güncellendi.');
        }
      });
    }
  }
};
