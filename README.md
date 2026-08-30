# Trakify v2.0 — Local GitHub Pages

Versão temporária configurada para reproduzir exclusivamente os MP3 armazenados no próprio repositório.

## Publicação

Envie todo o conteúdo desta pasta para a raiz do repositório usado pelo GitHub Pages. Os arquivos de áudio precisam permanecer em `assets/audio/`.

## Estrutura de áudio

A biblioteca está em `data/library.json` e cada faixa possui apenas um caminho `localFile`. O player resolve esse caminho relativamente à URL do site, inclusive quando o projeto está publicado em um subdiretório do GitHub Pages.

## Atualização

O cache do PWA foi versionado novamente para substituir versões antigas do site. O Service Worker desta versão limpa caches anteriores, assume o controle e força a atualização das abas abertas quando a nova versão é ativada.
