# Changelog

## 1.6.5

- Windows masaüstü katmanında çalışan widget'ın şeffaf dış boşluğunda görünen siyah dikdörtgen kaldırıldı.
- Widget artık tasarımına uygun yerel Windows yuvarlatılmış pencere bölgesi kullanır; yeniden boyutlandırma ve tasarım değişikliğinde bu bölge yenilenir.
- Paketlenmiş sürümlerde masaüstü yardımcısının `app.asar.unpacked` içinden güvenli biçimde çalışması sağlandı.

## 1.6.4

- Proje köküne, uygulama ikonunu kullanan ve `run.bat` üzerinden konsol göstermeden Raflume'u açan küçük `Raflume.exe` görev çubuğu launcher'ı eklendi.
- Masaüstü widget'ı gerçek Windows masaüstü ikon katmanına bağlanır; `Masaüstünü göster` / `Win + D` sırasında görünür kalırken normal uygulama pencerelerinin altında kalır.
- Otomatik mod ve mevcut öğe taraması açıkken uygulama başlangıcında Masaüstü ile İndirilenler kökü yeniden taranır; sonradan etkinleştirilen radar kaynağı da aynı güvenli telafi taramasını başlatır.
- Widget raf satırındaki son öğe adı artık dosyanın veya klasörün kendisini açar; ayrı klasör düğmesi raf klasörünü açmaya devam eder.
- Son öğenin tam yolunu, başlangıç tarama kararlarını ve radar etkinleştirme davranışını denetleyen regresyon testleri eklendi.
- `AGENTS.md`, Türkçe/İngilizce arayüz açıklamaları ve uygulama sürüm bilgisi 1.6.4 davranışına göre güncellendi.

## 1.6.3

- Kullanıcının sağladığı yeni ikon seti Belgeler, Görseller, Arşivler, Klasörler, Kısayollar ve genel dosya fallback görsellerine entegre edildi.
- Sol üst marka işareti yeni raf simgesine güncellendi; ikon ailesi uygulama genelinde daha tutarlı hale getirildi.
- Kısayol öğeleri artık mümkün olduğunda Electron `app.getFileIcon()` üzerinden gerçek Windows dosya ikonunu gösterir; özel hedef ikonu olan `.lnk` dosyaları listede ve canlı akışta doğru küçük resimle görünür.
- Otomatik taşınan son algılanan öğelerin izlenen yolu hedef rafa yeniden eşlenir; `Aç` ve `Konumunu göster` düğmeleri taşımadan sonra boşa düşmez.
- Bir öğe artık yerinde değilse `Konumunu göster` çağrısı sessizce kapanmak yerine üst klasörü açarak yedek davranış uygular.
- `AGENTS.md`, `README.md` ve uygulama sürüm bilgisi 1.6.3 davranışına göre güncellendi.

## 1.6.2

- Genel Bakış ve Geçmiş ekranlarındaki başlık, gövde, açıklama, rozet ve metaveri yazıları yaklaşık %20 büyütüldü.
- İkincil ve soluk metin renkleri daha parlak, opak nötr değerlere taşınarak koyu temadaki okunabilirlik artırıldı.
- Bahnschrift hem ana arayüz hem widget yazı tipi seçeneklerinden kaldırıldı; eski Bahnschrift tercihleri güvenli biçimde Segoe UI Variable'a döner.
- Ana arayüz yazı tipi seçenekleri Segoe UI Variable, Verdana, Tahoma, Arial ve Georgia olarak beşe çıkarıldı.
- Widget yazı tipi listesinde Bahnschrift yerine Arial eklendi; toplam beş seçenek korundu.
- Tipografi ölçeği, font listesi ve metin kontrastı için regresyon testleri eklendi.
- `AGENTS.md`, `README.md` ve uygulama sürüm bilgisi 1.6.2 davranışına göre güncellendi.

## 1.6.1

- Vurgu temasının v1.6.0'da gereğinden fazla azaltılan ana arayüz atmosferi geri getirildi.
- Seçilen renk yeniden sol menü yüzeyine, üst içerik bölgesindeki kontrollü ambient parlamaya ve aktif navigasyon yüzeyine yansıyor.
- Birincil, ikincil ve soluk metin renkleri opak nötr değerlerde kalmaya devam ediyor; tema rengi metinlere karışmıyor.
- Tema ve görünüm seçimlerinin aktif durumu seçilen renkle yeniden görünür hale getirildi.
- Tema atmosferi ile nötr metinlerin birlikte korunmasını denetleyen regresyon testi eklendi.
- `AGENTS.md`, `README.md` ve uygulama sürüm bilgisi 1.6.1 davranışına göre güncellendi.

## 1.6.0

