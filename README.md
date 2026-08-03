<div align="center">
  <img src="assets/app-icon-128.png" alt="Raflume logosu" width="112" />

# Raflume

**Windows için güvenli, geri alınabilir Masaüstü ve İndirilenler düzenleyicisi.**

[Türkçe](README.md) · [English](README.en.md) · [Son sürümü indir](https://github.com/metopiw/raflume/releases/latest)

![Sürüm](https://img.shields.io/badge/sürüm-1.6.3-7c3aed)
![Platform](https://img.shields.io/badge/platform-Windows%20x64-0078d4)
![Lisans](https://img.shields.io/badge/lisans-MIT-22c55e)
</div>

Raflume, dosyalarınızı silmeden veya mevcut dosyaların üzerine yazmadan Masaüstü ve İndirilenler klasörlerini düzenler. Manuel modda hedefleri önce gösterir ve onayınızı bekler; yapılan hareketleri kaydeder ve son işlem grubunun tamamını geri alabilir.

![Raflume ana ekranı](docs/screenshots/raflume-overview.png)

## Öne çıkanlar

- Belgeler, görseller, videolar, kurulum dosyaları, arşivler, klasörler ve kısayollar için ayrı raflar
- Manuel önizleme ve kullanıcı onayı
- İsteğe bağlı otomatik düzenleme
- Çakışmasız adlandırma; mevcut dosyanın üzerine yazmama
- Kalıcı işlem günlüğü ve toplu geri alma
- Masaüstü, İndirilenler ve Windows Public Desktop desteği
- Sistem tepsisi, global kısayol ve bağımsız masaüstü widget'ı
- Son 12 pano görselini yalnızca cihazda tutan yerel geçmiş
- Türkçe ve İngilizce arayüz

### Masaüstü widget'ı

<img src="docs/screenshots/raflume-widget.png" alt="Raflume masaüstü widget'ı" width="340" />

## İndirme ve kurulum

Paketleri [GitHub Releases](https://github.com/metopiw/raflume/releases/latest) sayfasından indirin:

- **Setup EXE:** Standart Windows kurulumu için önerilen seçenek.
- **Portable klasör ZIP:** ZIP'i tamamen çıkarın ve kökteki `Raflume.exe` dosyasını çalıştırın. `Raflume.exe` ile yanındaki `app` klasörünü birbirinden ayırmayın.

Dağıtımlar Windows x64 içindir.

> [!WARNING]
> Mevcut paketler kod imzalama sertifikasıyla imzalanmamıştır. Windows SmartScreen bu nedenle uyarı gösterebilir. Dosyayı yalnızca bu deponun resmi Releases sayfasından indirin ve Release içindeki SHA-256 sağlama toplamıyla doğrulayın.

PowerShell ile doğrulama örneği:

```powershell
Get-FileHash .\Raflume-Setup-1.6.3-x64.exe -Algorithm SHA256
```

## Güvenlik yaklaşımı

- Raflume dosya veya klasör silmez.
- Aynı adlı hedefin üzerine yazmaz; çakışmasız yeni ad üretir.
- Geçici indirme ve korunan Windows sistem dosyalarını taşımaz.
- Manuel düzenleme önizleme ve onay olmadan başlamaz.
- Hareketler `pending`, `completed`, `undone` veya `failed` durumuyla günlüğe yazılır.
- Renderer doğrudan Node.js erişimi almaz (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`).
- Pano görselleri buluta yüklenmez; yalnızca yerel kullanıcı verisinde tutulur.

Güvenlik açığı bildirmek için [SECURITY.md](SECURITY.md) dosyasını okuyun.

## Kaynaktan çalıştırma

Gereksinimler: Node.js 20+ ve Windows.

```bash
npm ci
npm run dev
```

Kalite kontrolleri:

```bash
npm run typecheck
npm test
npm run build
```

Ana teknoloji yığını: Electron 31, React 18, TypeScript 5.5, Vite 5 ve Tailwind CSS 3.

## Katkı

Hata bildirmeden veya değişiklik göndermeden önce [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını inceleyin. Projenin dosya güvenliği kuralları davranış değişikliklerinde korunmalıdır.

## Lisans

[MIT Lisansı](LICENSE) © mertpivvo
