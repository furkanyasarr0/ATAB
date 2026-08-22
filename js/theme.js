// ATAB - Theme & Customization Engine

const ThemeManager = {
  settings: null,

  PRESETS: {
    dark: {
      name: 'Modern Koyu',
      bgType: 'gradient',
      bgColor: '#0f172a',
      bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%)',
      bgImage: '',
      cardBg: 'rgba(30, 41, 59, 0.72)',
      cardBlur: 16,
      cardOpacity: 85,
      accentColor: '#ef4444',
      textColor: '#f8fafc',
      textSecondary: '#94a3b8',
      borderRadius: 16,
      fontFamily: "'Inter', system-ui, sans-serif"
    },
    light: {
      name: 'Temiz Açık',
      bgType: 'gradient',
      bgColor: '#f1f5f9',
      bgGradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      bgImage: '',
      cardBg: 'rgba(255, 255, 255, 0.85)',
      cardBlur: 16,
      cardOpacity: 90,
      accentColor: '#ef4444',
      textColor: '#0f172a',
      textSecondary: '#64748b',
      borderRadius: 16,
      fontFamily: "'Inter', system-ui, sans-serif"
    },
    oled: {
      name: 'OLED Gece',
      bgType: 'color',
      bgColor: '#000000',
      bgGradient: '#000000',
      bgImage: '',
      cardBg: 'rgba(18, 18, 20, 0.95)',
      cardBlur: 12,
      cardOpacity: 95,
      accentColor: '#f43f5e',
      textColor: '#ffffff',
      textSecondary: '#a1a1aa',
      borderRadius: 14,
      fontFamily: "'Inter', system-ui, sans-serif"
    },
    cyberpunk: {
      name: 'Neon Cyberpunk',
      bgType: 'gradient',
      bgColor: '#0d0221',
      bgGradient: 'linear-gradient(135deg, #0d0221 0%, #19053b 40%, #050515 100%)',
      bgImage: '',
      cardBg: 'rgba(26, 11, 46, 0.75)',
      cardBlur: 20,
      cardOpacity: 80,
      accentColor: '#00f0ff',
      textColor: '#ffffff',
      textSecondary: '#d8b4fe',
      borderRadius: 18,
      fontFamily: "'Inter', system-ui, sans-serif"
    },
    sunset: {
      name: 'Gün Batımı',
      bgType: 'gradient',
      bgColor: '#1a0b2e',
      bgGradient: 'linear-gradient(135deg, #1e112a 0%, #3b1443 40%, #701a75 80%, #9a3412 100%)',
      bgImage: '',
      cardBg: 'rgba(35, 14, 45, 0.75)',
      cardBlur: 16,
      cardOpacity: 80,
      accentColor: '#f97316',
      textColor: '#fdf4ff',
      textSecondary: '#f0abfc',
      borderRadius: 16,
      fontFamily: "'Inter', system-ui, sans-serif"
    },
    ocean: {
      name: 'Derin Okyanus',
      bgType: 'gradient',
      bgColor: '#031926',
      bgGradient: 'linear-gradient(135deg, #031926 0%, #0b3954 50%, #087e8b 100%)',
      bgImage: '',
      cardBg: 'rgba(7, 30, 48, 0.75)',
      cardBlur: 16,
      cardOpacity: 80,
      accentColor: '#38bdf8',
      textColor: '#f0f9ff',
      textSecondary: '#7dd3fc',
      borderRadius: 16,
      fontFamily: "'Inter', system-ui, sans-serif"
    },
    emerald: {
      name: 'Zümrüt Ormanı',
      bgType: 'gradient',
      bgColor: '#061a14',
      bgGradient: 'linear-gradient(135deg, #061a14 0%, #064e3b 50%, #022c22 100%)',
      bgImage: '',
      cardBg: 'rgba(6, 40, 30, 0.75)',
      cardBlur: 16,
      cardOpacity: 80,
      accentColor: '#10b981',
      textColor: '#ecfdf5',
      textSecondary: '#6ee7b7',
      borderRadius: 16,
      fontFamily: "'Inter', system-ui, sans-serif"
    }
  },

  async init(settings) {
    this.settings = settings;
    this.applyTheme();
  },

  getCurrentThemeConfig() {
    const themeKey = (this.settings && this.settings.theme) || 'dark';
    if (themeKey === 'custom' && this.settings.customTheme) {
      return this.settings.customTheme;
    }
    return this.PRESETS[themeKey] || this.PRESETS.dark;
  },

  applyTheme() {
    const config = this.getCurrentThemeConfig();
    const root = document.documentElement;

    // Is light mode check for contrast styles
    const isLight = (this.settings && this.settings.theme === 'light') || 
                    (config.textColor === '#0f172a' || config.textColor === '#000000');

    if (isLight) {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }

    // Background styling
    const bgContainer = document.getElementById('bg-container');
    if (bgContainer) {
      if (config.bgType === 'image' && config.bgImage) {
        bgContainer.style.background = `url("${config.bgImage}") no-repeat center center / cover`;
      } else if (config.bgType === 'gradient') {
        bgContainer.style.background = config.bgGradient || config.bgColor || '#0f172a';
      } else {
        bgContainer.style.background = config.bgColor || '#0f172a';
      }
    }

    // CSS Custom Variables
    root.style.setProperty('--accent-color', config.accentColor || '#ef4444');
    root.style.setProperty('--text-primary', config.textColor || '#f8fafc');
    root.style.setProperty('--text-secondary', config.textSecondary || '#94a3b8');
    root.style.setProperty('--card-bg', config.cardBg || 'rgba(30, 41, 59, 0.7)');
    root.style.setProperty('--card-blur', `${config.cardBlur || 16}px`);
    root.style.setProperty('--border-radius', `${config.borderRadius || 16}px`);
    if (config.fontFamily) {
      root.style.setProperty('--font-family', config.fontFamily);
    }
  },

  setPreset(presetKey) {
    if (this.PRESETS[presetKey]) {
      this.settings.theme = presetKey;
      StorageManager.set('atab_settings', this.settings);
      this.applyTheme();
    }
  },

  setCustomTheme(customObj) {
    this.settings.theme = 'custom';
    this.settings.customTheme = { ...this.settings.customTheme, ...customObj };
    StorageManager.set('atab_settings', this.settings);
    this.applyTheme();
  }
};