- Otomatik düzenleme anahtarı iyimser arayüz güncellemesiyle ilk tıklamada görünür biçimde açılır; mevcut öğe taraması arayüzü kilitlemeden 1 saniye sonra çalışır.
- Windows ortak masaüstü (`Public Desktop`) tarama ve izleme kapsamına alındı; ortak öğeler kullanıcının kendi masaüstü raflarına yönlendirilir.
- Geçici Windows dosya kilitlerinde taşıma işlemi sınırlı ve loglanan yeniden denemeler yapar.
- Kısayol desteği `.pif`, `.scf` ve `.appref-ms` türlerini kapsayacak şekilde genişletildi.
- `desktop.ini`, `Thumbs.db` ve benzeri korunan sistem öğeleri tarama, listeleme ve taşıma dışında bırakıldı.
- Pano görsel geçmişine tüm kayıtları ve yerel PNG dosyalarını temizleyen çöp düğmesi eklendi.
- Stüdyo ve Komuta ana arayüz modları kaldırıldı; tek, tutarlı ana arayüz ve ilgili tek ayar modeli korundu.
- Ana arayüz için Segoe UI Variable, Bahnschrift ve Verdana yazı tipi seçenekleri eklendi.
- Sekiz vurgu renginin metinleri boyaması engellendi; birincil, ikincil ve soluk metinler opak nötr renk değişkenlerine taşındı.
- Ana görünüm ayarları widget ayarlarının üstüne alındı; widget'ın 3 tasarım, 8 renk ve 5 yazı tipi ayarı bağımsız kaldı.
- Sol menü vurgusu ve köşe parlaması hafifletildi; dosya yolları, tablo metaları ve işlem hatalarının kontrastı yükseltildi.
- Eski arayüz modlarına ait ölü CSS ve ayar alanları temizlendi.
- Ortak masaüstü hedef yönlendirmesi dahil entegrasyon testleri genişletildi.
- `AGENTS.md`, `README.md`, paket sürümü ve geliştirme kuralları 1.6.0 davranışına göre güncellendi.

## 1.5.0

- Widget yazı tipi listesindeki tekrarlanan Segoe UI ve Trebuchet MS kaldırıldı; Verdana ve Georgia eklendi.
- Ana uygulamadaki üç arayüz modu yapısal olarak ayrıştırıldı: Odak, Stüdyo ve Komuta.
- Stüdyo düzenine sağ durum sütunu ve editoryal iki kolon; Komuta düzenine üst navigasyon ve yoğun tablo ritmi eklendi.
- Dosyalar ekranına ad/yol/uzantı araması ile kaynak ve kategori filtreleri eklendi.
- Dosya satırları sıkılaştırıldı; tam klasör yollarının kontrastı yükseltildi.
- `.py`, `.json`, `.lnk`, `.ts`, `.css` ve benzeri türler için semantik dosya glifleri eklendi.
- `Diğer` rozet duvarı kaldırıldı; bilinmeyen dosyalarda uzantı etiketi gösteriliyor.
- İşlem günlüğü tarih bölümlerine ayrıldı ve yollar daha okunur hale getirildi.
- Boş raflar büyük kartlar yerine kompakt boş-raf şeridine taşındı.
- Sol navigasyondaki büyük aktif kapsül, ince vurgu çizgisi ve sakin yüzeyle değiştirildi.
- Ayarlardaki arayüz önizlemeleri gerçek yapı farklarını gösterecek şekilde yeniden çizildi.

## 1.4.0

- Otomatik mod açılırken Masaüstü ve İndirilenler kökündeki mevcut desteklenen öğeleri tarama seçeneği eklendi.
- Klasörleri `Klasörler` rafına taşıma kuralı eklendi; varsayılan olarak kapalıdır.
- `.lnk`, `.url` ve `.website` kısayollarını `Kısayollar` rafına taşıma kuralı eklendi; varsayılan olarak kapalıdır.
- Klasör kopyalama tamamlanmadan taşımayı önleyen kararlılık kontrolü eklendi.
- Klasörler ve Kısayollar rafları ana arayüzde ve masaüstü widget'ında gösteriliyor.
- Widget için birbirinden bağımsız 3 görsel tasarım, 8 renk paleti ve 5 yazı tipi eklendi.
- Widget tipografisinin boyutu ve kontrastı artırıldı.
- Otomatik düzenleme kartı etkin dosya/klasör/kısayol kurallarını doğrudan gösteriyor.
- Dosya odaklı işlem metinleri klasör ve kısayolları kapsayacak şekilde “öğe” diline geçirildi.
- Mevcut öğe taraması, klasör/kısayol taşıma ve toplu geri alma için testler eklendi.

## 1.3.0

- Masaüstü widget'ı serbestçe yeniden boyutlandırılabilir hale getirildi; boyut kalıcı olarak saklanıyor.
- Widget'ın siyah pencere zemini kaldırıldı, gerçek saydam/acrylic yüzey ve üç cam yoğunluğu eklendi.
- Widget içindeki iki tekrar eden raf gridi Masaüstü/İndirilenler sekmelerine dönüştürüldü.
- Ana ekran pazarlama dashboard'u yerine canlı durum, tek raf grid'i ve etkinlik rayı olarak yeniden tasarlandı.
- Renkli 3D klasör ikonları kaldırıldı; tek optik ağırlıkta, düşük doygunluklu özel Raflume ikon sistemi eklendi.
- Yeni, küçük boyutta ayırt edilebilir görev çubuğu ve tray ikonları üretildi.
- `Windows FileNameW` gibi debug metinleri kullanıcı arayüzünden kaldırıldı.
- Print Screen ve kopyalanan görseller için yerel, 12 kayıtla sınırlı pano görsel geçmişi eklendi.
- Pano görsellerini yeniden panoya kopyalama ve Resimler klasörüne kaydetme eklendi.
- Pano görsel geçmişi Ayarlar'dan kapatılabilir hale getirildi.
- `by mertpivvo` ana dashboard ve widget'tan kaldırılıp Hakkında/MIT bölümünde tutuldu.
- Widget boyutu ve saydamlığı için sınır testleri eklendi.

## 1.2.0

- Ürün adı Raflume olarak yenilendi.
- Windows görev çubuğu için özel ICO ve tray ikonu eklendi.
- Masaüstünde ayrı çalışan saydam raf widget'ı eklendi.
- Masaüstü ve İndirilenler rafları ayrı bölümlere ayrıldı.
- 8 renk kimliği ve 3 arayüz düzeni eklendi.
