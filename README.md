# 🚀 ATAB - Modern Yeni Sekme & Hızlı Erişim Paneli

<div align="center">

![ATAB Logo](logo.png)

**Kişiselleştirilebilir Kartlar • Çoklu Arama Motorları & Görsel Arama • Markdown Not Defteri • Yer İmi Yöneticisi • Cam Efekti Temalar • Tek Tıkla GitHub Güncelleyici**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg?style=for-the-badge&logo=googlechrome&logoColor=white)](manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg?style=for-the-badge)](manifest.json)
[![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave%20%7C%20Opera-informational.svg?style=for-the-badge)](#)

</div>

---

## 🌟 Öne Çıkan Özellikler

### 🗂️ 1. Özelleştirilebilir Kartlar & Hızlı Erişim
- Sitelerinizi kategorilere göre kartlar halinde gruplayın.
- Özel site başlıkları, ikonlar ve URL'ler ekleyin/düzenleyin.
- Otomatik yüksek çözünürlüklü favicon desteği.

### 🔍 2. Akıllı Arama & Görsel/Ses Arama
- **Çoklu Motor:** Yandex, Google, Bing, DuckDuckGo veya istediğiniz özel arama motorları arasında anında geçiş yapın.
- **🖼️ Görsel ile Arama:** Sayfadayken panonuzdaki bir resmi `Ctrl+V` ile yapıştırın veya dosya yükleyerek Yandex/Google Lens/Bing üzerinde görsel arama başlatın.
- **🎙️ Sesli Arama:** Mikrofon simgesine basarak sesle arama yapın.

### 📝 3. Markdown Destekli Not Defteri (Drawer)
- Anında açılan şık yan çekmece (Drawer).
- Yapılacaklar listesi (Checklist), kod blokları ve biçimlendirme.
- **Kişi & Etiket Atama:** Notlarınıza kullanıcı avatarları ve renkli etiketler (Tag) atayıp filtreleyin.

### 🔖 4. Gelişmiş Yer İmleri & Hızlı Kaydetme
- Gezindiğiniz herhangi bir sayfadayken `Alt+B` kısayoluna basarak veya sağ tık menüsünden sayfayı doğrudan ATAB Yer İmlerine ekleyin.
- Kategori bazlı filtreleme ve hızlı arama.

### 🎨 5. Glassmorphism Temalar & Görsel Arka Plan
- **Hazır Temalar:** Gece Mavisi (Midnight), Saf Siyah (OLED), Açık Tema (Light), Neon Siberpunk vb.
- **Kendi Temanı Oluştur:** Arka plan resmi (URL veya bilgisayardan yükleme), renk, cam bulanıklığı (Blur) ve köşe yuvarlaklığı (Border Radius) ayarları.

### 💾 6. Güvenli Kalıcı Depolama & Yedekleme
- Tüm verileriniz `chrome.storage.local` üzerinde **%100 yerel ve gizli** kalır. Harici sunucuya hiçbir veri gönderilmez.
- Tek tıkla JSON formatında yedek indirin ve başka bilgisayarlara kolayca aktarın.

### ⚡ 7. Eklenti İçi Tek Tıkla GitHub Güncelleyici
- GitHub Releases üzerinden otomatik sürüm denetimi.
- Yeni bir sürüm çıktığında sağ üstte beliren bildirim rozeti ve tek tıkla güncelleme imkanı!

---

## ⌨️ Klavye Kısayolları

| Kısayol | İşlev |
| :--- | :--- |
| `/` veya `Ctrl + K` | Arama çubuğuna odaklan |
| `Alt + B` | Mevcut web sayfasını hızlıca ATAB Yer İmlerine kaydet |
| `Ctrl + V` | Herhangi bir kopyalanmış görseli yapıştırarak görsel arama başlat |
| `Escape` | Açık olan tüm pencereleri, modalları ve yan çekmeceleri kapat |
| `?` | Kısayollar yardım penceresini aç |

---

## 📦 Kurulum (Geliştirici / Arkadaşlarınız İçin)

1. Bu depoyu indirin:
   - **Yeşil `Code` butonuna tıklayıp `Download ZIP` deyin** ve bir klasöre çıkartın, ya da:
   ```bash
   git clone https://github.com/furkanyasarr0/ATAB.git
   ```
2. Tarayıcınızda (Chrome, Brave, Edge, Opera) eklentiler sayfasına gidin:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Sağ üst köşedeki **"Geliştirici Modu" (Developer Mode)** seçeneğini aktif edin.
4. Sol üstteki **"Paketlenmemiş Öğe Yükle" (Load Unpacked)** butonuna tıklayın ve ATAB klasörünü seçin.
5. Yeni bir sekme açın. ATAB kullanıma hazır! 🎉

---

## 🛠️ Yeni Versiyon Yayınlama (Sadece 2 Adım!)

Yeni özellikler ekleyip arkadaşlarınız için güncelleme yayınlamak istediğinizde hiçbir Release veya panel işlemiyle uğraşmanıza gerek yoktur:

1. `manifest.json` dosyasındaki versiyon numarasını artırın (örn: `"1.1.0"`).
2. Değişiklikleri GitHub'a pushlayın:
   ```bash
   git add .
   git commit -m "feat: yeni temalar ve hız iyileştirmesi"
   git push origin main
   ```

✨ **İşiniz bu kadar!** Eklenti doğrudan GitHub'daki `manifest.json` ve son commit mesajlarınızı okuyarak arkadaşlarınızın ekranında **"🔥 Yeni Güncelleme: v1.1.0"** bildirimini ve yenilikleri otomatik gösterecektir.

---

## 🔒 Gizlilik & Güvenlik

- **Sıfır Takip:** ATAB hiçbir kullanıcı verisini, geçmişini veya arama kayıtlarını toplamaz veya harici sunuculara iletmez.
- **Tamamen Çevrimdışı Çalışabilir:** Notlarınız ve yer imleriniz tamamen yerel tarayıcı veritabanında saklanır.

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır. Dilediğiniz gibi kullanabilir, özelleştirebilir ve paylaşabilirsiniz.
