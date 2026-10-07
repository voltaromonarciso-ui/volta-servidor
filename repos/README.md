# Repositorios de skills y herramientas

Los repos completos están como **submódulos git** (clon superficial, `--depth 1`) para no inflar este repo.
Las carpetas/archivos sueltos que eran enlaces a subrutas están copiados en `extractos/`.

## Descargar el contenido de los submódulos

```bash
git clone --recurse-submodules --shallow-submodules https://github.com/voltaromonarciso-ui/volta-servidor.git
# o, si ya tienes el repo clonado:
git submodule update --init --depth 1
# solo uno concreto (p. ej. superpowers):
git submodule update --init --depth 1 repos/superpowers
# actualizar todos a la última versión:
git submodule update --remote --depth 1
```

> `supabase` (~800 MB) y `playwright` son grandes; descárgalos solo si los necesitas.

## Submódulos (`repos/`)

| Carpeta | Origen |
|---|---|
| emilkowalski-skills | https://github.com/emilkowalski/skills |
| claude-code-skills | https://github.com/daymade/claude-code-skills |
| superpowers | https://github.com/obra/superpowers |
| everything-claude-code | https://github.com/WorldFlowAI/everything-claude-code |
| claude-token-efficient | https://github.com/drona23/claude-token-efficient |
| claude-seo | https://github.com/AgriciDaniel/claude-seo |
| agent-browser | https://github.com/vercel-labs/agent-browser |
| prompt-master | https://github.com/nidhinjs/prompt-master |
| graphify | https://github.com/Graphify-Labs/graphify |
| gstack | https://github.com/garrytan/gstack |
| ponytail | https://github.com/DietrichGebert/ponytail |
| strix | https://github.com/usestrix/strix |
| ECC | https://github.com/affaan-m/ECC |
| ui-ux-pro-max-skill | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill |
| codegraph | https://github.com/colbymchenry/codegraph |
| claude-mem | https://github.com/thedotmack/claude-mem |
| headroom | https://github.com/headroomlabs-ai/headroom |
| playwright | https://github.com/microsoft/playwright |
| supabase | https://github.com/supabase/supabase |
| scroll-world | https://github.com/oso95/scroll-world |

## Extractos copiados (`repos/extractos/`)

| Carpeta | Origen |
|---|---|
| find-skills | vercel-labs/skills → `skills/find-skills` |
| mcp-builder | anthropics/skills → `skills/mcp-builder` |
| grill-me | mattpocock/skills → `skills/productivity/grill-me` |
| claude-code-setup | anthropics/claude-plugins-official → `plugins/claude-code-setup` |
| everything-claude-code-es | giovanisp/everything-claude-code → `docs/es` |

Cada extracto conserva la licencia de su repositorio original.
