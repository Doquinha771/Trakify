# Trakify

Player musical mobile-first para GitHub Pages. A versão 1.6 prioriza os arquivos individuais do **Google Drive** e usa a **YouTube IFrame Player API** automaticamente quando o Drive não consegue entregar uma faixa.

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

## Reprodução híbrida

O Drive é sempre a fonte principal. Quando o fallback do YouTube é necessário, o vídeo incorporado fica visível:

- no celular, ele aparece no player em tela cheia;
- no desktop, aparece em um dock acima do player inferior;
- fechar o player em tela cheia no celular pausa o vídeo.

O app não extrai nem baixa áudio do YouTube: o fallback usa o player oficial.

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


## v1.6 — Drive First

O catálogo foi embutido no `index.html`, então o álbum não depende de `fetch()` para aparecer. Cada faixa tenta primeiro o arquivo individual do Google Drive. O player testa rotas públicas alternativas do próprio Drive e, se elas forem bloqueadas, expirarem ou demorarem demais, muda automaticamente para o trecho correspondente no YouTube. Foram preservados os 22 IDs já cadastrados.

Para o Drive funcionar, cada arquivo precisa estar em **Qualquer pessoa com o link**, sem exigir login, e permitir download. Arquivos que excederem a cota pública do Google, estiverem bloqueados por política ou usarem um codec incompatível com o navegador cairão no YouTube automaticamente.

## Cache de áudio recomendado

O arquivo `worker/drive-cache-worker.js` contém um Worker pronto para colocar o áudio atrás de cache, aceitar pedidos parciais do player e evitar CORS. Depois de publicar o Worker, copie a URL dele para `driveProxyBase` no fim do `index.html`:

```html
<script>window.TRAKIFY_CONFIG = { driveProxyBase: "https://SEU-WORKER.workers.dev" };</script>
```

Ordem de reprodução: **Worker com cache → Drive direto → YouTube**. Configure no Worker a variável `SITE_ORIGIN` com a origem do seu GitHub Pages para restringir o acesso; durante testes, o valor padrão aceita qualquer origem.
