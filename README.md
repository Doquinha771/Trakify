# Trakify v1.9 Local

Versão temporária do Trakify feita para GitHub Pages com reprodução **exclusivamente por arquivos MP3 locais do próprio repositório**.

## Reprodução

- Fonte única: `assets/audio/*.mp3`
- Sem Google Drive como fonte ou fallback de áudio
- Sem YouTube como fonte ou fallback de áudio
- Player HTML5 nativo com Media Session para controles do sistema quando o navegador oferecer suporte
- Controle de volume no desktop, player mobile e tela de reprodução

Os identificadores do YouTube ainda podem existir apenas como referência visual para thumbnails. Eles **não participam da reprodução de áudio**.

## GitHub Pages

Envie o conteúdo desta pasta para a raiz do repositório e habilite GitHub Pages apontando para a branch publicada. Os caminhos das músicas são relativos, então funcionam também em URLs do tipo `usuario.github.io/repositorio/`.

> Observação: o GitHub bloqueia arquivos individuais maiores que 100 MB. As faixas desta versão ficam muito abaixo desse limite. O repositório completo ainda precisa respeitar os limites e políticas do GitHub.

## Biblioteca

A configuração principal fica em `data/library.json`. Cada faixa precisa possuir `localFile`, por exemplo:

```json
{
  "title": "Good Morning",
  "artist": "IcyCity",
  "localFile": "assets/audio/good-morning.mp3"
}
```

## Validação

```bash
python scripts/validate.py
```

O script confere a estrutura da biblioteca e se todos os MP3 locais referenciados realmente existem.
