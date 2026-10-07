# Skills del proyecto Volta

Claude Code carga automáticamente estas skills al abrir una sesión en este repo.
Copiadas desde los repos de `repos/` (cada carpeta conserva su LICENSE original).

| Skill | Para qué en Volta | Origen |
|---|---|---|
| brainstorming | Pensar una función nueva antes de programarla | obra/superpowers |
| writing-plans · executing-plans | Plan por pasos y ejecución de tareas grandes | obra/superpowers |
| systematic-debugging | Encontrar la causa real de un bug | obra/superpowers |
| test-driven-development | Escribir el test antes del código | obra/superpowers |
| verification-before-completion | Comprobar antes de dar algo por terminado | obra/superpowers |
| grill-me | Que te interroguen a fondo sobre un plan o diseño | mattpocock/skills |
| find-skills | Buscar e instalar más skills | vercel-labs/skills |
| backend-patterns | Express/Node: rutas, middleware, acceso a datos | affaan-m/ECC |
| api-design | Endpoints REST, códigos de estado, paginación, rate limit | affaan-m/ECC |
| postgres-patterns | Esquema, índices y RLS en PostgreSQL/Supabase | affaan-m/ECC |
| security-review | Auth JWT, entrada de usuario, secretos | affaan-m/ECC |
| e2e-testing | Tests de extremo a extremo con Playwright | affaan-m/ECC |
| frontend-a11y | Accesibilidad de formularios, modales, navegación | affaan-m/ECC |
| ui-ux-pro-max | Estilos, paletas, tipografía y UX (usa `python3`) | nextlevelbuilder/ui-ux-pro-max-skill |
| emil-design-eng | Pulido de UI y detalles de interacción | emilkowalski/skills |
| improve-animations | Auditar y mejorar las animaciones | emilkowalski/skills |

Cambios respecto al original: en `ui-ux-pro-max` las rutas `${CLAUDE_PLUGIN_ROOT}/.claude/skills/...`
pasan a `.claude/skills/...`, y en las de superpowers se quitó el prefijo `superpowers:` de las referencias.
