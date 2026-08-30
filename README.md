# Trakify

Player musical mobile-first para GitHub Pages.

## v1.8 — áudio local e mobile

Esta versão usa a seguinte ordem de reprodução:

1. **MP3 local em `assets/audio/`** — fonte principal, rápida e estável no GitHub Pages.
2. **Google Drive** — fallback caso um arquivo local esteja ausente ou falhe.
3. **YouTube** — mantido apenas como referência dos discos/thumbnails. O player incorporado e o popout foram removidos.

As 22 faixas de **Graduation (Ultimate Edition)** foram compactadas de 192 kbps para 128 kbps, mantendo MP3, estéreo e 44,1 kHz. O conjunto caiu de aproximadamente 128 MiB para cerca de 85 MiB.

## Mobile / segundo plano

O player usa `<audio>` nativo, Media Session API e, quando disponível, Audio Session API em modo `playback`. Isso melhora reprodução com a tela bloqueada, troca de aplicativo, controles da tela de bloqueio e fones de ouvido.

Também foi adicionado `manifest.webmanifest`, suporte a instalação como PWA e um Service Worker para o shell do app.

> Navegadores e sistemas móveis ainda podem interromper qualquer site por economia extrema de bateria, encerramento manual do navegador ou políticas do próprio sistema. O Trakify não pausa a música por conta própria ao perder foco.

## Volume no celular

- Botão de volume no mini-player.
- Slider de volume dentro do player em tela cheia.
- Volume salvo no navegador.
- Toque no botão do mini-player alterna entre mudo e o último volume usado.

Em aparelhos que deixam o volume exclusivamente sob controle físico do sistema, o navegador pode limitar alterações programáticas.

## Biblioteca

A configuração fica em `data/library.json`. Cada faixa possui `localFile` e, opcionalmente, `driveFile` e informação do vídeo de referência.

## Rodar localmente

```bash
python -m http.server 8000
```

Abra `http://127.0.0.1:8000`.

## Validação

```bash
python scripts/validate.py
```

O validador confere catálogo e presença de todos os MP3 locais.

## GitHub Pages

1. Envie os arquivos para o repositório.
2. Abra **Settings → Pages**.
3. Escolha **Deploy from a branch**.
4. Selecione `main` e `/ (root)`.

Nenhum arquivo individual desta versão chega perto do limite de 100 MB do GitHub.

## Drive opcional

O arquivo `worker/drive-cache-worker.js` continua disponível caso você queira usar um Worker como cache do Drive. Configure `driveProxyBase` no fim do `index.html` se publicar esse Worker.
