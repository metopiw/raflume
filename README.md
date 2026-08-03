<div align="center">
  <img src="assets/raflume-brand-icon.png" alt="Raflume brand icon" width="280" />

# Raflume

**A safe, undoable Desktop and Downloads organizer for Windows.**<br />
**Windows için güvenli, geri alınabilir Masaüstü ve İndirilenler düzenleyicisi.**

[English](#english) · [Türkçe](#türkçe) · [Download / İndir](https://github.com/metopiw/raflume/releases/latest)

![Version](https://img.shields.io/badge/version-1.6.5-7c3aed)
![Platform](https://img.shields.io/badge/platform-Windows%20x64-0078d4)
![License](https://img.shields.io/badge/license-MIT-22c55e)
</div>

## English

Raflume organizes your Desktop and Downloads without deleting files or overwriting existing items. Manual mode previews every destination and waits for your approval, while the movement journal lets you undo the entire latest batch.

![Raflume overview](docs/screenshots/raflume-overview.png)

### Highlights

- Separate shelves for documents, images, videos, installers, archives, folders, and shortcuts
- Manual preview and explicit user approval
- Optional automatic organization with startup scanning for existing items
- Collision-safe naming with no overwrites
- Persistent movement journal and batch undo
- Desktop, Downloads, and Windows Public Desktop support
- System tray, global shortcut, and a native desktop-layer widget that stays visible with Win+D
- Direct access to each shelf's latest item from the widget
- On-device clipboard image history limited to the latest 12 images
- Turkish and English interface

### Desktop widget

<img src="docs/screenshots/raflume-widget.png" alt="Raflume desktop widget" width="340" />

### Download and install

Download packages from [GitHub Releases](https://github.com/metopiw/raflume/releases/latest):

- **Setup EXE:** Recommended for a standard Windows installation.
- **Portable folder ZIP:** Extract the complete archive and run the root `Raflume.exe`. Keep that executable next to its `app` directory.

The distributed packages target Windows x64.

> [!WARNING]
> The current packages are not signed with a code-signing certificate, so Windows SmartScreen may display a warning. Download only from this repository's official Releases page and verify the file against the SHA-256 checksums attached to the Release.

Example verification in PowerShell:

```powershell
Get-FileHash .\Raflume-Setup-1.6.5-x64.exe -Algorithm SHA256
```

### Safety model

- Raflume never deletes files or directories.
- It never overwrites an occupied destination; it generates a collision-free name.
- Temporary downloads and protected Windows system files stay in place.
- Manual organization cannot start without preview and approval.
- Movements are journaled as `pending`, `completed`, `undone`, or `failed`.
- The renderer has no direct Node.js access (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`).
- Clipboard images are never uploaded and remain in local user data.

Read [SECURITY.md](SECURITY.md) to report a vulnerability.

### Run from source

Requirements: Node.js 20+ and Windows.

```bash
npm ci
npm run dev
```

The root `Raflume.exe` is a small taskbar launcher that starts the source build without showing a console window. Rebuild it with `npm run build:launcher`.

Quality checks:

```bash
npm run typecheck
npm test
npm run build
```

Core stack: Electron 31, React 18, TypeScript 5.5, Vite 5, and Tailwind CSS 3.

### Contributing and license

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or submitting a change. Raflume is distributed under the [MIT License](LICENSE).

---

## Türkçe

Raflume, dosyalarınızı silmeden veya mevcut dosyaların üzerine yazmadan Masaüstü ve İndirilenler klasörlerini düzenler. Manuel modda hedefleri önce gösterir ve onayınızı bekler; yapılan hareketleri kaydeder ve son işlem grubunun tamamını geri alabilir.

![Raflume ana ekranı](docs/screenshots/raflume-overview.png)

### Öne çıkanlar

- Belgeler, görseller, videolar, kurulum dosyaları, arşivler, klasörler ve kısayollar için ayrı raflar
- Manuel önizleme ve kullanıcı onayı
- Başlangıçta mevcut öğeleri de tarayabilen isteğe bağlı otomatik düzenleme
- Çakışmasız adlandırma; mevcut dosyanın üzerine yazmama
- Kalıcı işlem günlüğü ve toplu geri alma
- Masaüstü, İndirilenler ve Windows Public Desktop desteği
- Sistem tepsisi, global kısayol ve Win+D sırasında görünür kalan yerel masaüstü katmanı widget'ı
- Widget üzerinden her rafın son öğesine doğrudan erişim
- Son 12 pano görselini yalnızca cihazda tutan yerel geçmiş
- Türkçe ve İngilizce arayüz

### Masaüstü widget'ı

<img src="docs/screenshots/raflume-widget.png" alt="Raflume masaüstü widget'ı" width="340" />

### İndirme ve kurulum

Paketleri [GitHub Releases](https://github.com/metopiw/raflume/releases/latest) sayfasından indirin:

- **Setup EXE:** Standart Windows kurulumu için önerilen seçenek.
- **Portable klasör ZIP:** ZIP'i tamamen çıkarın ve kökteki `Raflume.exe` dosyasını çalıştırın. `Raflume.exe` ile yanındaki `app` klasörünü birbirinden ayırmayın.

Dağıtımlar Windows x64 içindir.

> [!WARNING]
> Mevcut paketler kod imzalama sertifikasıyla imzalanmamıştır. Windows SmartScreen bu nedenle uyarı gösterebilir. Dosyayı yalnızca bu deponun resmi Releases sayfasından indirin ve Release içindeki SHA-256 sağlama toplamıyla doğrulayın.

PowerShell ile doğrulama örneği:

```powershell
Get-FileHash .\Raflume-Setup-1.6.5-x64.exe -Algorithm SHA256
```

### Güvenlik yaklaşımı

- Raflume dosya veya klasör silmez.
- Aynı adlı hedefin üzerine yazmaz; çakışmasız yeni ad üretir.
- Geçici indirme ve korunan Windows sistem dosyalarını taşımaz.
- Manuel düzenleme önizleme ve onay olmadan başlamaz.
- Hareketler `pending`, `completed`, `undone` veya `failed` durumuyla günlüğe yazılır.
- Renderer doğrudan Node.js erişimi almaz (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`).
- Pano görselleri buluta yüklenmez; yalnızca yerel kullanıcı verisinde tutulur.

Güvenlik açığı bildirmek için [SECURITY.md](SECURITY.md) dosyasını okuyun.

### Kaynaktan çalıştırma

Gereksinimler: Node.js 20+ ve Windows.

```bash
npm ci
npm run dev
```

Proje kökündeki küçük `Raflume.exe`, konsol penceresi göstermeden kaynak sürümü başlatır ve görev çubuğuna sabitlenebilir. Yeniden üretmek için `npm run build:launcher` komutunu çalıştırın.

Kalite kontrolleri:

```bash
npm run typecheck
npm test
npm run build
```

Ana teknoloji yığını: Electron 31, React 18, TypeScript 5.5, Vite 5 ve Tailwind CSS 3.

### Katkı ve lisans

Hata bildirmeden veya değişiklik göndermeden önce [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını inceleyin. Raflume [MIT Lisansı](LICENSE) ile dağıtılır.
