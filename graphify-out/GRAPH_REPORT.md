# Graph Report - volta-servidor  (2026-10-18)

## Corpus Check
- 170 files · ~1,212,047 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 55 file(s) not represented in the graph (top: .glb 22, (none) 10, .xml 10)

## Summary
- 2077 nodes · 4699 edges · 107 communities (87 shown, 20 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `524ca581`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- addBox
- main.js
- Three.js Textures
- money.js
- Three.js Shaders
- objects.js
- Three.js Loaders
- gangs.js
- textures.js
- Three.js Interaction
- Common Effects
- AppDelegate
- Three.js Lighting
- dressing.js
- Three.js Animation
- Three.js Geometry
- Three.js Fundamentals
- Three.js Materials
- index.js
- Package.swift
- render.js
- forum.js
- CapApp-SPM/README.md
- juego/package.json
- human.js
- models.js
- cars.js
- Three.js Skills for Claude Code
- mock-server.js
- panels.js
- palm
- routes/auth.js
- common.sh
- db.js
- ws.js
- ExampleInstrumentedTest.java
- volta-api.js
- economy.js
- friends.js
- hud.js
- with_server.py
- Web Application Testing
- BLOQUE 9 · Puerto Lomas
- Encargo «Rooktown» (partes 1–4), recibido el 18-10-2026 — PENDIENTE
- Frontend Design
- Tasks: [FEATURE NAME]
- VOLTA · Backend social (Node.js + Express + PostgreSQL)
- moderation.js
- absNow
- com.getcapacitor.BridgeActivity
- CLAUDE.md
- .claude/CLAUDE.md
- speckit-analyze/SKILL.md
- generator_template.js
- Creation Log: Systematic Debugging Skill
- algorithmic-art/SKILL.md
- riding.js
- LEEME.md
- Root Cause Tracing
- Systematic Debugging
- world.js
- core.spec.js
- systems/staff.js
- Feature Specification: [FEATURE NAME]
- Defense-in-Depth Validation
- speckit-plan/SKILL.md
- speckit-specify/SKILL.md
- speckit-tasks/SKILL.md
- Core Principles
- Core Principles
- Verification Before Completion
- police.js
- Implementation Plan: [FEATURE]
- speckit-checklist/SKILL.md
- speckit-clarify/SKILL.md
- speckit-implement/SKILL.md
- Condition-Based Waiting
- Nav
- speckit-constitution/SKILL.md
- speckit-taskstoissues/SKILL.md
- Pressure Test 1: Emergency Production Fix
- Pressure Test 2: Sunk Cost + Exhaustion
- Pressure Test 3: Authority + Social Pressure
- [CHECKLIST TYPE] Checklist: [FEATURE NAME]
- find-polluter.sh
- test-academic.md
- props.js
- sky.js
- building
- three
- icons.js
- Execution Steps
- dependencies
- phone.js
- casino.js
- restoreBackup
- layout.js
- scripts

## God Nodes (most connected - your core abstractions)
1. `three` - 135 edges
2. `sfx` - 79 edges
3. `absNow()` - 46 edges
4. `save()` - 42 edges
5. `addBox()` - 40 edges
6. `ev()` - 39 edges
7. `money()` - 34 edges
8. `createWorld()` - 33 edges
9. `G` - 29 edges
10. `clamp()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `When to Use` --references--> `sleep()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → juego/src/systems/time.js
- `Dinero sucio y limpio (Bloque B, etapa 1): reglas` --references--> `load()`  [INFERRED]
  juego/docs/MOVIL.md → juego/src/core/state.js
- `Implementation` --references--> `waitForEvent()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → .claude/skills/systematic-debugging/condition-based-waiting-example.ts
- `Implementation` --references--> `waitForEventCount()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → .claude/skills/systematic-debugging/condition-based-waiting-example.ts
- `Implementation` --references--> `waitForEventMatch()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → .claude/skills/systematic-debugging/condition-based-waiting-example.ts

## Import Cycles
- None detected.

## Communities (107 total, 20 thin omitted)

### Community 0 - "addBox"
Cohesion: 0.15
Nodes (26): addBox(), bench(), billboard(), buildCommercial(), buildIndustrial(), buildNave(), buildPlaza(), buildStreetFurniture() (+18 more)

### Community 1 - "main.js"
Cohesion: 0.08
Nodes (41): pollInput(), hasSave(), load(), newState(), autoQuality(), boot(), camera, clerks (+33 more)

### Community 2 - "Three.js Textures"
Cohesion: 0.04
Nodes (44): Accessing UVs, Background Options, Basic Loading, Canvas Texture, Color Space, Compressed Textures, Cube Textures, CubeCamera (+36 more)

### Community 3 - "money.js"
Cohesion: 0.22
Nodes (17): ACCOUNTS, apply(), check(), ensure(), fail(), KEY_DAYS, KEY_MAX, keyUsed() (+9 more)

### Community 4 - "Three.js Shaders"
Cohesion: 0.06
Nodes (33): Common Injection Points, Common Material Properties, Common Shader Patterns, Debugging Shaders, Dissolve Effect, Extending Built-in Materials, External Shader Files, Fresnel Effect (+25 more)

### Community 5 - "objects.js"
Cohesion: 0.06
Nodes (58): ensureBaseProduct(), ray, target, updateInteract(), _v, actionsFor(), BUILD, bx (+50 more)

### Community 6 - "Three.js Loaders"
Cohesion: 0.06
Nodes (32): ArrayBuffer, Async/Promise Loading, Blob URL, Built-in Cache, Caching, CubeTextureLoader, Custom Asset Manager, Custom Path/URL (+24 more)

### Community 7 - "gangs.js"
Cohesion: 0.09
Nodes (29): amb, audioStatus(), BUF, files, initAudio(), loadSounds(), loopSrc(), play() (+21 more)

### Community 8 - "textures.js"
Cohesion: 0.08
Nodes (40): markerSprite(), randomLook(), Cop, hitGeo, hitMat, LEO_MODEL, NPC, prop() (+32 more)

### Community 9 - "Three.js Interaction"
Cohesion: 0.07
Nodes (29): Basic Raycasting, Box Selection, Camera Controls, Click to Select, DragControls, Efficient Raycasting, Event Handling Best Practices, FirstPersonControls (+21 more)

### Community 10 - "Common Effects"
Cohesion: 0.07
Nodes (28): Bloom (Glow), Chromatic Aberration, Color Correction, Combining Multiple Effects, Common Effects, Custom ShaderPass, Depth of Field (DOF), EffectComposer Setup (+20 more)

### Community 11 - "AppDelegate"
Cohesion: 0.13
Nodes (3): Capacitor, AppDelegate, UIKit

### Community 12 - "Three.js Lighting"
Cohesion: 0.07
Nodes (27): AmbientLight, Common Lighting Setups, Contact Shadows (Fake, Fast), Cube Texture Environment, DirectionalLight, DirectionalLight Shadows, Enable Shadows, Environment Lighting (IBL) (+19 more)

### Community 13 - "dressing.js"
Cohesion: 0.07
Nodes (58): INV_SIZE, BEARDS, CLOTHES, HAIR_COLORS, RECOG_MINUTES, RECOG_WEIGHTS, SLOTS, accMat() (+50 more)

### Community 14 - "Three.js Animation"
Cohesion: 0.07
Nodes (26): Additive Blending, Animating Morph Targets, Animation Blending, Animation System Overview, Animation Utilities, AnimationAction, AnimationClip, AnimationMixer (+18 more)

### Community 15 - "Three.js Geometry"
Cohesion: 0.07
Nodes (26): Advanced Shapes, Basic Shapes, BufferAttribute Types, BufferGeometry, Built-in Geometries, Center Geometry, Clone and Transform, Common Patterns (+18 more)

### Community 16 - "Three.js Fundamentals"
Cohesion: 0.08
Nodes (24): Cameras, Clock for Animation, Color, Common Patterns, Coordinate System, Core Classes, Euler, Group (+16 more)

### Community 17 - "Three.js Materials"
Cohesion: 0.08
Nodes (24): Built-in Uniforms (auto-provided), Car Paint Example, Common Material Properties, Environment Maps, Glass Material Example, LineBasicMaterial & LineDashedMaterial, Material Cloning and Modification, Material Types Overview (+16 more)

### Community 18 - "index.js"
Cohesion: 0.09
Nodes (24): description, engines, node, main, name, private, version, bcrypt (+16 more)

### Community 20 - "render.js"
Cohesion: 0.21
Nodes (11): buildWorld(), resize(), applyQuality(), buildComposer(), GradeShader, initRender(), _q, R (+3 more)

### Community 21 - "forum.js"
Cohesion: 0.13
Nodes (18): query(), tx(), config, { HttpError }, { pool }, postCooldown(), secondsLeft(), tooFast() (+10 more)

### Community 23 - "juego/package.json"
Cohesion: 0.08
Nodes (22): dependencies, @capacitor/android, @capacitor/core, @capacitor/ios, @capacitor/preferences, devDependencies, @capacitor/cli, @playwright/test (+14 more)

### Community 24 - "human.js"
Cohesion: 0.14
Nodes (17): G_, HAIRS, makeHuman(), h, markerTex, mat(), matCache, mesh() (+9 more)

### Community 26 - "models.js"
Cohesion: 0.11
Nodes (24): BONE, CLIPS, clipsFor(), files, findSkin(), loadModels(), makeRealHuman(), h (+16 more)

### Community 27 - "cars.js"
Cohesion: 0.07
Nodes (34): box, Car, carMat(), carMats, CROSSES, glassMat, glowMat(), glowMats (+26 more)

### Community 28 - "Three.js Skills for Claude Code"
Cohesion: 0.12
Nodes (15): Acknowledgments, Basic Scene Setup, Contributing, Custom Shaders, How It Works, Installation, License, Loading 3D Models (+7 more)

### Community 29 - "mock-server.js"
Cohesion: 0.16
Nodes (13): crypto, frame(), friends, hb, http, lastPost, posts, pub() (+5 more)

### Community 30 - "panels.js"
Cohesion: 0.17
Nodes (38): sfx, guardGhostClick(), resetTouch(), money(), demand(), resolveRobbery(), robberyDemand(), buyVehicle() (+30 more)

### Community 31 - "palm"
Cohesion: 0.18
Nodes (15): buildBeach(), buildMountains(), buildOutskirts(), buildResidential(), buildSkyline(), bush(), chainFence(), frondGeo() (+7 more)

### Community 32 - "routes/auth.js"
Cohesion: 0.14
Nodes (12): { ah, HttpError }, authLimiter, bcrypt, config, loginSchema, { query }, rateLimit, registerSchema (+4 more)

### Community 33 - "common.sh"
Cohesion: 0.11
Nodes (30): check-prerequisites.sh script, check_dir(), check_file(), find_specify_root(), format_speckit_command(), get_current_branch(), get_feature_paths(), get_invoke_separator() (+22 more)

### Community 34 - "db.js"
Cohesion: 0.17
Nodes (7): pg, fs, path, { pool }, config, config, { Pool }

### Community 35 - "ws.js"
Cohesion: 0.21
Nodes (13): ws, shutdown(), verify(), allowedOrigin(), attach(), broadcast(), close(), config (+5 more)

### Community 37 - "volta-api.js"
Cohesion: 0.27
Nodes (6): http(), login(), logout(), register(), respondFriend(), setToken()

### Community 38 - "economy.js"
Cohesion: 0.15
Nodes (36): productValue(), clamp(), pick(), styleBonus(), acceptChance(), addAddiction(), addRep(), addXP() (+28 more)

### Community 39 - "friends.js"
Cohesion: 0.10
Nodes (24): jsonwebtoken, zod, ah(), HttpError, config, { HttpError }, jwt, requireAuth() (+16 more)

### Community 40 - "hud.js"
Cohesion: 0.10
Nodes (26): EFFECTS, ITEMS, RANKS, SHOPS, STRAINS, G, listeners, on() (+18 more)

### Community 42 - "Web Application Testing"
Cohesion: 0.25
Nodes (7): Best Practices, Common Pitfall, Decision Tree: Choosing Your Approach, Example: Using with_server.py, Reconnaissance-Then-Action Pattern, Reference Files, Web Application Testing

### Community 43 - "BLOQUE 9 · Puerto Lomas"
Cohesion: 0.09
Nodes (21): 1. Motor y arquitectura, 2. Controles táctiles, 3. Pruebas automáticas (referencia del comportamiento actual), 4. Compilación, 5. Rendimiento en móvil (lo que ya hace el juego), Android — estado: proyecto listo, compilación BLOQUEADA en este entorno, Bloque 9 en Android e iPhone: estado real, Encargo maestro (18-10-2026): reglas nuevas (+13 more)

### Community 44 - "Encargo «Rooktown» (partes 1–4), recibido el 18-10-2026 — PENDIENTE"
Cohesion: 0.25
Nodes (7): Complemento — Rooktown: red urbana, callejones, NPC y cambio de nombre (18-10-2026), Decisiones previas que siguen vigentes, Encargo «Rooktown» (partes 1–4), recibido el 18-10-2026 — PENDIENTE, Parte 1 — Auditoría y progresión, Parte 2 — Gameplay, economía y propiedades, Parte 3 — Mapa, mundo 3D e interfaz, Parte 4 — Interacciones y armas

### Community 45 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 46 - "Tasks: [FEATURE NAME]"
Cohesion: 0.07
Nodes (26): Dependencies & Execution Order, Format: `[ID] [P?] [Story] Description`, Implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation Strategy, Incremental Delivery, MVP First (User Story 1 Only) (+18 more)

### Community 47 - "VOLTA · Backend social (Node.js + Express + PostgreSQL)"
Cohesion: 0.29
Nodes (6): 1. Puesta en marcha, 2. Endpoints, 3. Integración desde `index.html`, 4. Seguridad: lo que hay y lo que debes saber, 5. Integración ya hecha en `Volta-5.html`, VOLTA · Backend social (Node.js + Express + PostgreSQL)

### Community 49 - "moderation.js"
Cohesion: 0.70
Nodes (4): base(), hit(), username(), variants()

### Community 51 - "absNow"
Cohesion: 0.17
Nodes (27): Dinero sucio y limpio (Bloque B, etapa 1): reglas, absNow(), emit(), acceptDeal(), addMoney(), deadDropActions(), done(), earn() (+19 more)

### Community 61 - "speckit-analyze/SKILL.md"
Cohesion: 0.08
Nodes (25): 1. Initialize Analysis Context, 2. Load Artifacts (Progressive Disclosure), 3. Build Semantic Models, 4. Detection Passes (Token-Efficient Analysis), 5. Severity Assignment, 6. Produce Compact Analysis Report, 7. Provide Next Actions, 8. Offer Remediation (+17 more)

### Community 62 - "generator_template.js"
Cohesion: 0.11
Nodes (5): Entity, initializeSeed(), params, regenerate(), setup()

### Community 63 - "Creation Log: Systematic Debugging Skill"
Cohesion: 0.10
Nodes (19): Bulletproofing Elements, Creation Log: Systematic Debugging Skill, Enhancement 1: TDD Reference, Extraction Decisions, Final Outcome, Initial Version, Iterations, Key Insight (+11 more)

### Community 64 - "algorithmic-art/SKILL.md"
Cohesion: 0.11
Nodes (18): ALGORITHMIC PHILOSOPHY CREATION, CRAFTSMANSHIP REQUIREMENTS, CRITICAL: WHAT'S FIXED VS VARIABLE, DEDUCING THE CONCEPTUAL SEED, ESSENTIAL PRINCIPLES, HOW TO GENERATE AN ALGORITHMIC PHILOSOPHY, INTERACTIVE ARTIFACT CREATION, OUTPUT FORMAT (+10 more)

### Community 65 - "riding.js"
Cohesion: 0.11
Nodes (33): PARKING, RECOVER_PRICE, VEHICLES, bendPose(), clearPose(), buildBike(), buildScooter(), chrome() (+25 more)

### Community 68 - "Root Cause Tracing"
Cohesion: 0.12
Nodes (15): 1. Observe the Symptom, 2. Find Immediate Cause, 3. Ask: What Called This?, 4. Keep Tracing Up, 5. Find Original Trigger, Adding Stack Traces, Finding Which Test Causes Pollution, Key Principle (+7 more)

### Community 69 - "Systematic Debugging"
Cohesion: 0.12
Nodes (15): Common Rationalizations, Overview, Phase 1: Root Cause Investigation, Phase 2: Pattern Analysis, Phase 3: Hypothesis and Testing, Phase 4: Implementation, Quick Reference, Red Flags - STOP and Follow Process (+7 more)

### Community 70 - "world.js"
Cohesion: 0.09
Nodes (33): buildBoxes(), buildBulbs(), buildGround(), buildNav(), buildRoadDetails(), buildRoads(), buildTrafficLights(), cellKeys() (+25 more)

### Community 71 - "core.spec.js"
Cohesion: 0.11
Nodes (46): gl, _e, count(), slotOf(), advance(), at(), emp(), money() (+38 more)

### Community 72 - "systems/staff.js"
Cohesion: 0.09
Nodes (51): same(), save(), SAVE_VERSION, slotsAdd(), slotsCount(), slotsRemove(), slotsRoom(), takeSeed() (+43 more)

### Community 73 - "Feature Specification: [FEATURE NAME]"
Cohesion: 0.15
Nodes (12): Assumptions, Edge Cases, Feature Specification: [FEATURE NAME], Functional Requirements, Key Entities *(include if feature involves data)*, Measurable Outcomes, Requirements *(mandatory)*, Success Criteria *(mandatory)* (+4 more)

### Community 74 - "Defense-in-Depth Validation"
Cohesion: 0.17
Nodes (11): Applying the Pattern, Defense-in-Depth Validation, Example from Session, Key Insight, Layer 1: Entry Point Validation, Layer 2: Business Logic Validation, Layer 3: Environment Guards, Layer 4: Debug Instrumentation (+3 more)

### Community 75 - "speckit-plan/SKILL.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, Key rules, Mandatory Post-Execution Hooks, Outline, Phase 0: Outline & Research, Phase 1: Design & Contracts, Phases (+2 more)

### Community 76 - "speckit-specify/SKILL.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, For AI Generation, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, Quick Guidelines, Section Requirements (+2 more)

### Community 77 - "speckit-tasks/SKILL.md"
Cohesion: 0.18
Nodes (10): Checklist Format (REQUIRED), Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Phase Structure, Pre-Execution Checks, Task Generation Rules (+2 more)

### Community 78 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 79 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 80 - "Verification Before Completion"
Cohesion: 0.20
Nodes (9): Common Failures, Key Patterns, Overview, Rationalization Prevention, Red Flags - STOP, The Gate Function, The Iron Law, Verification Before Completion (+1 more)

### Community 81 - "police.js"
Cohesion: 0.20
Nodes (19): setSiren(), illegalCount(), CUSTOMER_LINES, GREETINGS, OFFICERS, STARTING_CUSTOMERS, recognition(), rememberIncident() (+11 more)

### Community 82 - "Implementation Plan: [FEATURE]"
Cohesion: 0.22
Nodes (8): Complexity Tracking, Constitution Check, Documentation (this feature), Implementation Plan: [FEATURE], Project Structure, Source Code (repository root), Summary, Technical Context

### Community 83 - "speckit-checklist/SKILL.md"
Cohesion: 0.25
Nodes (7): Anti-Examples: What NOT To Do, Checklist Purpose: "Unit Tests for English", Example Checklist Types & Sample Items, Execution Steps, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 84 - "speckit-clarify/SKILL.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 85 - "speckit-implement/SKILL.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 86 - "Condition-Based Waiting"
Cohesion: 0.16
Nodes (12): Common Mistakes, Condition-Based Waiting, Core Pattern, waitForEvent(), waitForEventCount(), waitForEventMatch(), Implementation, Overview (+4 more)

### Community 88 - "speckit-constitution/SKILL.md"
Cohesion: 0.33
Nodes (5): Outline, Post-Execution Checks, Pre-Execution Checks, Scope Guard, User Input

### Community 89 - "speckit-taskstoissues/SKILL.md"
Cohesion: 0.33
Nodes (5): Deprecation Notice, Outline, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 90 - "Pressure Test 1: Emergency Production Fix"
Cohesion: 0.40
Nodes (4): Choose A, B, or C, Pressure Test 1: Emergency Production Fix, Scenario, Your Options

### Community 91 - "Pressure Test 2: Sunk Cost + Exhaustion"
Cohesion: 0.40
Nodes (4): Choose A, B, or C, Pressure Test 2: Sunk Cost + Exhaustion, Scenario, Your Options

### Community 92 - "Pressure Test 3: Authority + Social Pressure"
Cohesion: 0.40
Nodes (4): Choose A, B, or C, Pressure Test 3: Authority + Social Pressure, Scenario, Your Options

### Community 93 - "[CHECKLIST TYPE] Checklist: [FEATURE NAME]"
Cohesion: 0.40
Nodes (4): [Category 1], [Category 2], [CHECKLIST TYPE] Checklist: [FEATURE NAME], Notes

### Community 96 - "props.js"
Cohesion: 0.13
Nodes (16): rand(), addProp(), buildProps(), GEO, _m, _p, placed, propSize() (+8 more)

### Community 98 - "sky.js"
Cohesion: 0.09
Nodes (26): setCarLights(), _c, GEO, LIT, _m, MAT, _p, _q (+18 more)

### Community 99 - "building"
Cohesion: 0.23
Nodes (16): asphalt(), buildEastShops(), building(), buildMotel(), buildPolice(), buildShops(), carAdd(), decorKit() (+8 more)

### Community 100 - "three"
Cohesion: 0.05
Nodes (98): three, BAG, bud(), budGeometry(), budMat(), budPile(), cache, cashStack() (+90 more)

### Community 101 - "icons.js"
Cohesion: 0.19
Nodes (20): banknote(), bud(), cache, crystalCluster(), DRAW, f(), GEM, iconSVG() (+12 more)

### Community 102 - "Execution Steps"
Cohesion: 0.12
Nodes (15): 1. Initialize Convergence Context, 2. Load Artifacts (Progressive Disclosure), 3. Build the Intent Inventory, 4. Assess the Codebase and Classify Findings, 5. Assign Severity, 6. Present the In-Session Findings Summary, 7. Append Convergence Tasks (or report converged), 8. Provide Next Actions (Handoff) (+7 more)

### Community 103 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, bcrypt, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken (+3 more)

### Community 104 - "phone.js"
Cohesion: 0.11
Nodes (44): PEOPLE, QUESTS, addictionLabel(), dealAt(), dealDue(), DELIVERY, marketChance(), priceLabel() (+36 more)

### Community 105 - "casino.js"
Cohesion: 0.22
Nodes (13): randi(), CASINO, casinoOpen(), play(), randomBet(), RED, REEL, REEL_BAG (+5 more)

### Community 106 - "restoreBackup"
Cohesion: 0.60
Nodes (5): backup(), native(), restoreBackup(), wipe(), @capacitor/preferences

### Community 107 - "layout.js"
Cohesion: 0.28
Nodes (11): initInput(), input, keys, moveJoy(), resetJoyEl(), applyLayout(), CONTROLS, el() (+3 more)

### Community 110 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, dev, migrate, start

## Knowledge Gaps
- **8 isolated node(s):** `UIKit`, `Capacitor`, `PackageDescription`, `@capacitor/android`, `@capacitor/core` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 933 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `three` to `props.js`, `riding.js`, `main.js`, `sky.js`, `objects.js`, `world.js`, `textures.js`, `dressing.js`, `render.js`, `juego/package.json`, `human.js`, `models.js`, `cars.js`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `UIKit`, `Capacitor`, `PackageDescription` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08350951374207188 - nodes in this community are weakly interconnected._
- **Why does `three` connect `three` to `props.js`, `riding.js`, `main.js`, `sky.js`, `addBox`, `objects.js`, `world.js`, `building`, `textures.js`, `dressing.js`, `render.js`, `juego/package.json`, `human.js`, `models.js`, `cars.js`, `palm`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `Three.js Textures` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Why does `R` connect `render.js` to `main.js`, `three`, `core.spec.js`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Three.js Shaders` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._