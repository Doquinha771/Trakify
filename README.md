# Trakify

Player musical mobile-first para GitHub Pages. A versão 1.4 usa o **YouTube IFrame Player API** como fonte de reprodução: cada disco aponta para um vídeo longo e cada faixa define apenas o segundo em que começa.

## Graduation (Ultimate Edition)

- Disco 1: `Of7dmQrpoEo`
- Disco 2: `VLwlI7HSdrY`
- 22 faixas no total.
- Capa e banner continuam configurados pelos IDs do Google Drive.
- Se o Drive não entregar as imagens, o Trakify usa a thumbnail do vídeo do YouTube como fallback.

## Biblioteca

A configuração fica em `data/library.json`:

```json
{
  "albums": [
    {
      "id": "graduation-ultimate-edition",
      "title": "Graduation (Ultimate Edition)",
      "cover": "ID_DA_CAPA_NO_DRIVE",
      "banner": "ID_DO_BANNER_NO_DRIVE",
      "discs": [
        {
          "title": "Disco 1",
          "youtube": "Of7dmQrpoEo",
          "tracks": [
            { "title": "Good Morning", "artist": "IcyCity", "start": 0 },
            { "title": "Champion", "artist": "IcyCity", "start": 259 }
          ]
        }
      ]
    }
  ]
}
```

O fim de uma faixa é calculado automaticamente pelo início da próxima. A última faixa de cada disco usa a duração real informada pelo player do YouTube.

## Player do YouTube

O vídeo incorporado permanece visível enquanto toca:

- no celular, ele aparece no player em tela cheia;
- no desktop, aparece em um dock acima do player inferior;
- fechar o player em tela cheia no celular pausa o vídeo.

Isso mantém a reprodução usando o player oficial do YouTube, em vez de extrair ou baixar o áudio.

## Rodar localmente

```bash
python -m http.server 8000
```

Abra `http://127.0.0.1:8000`.

A biblioteca também está embutida em `data/library.js`, então a interface consegue carregar o catálogo mesmo em ambientes que bloqueiem o `fetch()` local.

## Validação

```bash
python scripts/validate.py
```

## GitHub Pages

1. Faça push dos arquivos.
2. Abra **Settings → Pages**.
3. Escolha **Deploy from a branch**.
4. Selecione `main` e `/ (root)`.

## Ícones

A interface usa **Flaticon UIcons** via CDN. Mantenha a atribuição já presente no projeto conforme os termos aplicáveis ao conjunto de ícones usado.

## Observação

A disponibilidade de reprodução depende de o vídeo permitir incorporação no YouTube. Se um vídeo bloquear embeds, o Trakify mostra um botão para abrir aquela faixa diretamente no YouTube.


## v1.5 — Hybrid

O catálogo foi embutido no `index.html`, então o álbum não depende de `fetch()` para aparecer. Cada faixa tenta o YouTube primeiro e, se o embed/API falhar, usa o arquivo individual do Google Drive como fallback. Foram preservados os 22 IDs de Drive já cadastrados. O Drive precisa manter os arquivos em `Qualquer pessoa com o link` e com download permitido.
