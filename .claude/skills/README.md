# Skills del proyecto Volta

**88 skills activas**, elegidas por su aporte a Volta. Cubren el stack del proyecto (app web en un solo HTML, PWA,
Node/Express, PostgreSQL y Redis, Playwright) y sus objetivos: diseño, animación, rendimiento, seguridad, idiomas y
competición sin trampas. Claude Code las carga al abrir una sesión en este repo.

Las otras **489** (Laravel, Django, Rust, Swift, salud, homelab, cripto, 30 de SEO, herramientas internas de
Supabase…) están en `.claude/skills-archivo/`. No se cargan, así que no ocupan contexto ni retrasan el trabajo.
Para recuperar una: `git mv .claude/skills-archivo/<nombre> .claude/skills/`.

Cada carpeta conserva la licencia de su repositorio. `.origen.json` indica de qué ruta exacta viene cada una.

## Activas por área

| Área | Skills |
|---|---|
| Diseño, UI/UX | `ui-ux-pro-max`, `ui-designer`, `ui-styling`, `design-system`, `design`, `frontend-design`¹, `web-design-guidelines`², `make-interfaces-feel-better`, `taste`, `taste-application`, `emil-design-eng`, `frontend-design-direction`, `frontend-patterns`, `frontend-visual-qa`, `interaction-design-board`, `break-ui`, `theme-factory`¹, `writing-guidelines`² |
| Accesibilidad | `accessibility`, `frontend-a11y` |
| Animación | `animate`, `motion-foundations`, `motion-patterns`, `motion-advanced`, `improve-animations`, `review-animations`, `find-animation-opportunities`, `animation-vocabulary` |
| Rendimiento y calidad web | `web-quality-audit`³, `core-web-vitals`³, `performance`³, `best-practices`³, `benchmark` |
| Pruebas | `webapp-testing`¹, `playwright-cli`, `playwright-dev`, `playwright-trace`, `playwright-triage`, `playwright-test-results`, `e2e-testing`, `browser-qa`, `qa-expert`, `click-path-audit`, `agent-browser`, `agent-browser-core`, `agent-browser-dogfood`, `ai-regression-testing`, `property-based-testing`⁴, `tdd-workflow`, `test-driven-development`, `verification-loop`, `verification-before-completion` |
| Backend y despliegue | `backend-patterns`, `api-design`, `postgres-patterns`, `redis-patterns`, `database-migrations`, `deployment-patterns`, `docker-patterns`, `error-handling` |
| Seguridad | `security-review`, `security-scan`, `differential-review`⁴, `owasp-top-10-testing`, `api-security-testing`, `application-security-testing`, `find-security-vulnerabilities-in-code`, `git-safety-net` |
| Idiomas | `i18n-expert`, `i18n-sync` |
| Producto | `product-lens`, `competitors-analysis` |
| Propias de Volta | `volta-imagenes-ejercicios`: genera las imágenes de los ejercicios con el estilo del «Press de banca» (Gemini) y las mete en la app |
| Método de trabajo | `brainstorming`, `writing-plans`, `executing-plans`, `systematic-debugging`, `requesting-code-review`, `receiving-code-review`, `finishing-a-development-branch`, `git-workflow`, `coding-standards`, `search-first`, `dispatching-parallel-agents`, `subagent-driven-development`, `using-superpowers`, `strategic-compact`, `context-budget` |

**Nuevas desde GitHub:**
¹ [anthropics/skills](https://github.com/anthropics/skills) (Apache-2.0) ·
² [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (MIT) ·
³ [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) (MIT) ·
⁴ [trailofbits/skills](https://github.com/trailofbits/skills) (CC BY-SA 4.0)

El resto proceden de affaan-m/ECC, daymade/claude-code-skills, obra/superpowers, emilkowalski/skills,
vercel-labs/agent-browser y microsoft/playwright (ver `.origen.json`).

## Cuándo usar cada nueva

- `web-quality-audit` / `performance` / `core-web-vitals`: la app pesa unos 3 MB. Sirven para medir y bajar el tiempo de carga.
- `best-practices`: revisión de buenas prácticas web (HTTPS, CSP, APIs obsoletas…).
- `web-design-guidelines`: repaso de la interfaz contra reglas de diseño web probadas.
- `writing-guidelines`: textos de botones, avisos y mensajes de error claros.
- `frontend-design` / `theme-factory`: pantallas nuevas y temas de color con identidad propia.
- `webapp-testing`: pruebas en navegador de la app real con Playwright.
- `property-based-testing`: someter `src/lib/score.js` (puntuación y antitrampas) a miles de casos aleatorios.
- `differential-review`: revisión de seguridad de cada cambio antes de publicarlo.
