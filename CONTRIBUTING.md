# Katkı / Contributing

Raflume'a katkı verdiğiniz için teşekkürler. Thank you for contributing to Raflume.

## Başlamadan önce / Before you start

- Hata ve özellik talepleri için uygun GitHub Issue şablonunu kullanın.
- Büyük davranış değişikliklerini kodlamadan önce bir Issue üzerinden tartışın.
- `AGENTS.md` içindeki mimari ve dosya güvenliği sözleşmesini okuyun.
- Use the matching GitHub Issue template for bugs and feature requests.
- Discuss large behavioral changes in an Issue before implementation.
- Read the architecture and file-safety contract in `AGENTS.md`.

## Geliştirme / Development

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Pull request'ler küçük ve odaklı olmalı; Türkçe ve İngilizce kullanıcı metinleri birlikte güncellenmelidir. Yeni davranışlar test edilmeli, önemli ürün değişiklikleri `CHANGELOG.md` ve `AGENTS.md` ile uyumlu tutulmalıdır.

Pull requests should stay small and focused. Update Turkish and English user-facing copy together, test new behavior, and keep significant product changes consistent with `CHANGELOG.md` and `AGENTS.md`.

## Değişmez güvenlik kuralları / Non-negotiable safety rules

- Dosya silme veya `overwrite: true` eklemeyin.
- Manuel düzenlemeyi önizleme ve onay olmadan başlatmayın.
- Hareket günlüğünü veya toplu geri almayı atlamayın.
- Renderer'a doğrudan Node.js erişimi vermeyin.
- Do not add file deletion or `overwrite: true`.
- Do not start manual organization without preview and approval.
- Do not bypass the movement journal or batch undo.
- Do not expose direct Node.js access to the renderer.
