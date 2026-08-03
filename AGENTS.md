# AGENTS

Bu dosya Raflume üzerinde çalışan bütün ajanlar için kalıcı proje sözleşmesidir. Önemli özellik, davranış, mimari veya güvenlik değişikliğinde bu dosya ile `CHANGELOG.md` aynı sürüm içinde güncellenmelidir. Küçük biçimlendirme değişiklikleri için gereksiz kayıt şişirme.

## Teslim kontrolü

Her teslimden önce sırasıyla çalıştır:

```bash
npm run typecheck
npm test
npm run build
```

Teslim ZIP'i oluşturulduktan sonra ayrı klasöre çıkarıp aynı üç kontrolü yeniden çalıştır. Başarısız kontrolü gizleme veya işi tamamlanmış gösterme.

## Mimari

- `src/main`: Electron main process; controller, watcher, organizer, hareket günlüğü, tray, pencere ve IPC modülleri ayrı kalır.
- `src/preload`: yalnızca izin verilen `contextBridge` API'si.
- `src/renderer`: React arayüzü ve proje içine kopyalanmış UI bileşenleri.
- `src/shared`: ortak tipler, IPC sabitleri ve saf/test edilebilir kurallar.
- `tests`: Node test runner ve gerçek geçici klasör entegrasyon testleri.
- TypeScript strict mode, `contextIsolation: true` ve `nodeIntegration: false` korunur.
- `any` kullanma. Yeni IPC kanalını yalnızca `src/shared/ipc-channels.ts` içinde tanımla.

## Dosya güvenliği

- Dosya veya klasör silme davranışı ekleme.
- `overwrite: true` kullanma.
- Hedef doluysa çakışmasız yeni isim üret; geri almada eski konum doluysa işlemi durdur.
- Her hareketten önce `pending` kayıt yaz, taşıma bitince `completed` yap.
- Manuel düzenlemeyi önizleme ve kullanıcı onayı olmadan başlatma.
- Geri alma son tamamlanmış işlem grubunun tamamını kapsar.
- Raflume raf klasörleri, geçici indirme dosyaları ve korunan Windows sistem öğeleri taşınmaz.
- Klasör ve kısayol taşıma yalnızca ilgili ayarlar açıksa çalışır.
- Kullanıcı masaüstüne ek olarak Windows `Public Desktop` taranabilir; ortak öğelerin hedefi kullanıcının kendi masaüstü raflarıdır. Yetki hatasında dosyaya zarar verme, hatayı günlüğe yaz.
- Windows kilit hatalarında yalnızca sınırlı yeniden deneme yap; sonsuz döngü kurma.

## Otomatik düzenleme

- Anahtar ilk tıklamada arayüzde anında durum değiştirmelidir.
- Mevcut öğe taraması açıksa otomatik mod etkinleştikten 1 saniye sonra arka planda başlar; UI yanıtını bekletmez.
- Otomatik mod kapanırsa planlanan taramayı iptal et.
- Yeni dosya/klasör yazımı tamamlanmadan taşıma yapma.
- Desteklenmeyen öğeyi “taşındı” diye bildirme.

## Arayüz

- Ana uygulamada tek arayüz düzeni vardır; eski Stüdyo/Komuta modlarını geri ekleme.
- Sekiz renk seçeneği sol menü yüzeyi, üst içerik ambient ışığı, aktif durumlar ve kontrollerde görünür bir ürün atmosferi oluşturur. Temayı yalnızca küçük buton vurgularına indirgeme.
- Ana metin renkleri nötr, opak ve temadan bağımsız kalır; metin renklenmesini düzeltirken tema atmosferini veya renkli yüzeyleri kaldırma.
- Ana arayüz yazı tipleri: Segoe UI Variable, Verdana, Tahoma, Arial ve Georgia. Bahnschrift geri eklenmemelidir.
- Genel Bakış ve Geçmiş ekranları yaklaşık %20 büyütülmüş tipografi kullanır; bu okunabilirlik ölçeğini sessizce geri düşürme.
- Açıklama ve metaveri renkleri yarı saydam tema renkleri yerine opak nötr tokenlardan gelmelidir.
- Widget ana uygulamadan bağımsızdır: 3 tasarım, 8 renk, 5 yazı tipi ve kalıcı boyut/saydamlık ayarları korunur.
- Widget ayarları, Ayarlar ekranında ana arayüz görünüm ayarlarından sonra gelir.
- Kullanıcı dosyanın algılandığını, taşınıp taşınmadığını, nereye gittiğini ve hata nedenini görebilmelidir.
- Kullanıcının onayladığı kategori ikon seti korunmalı; Belgeler, Görseller, Arşivler, Klasörler, Kısayollar ve genel dosya fallback görselleri sebepsiz yere eski jenerik SVG setine döndürülmemelidir.
- Kısayol öğeleri mümkün olduğunda gerçek sistem dosya ikonu ile gösterilmeli; özel hedef ikonu olan `.lnk` öğelerini tekrar jenerik dosya simgesine düşürme.
- Otomatik taşınan son algılanan öğelerin yol bilgisini hedef rafa eşlemeyi koru; `Aç` ve `Konumunu göster` eylemleri taşımadan sonra boşa düşmemelidir.
- Türkçe ve İngilizce metinleri birlikte güncelle.

## Pano geçmişi

- En fazla 12 görsel saklanır ve yalnızca yerel kullanıcı verisi klasöründe tutulur.
- Toplu temizleme hem index kaydını hem yerel PNG dosyalarını kaldırır ve UI snapshot'ını yeniler.
- Native clipboard addon ekleme; dosya yolu için Electron `FileNameW`, görseller için yerleşik `clipboard` API'si kullan.

## Yapma

- Kullanıcı istemeden commit/push yapma.
- Yeni bağımlılık eklemeden önce mevcut `package.json` ve komşu kodu kontrol et.
- Gizli anahtar, token veya kullanıcıya özel sabit yol ekleme.
- `node_modules`, `dist` veya `dist-electron` içindeki üretilmiş kodu elle düzenleme.
- `CHANGELOG.md` ve bu dosyayı sürüm davranışıyla çelişkili bırakma.
