// ATAB - In-App GitHub Update Manager (Releases Gerektirmeyen Doğrudan Güncelleme)

const UpdateManager = {
  // Varsayılan GitHub Deposu (Kullanıcı adı / Repo adı)
  DEFAULT_REPO: 'furkanyasarr0/ATAB',
  repo: 'furkanyasarr0/ATAB',
  currentVersion: '1.0.0',
  latestRelease: null,
  isChecking: false,

  async init() {
    try {
      // Manifest versiyonunu dinamik al
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
        const manifest = chrome.runtime.getManifest();
        this.currentVersion = manifest.version || '1.0.0';
      }

      // Kaydedilmiş repo ayarını al
      const customRepo = await StorageManager.get('atab_github_repo');
      if (customRepo) {
        this.repo = customRepo;
      }

      this.setupEventListeners();

      // Arka planda periyodik kontrol (son kontrolden 2 saat geçmişse)
      const lastCheck = await StorageManager.get('atab_last_update_check') || 0;
      const cachedUpdate = await StorageManager.get('atab_cached_update');
      const now = Date.now();

      if (cachedUpdate && this.isNewerVersion(cachedUpdate.version, this.currentVersion)) {
        this.latestRelease = cachedUpdate;
        this.showTopBarBadge(cachedUpdate);
      }

      // 2 saat geçtiyse veya hiç kontrol edilmediyse arka planda kontrol et
      if (now - lastCheck > 2 * 60 * 60 * 1000 || !lastCheck) {
        this.check(false);
      }
    } catch (err) {
      console.warn('UpdateManager init hatası:', err);
    }
  },

  setupEventListeners() {
    // Sağ üstteki güncelleme bildirim butonu
    const badgeBtn = document.getElementById('btn-update-notification');
    if (badgeBtn) {
      badgeBtn.addEventListener('click', () => {
        if (this.latestRelease) {
          this.openModal(this.latestRelease);
        } else {
          this.check(true);
        }
      });
    }

    // Modal kapatma butonları
    const modalClose = document.getElementById('modal-update-close');
    const modalCancel = document.getElementById('modal-update-cancel');
    const modal = document.getElementById('update-modal');

    if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
    if (modalCancel) modalCancel.addEventListener('click', () => this.closeModal());
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    // Tek Tıkla Güncelle butonu
    const applyBtn = document.getElementById('btn-apply-update');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyUpdate());
    }

    // Ayarlar sekmesindeki "Şimdi Kontrol Et" butonu
    const manualCheckBtn = document.getElementById('btn-check-updates-manual');
    if (manualCheckBtn) {
      manualCheckBtn.addEventListener('click', () => this.check(true));
    }

    // Ayarlar sekmesindeki "Test Bildirimi Göster" butonu
    const testUpdateBtn = document.getElementById('btn-test-update-notify');
    if (testUpdateBtn) {
      testUpdateBtn.addEventListener('click', () => this.testNotification());
    }
  },

  // Sürüm karşılaştırma (SemVer: 1.1.0 > 1.0.0)
  isNewerVersion(remote, local) {
    if (!remote || !local) return false;
    const cleanRemote = remote.replace(/^v/i, '').trim();
    const cleanLocal = local.replace(/^v/i, '').trim();

    const pRemote = cleanRemote.split('.').map(n => parseInt(n, 10) || 0);
    const pLocal = cleanLocal.split('.').map(n => parseInt(n, 10) || 0);

    for (let i = 0; i < Math.max(pRemote.length, pLocal.length); i++) {
      const r = pRemote[i] || 0;
      const l = pLocal[i] || 0;
      if (r > l) return true;
      if (r < l) return false;
    }
    return false;
  },

  // Güncelleme Kontrolü (Doğrudan GitHub manifest.json dosyasını sorgular - Release gerektirmez!)
  async check(isManual = false) {
    if (this.isChecking) return;
    this.isChecking = true;

    const manualBtn = document.getElementById('btn-check-updates-manual');
    if (manualBtn && isManual) {
      manualBtn.disabled = true;
      manualBtn.innerHTML = '<span class="spinner-sm"></span> Kontrol Ediliyor...';
    }

    try {
      // 1. GitHub Raw üzerinden manifest.json'ı çek (Zaman damgası ile önbellek baypas edilir)
      const rawManifestUrl = `https://raw.githubusercontent.com/${this.repo}/main/manifest.json?_t=${Date.now()}`;
      const response = await fetch(rawManifestUrl, { cache: 'no-store' });

      await StorageManager.set('atab_last_update_check', Date.now());

      if (response.ok) {
        const remoteManifest = await response.json();
        const latestVer = remoteManifest.version || '';

        if (this.isNewerVersion(latestVer, this.currentVersion)) {
          // Son commit mesajlarını çekerek otomatik "Neler Yeni?" oluştur
          let changelogText = `- Yeni versiyon v${latestVer} yayınlandı.\n- Performans ve arayüz iyileştirmeleri yapıldı.`;
          try {
            const commitsRes = await fetch(`https://api.github.com/repos/${this.repo}/commits?per_page=5`, {
              headers: { 'Accept': 'application/vnd.github.v3+json' },
              cache: 'no-cache'
            });
            if (commitsRes.ok) {
              const commits = await commitsRes.json();
              if (Array.isArray(commits) && commits.length > 0) {
                const commitMessages = commits
                  .map(c => c.commit?.message?.split('\n')[0])
                  .filter(m => m && !m.toLowerCase().startsWith('merge') && !m.toLowerCase().startsWith('chore: configure'))
                  .slice(0, 4);

                if (commitMessages.length > 0) {
                  changelogText = commitMessages.map(msg => `- ${msg}`).join('\n');
                }
              }
            }
          } catch (e) {
            console.log('Commit notları alınamadı, varsayılan gösteriliyor');
          }

          this.latestRelease = {
            version: `v${latestVer}`,
            name: `🎉 ATAB v${latestVer} Yayında!`,
            body: changelogText,
            published_at: new Date().toISOString(),
            html_url: `https://github.com/${this.repo}`
          };

          await StorageManager.set('atab_cached_update', this.latestRelease);
          this.showTopBarBadge(this.latestRelease);

          if (isManual) {
            this.openModal(this.latestRelease);
            App.showToast(`🎉 Yeni sürüm bulundu: v${latestVer}`);
          }
        } else {
          // Güncel
          this.hideTopBarBadge();
          await StorageManager.remove('atab_cached_update');
          if (isManual) {
            App.showToast(`✅ Eklentiniz en güncel sürümde (v${this.currentVersion})`);
          }
        }
      } else if (response.status === 404) {
        if (isManual) {
          App.showToast(`ℹ️ GitHub deposu henüz oluşturulmamış veya manifest bulunamadı.`);
        }
      } else {
        throw new Error(`GitHub Status: ${response.status}`);
      }
    } catch (err) {
      console.warn('Güncelleme denetleme hatası:', err);
      if (isManual) {
        App.showToast(`⚠️ Güncelleme kontrol edilemedi: GitHub bağlantınızı kontrol edin.`);
      }
    } finally {
      this.isChecking = false;
      if (manualBtn && isManual) {
        manualBtn.disabled = false;
        manualBtn.innerHTML = '🔄 Güncellemeleri Şimdi Denetle';
      }
      this.updateSettingsInfo();
    }
  },

  // Tek Tıkla Güncelleme Uygulama
  async applyUpdate() {
    const btn = document.getElementById('btn-apply-update');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-sm"></span> Güncelleniyor...';
    }

    App.showToast('🚀 Güncelleme uygulanıyor...');

    try {
      // 1. Tarayıcının yerel requestUpdateCheck API'sini tetikle
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.requestUpdateCheck) {
        chrome.runtime.requestUpdateCheck((status, details) => {
          console.log('Update check status:', status, details);
          if (status === 'update_available') {
            App.showToast('Yeni sürüm yüklendi! Yeniden başlatılıyor...');
            setTimeout(() => {
              chrome.runtime.reload();
            }, 1000);
            return;
          }
        });
      }

      // 2. Yeniden yükleme aksiyonu
      setTimeout(() => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.reload) {
          chrome.runtime.reload();
          window.location.reload();
        } else {
          window.location.reload();
        }
      }, 1200);

    } catch (err) {
      console.error('Güncelleme uygulama hatası:', err);
      App.showToast('Eklenti yenileniyor...');
      window.location.reload();
    }
  },

  // Sağ üstteki rozeti göster
  showTopBarBadge(release) {
    const badgeBtn = document.getElementById('btn-update-notification');
    const badgeVer = document.getElementById('update-badge-version');
    if (badgeBtn) {
      badgeBtn.style.display = 'inline-flex';
      badgeBtn.classList.add('pulse-animation');
      if (badgeVer) badgeVer.textContent = release.version;
    }
  },

  // Rozeti gizle
  hideTopBarBadge() {
    const badgeBtn = document.getElementById('btn-update-notification');
    if (badgeBtn) {
      badgeBtn.style.display = 'none';
    }
  },

  // Güncelleme Modalı Aç
  openModal(release) {
    const modal = document.getElementById('update-modal');
    if (!modal) return;

    const titleEl = document.getElementById('update-modal-title');
    const badgeEl = document.getElementById('update-modal-badge');
    const currentVerEl = document.getElementById('update-modal-current-ver');
    const newVerEl = document.getElementById('update-modal-new-ver');
    const changelogEl = document.getElementById('update-modal-changelog');
    const dateEl = document.getElementById('update-modal-date');
    const githubLink = document.getElementById('update-modal-github-link');

    if (titleEl) titleEl.textContent = release.name || 'Yeni Güncelleme Mevcut!';
    if (badgeEl) badgeEl.textContent = release.version;
    if (currentVerEl) currentVerEl.textContent = `v${this.currentVersion}`;
    if (newVerEl) newVerEl.textContent = `${release.version}`;
    
    if (changelogEl) {
      const formattedNotes = this.formatChangelog(release.body);
      changelogEl.innerHTML = formattedNotes;
    }

    if (dateEl && release.published_at) {
      const d = new Date(release.published_at);
      dateEl.textContent = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    if (githubLink && release.html_url) {
      githubLink.href = release.html_url;
      githubLink.style.display = 'inline-flex';
    }

    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('update-modal');
    if (modal) modal.classList.remove('active');
  },

  formatChangelog(text) {
    if (!text) return '<p>Detaylı sürüm notu belirtilmedi.</p>';
    
    const lines = text.split('\n');
    let html = '<ul class="changelog-list">';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      if (trimmed.startsWith('#')) {
        const headerText = trimmed.replace(/^#+\s*/, '');
        html += `<li class="changelog-header"><strong>${headerText}</strong></li>`;
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const itemText = trimmed.replace(/^[-*]\s*/, '');
        html += `<li class="changelog-item"><span class="bullet">✨</span> ${this.escapeHtml(itemText)}</li>`;
      } else {
        html += `<li class="changelog-text">${this.escapeHtml(trimmed)}</li>`;
      }
    });

    html += '</ul>';
    return html;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Ayarlar sekmesindeki bilgileri güncelle
  async updateSettingsInfo() {
    const curVerEl = document.getElementById('about-current-version');
    const lastCheckEl = document.getElementById('about-last-check-time');
    const repoInput = document.getElementById('setting-github-repo');

    if (curVerEl) curVerEl.textContent = `v${this.currentVersion}`;
    
    const lastCheck = await StorageManager.get('atab_last_update_check');
    if (lastCheckEl) {
      if (lastCheck) {
        const date = new Date(lastCheck);
        lastCheckEl.textContent = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('tr-TR');
      } else {
        lastCheckEl.textContent = 'Henüz yapılmadı';
      }
    }

    if (repoInput && !repoInput.value) {
      repoInput.value = this.repo;
    }
  },

  // Test amacıyla simüle edilmiş güncelleme bildirimi göster
  testNotification() {
    const testRelease = {
      version: 'v1.1.0',
      name: '🎉 ATAB v1.1.0 - Büyük Güncelleme & Yenilikler',
      body: `## Yenilikler\n- Otomatik tek tıkla güncelleme motoru entegre edildi.\n- Arama motorlarına sesli ve görsel arama optimizasyonu yapıldı.\n- Yeni temalar ve hız iyileştirmeleri eklendi.\n- Bellek kullanımı %30 optimize edildi.`,
      published_at: new Date().toISOString(),
      html_url: `https://github.com/${this.repo}`
    };

    this.latestRelease = testRelease;
    this.showTopBarBadge(testRelease);
    this.openModal(testRelease);
    App.showToast('🧪 Test güncelleme bildirimi açıldı!');
  }
};
