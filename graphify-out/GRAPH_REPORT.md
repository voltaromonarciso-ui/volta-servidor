# Graph Report - volta-servidor  (2026-10-23)

## Corpus Check
- 203 files · ~2,218,857 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 221 file(s) not represented in the graph (top: .glb 188, (none) 10, .xml 10)

## Summary
- 2964 nodes · 8013 edges · 127 communities (109 shown, 18 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 206 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a497eab5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- three
- main.js
- Three.js Textures
- island.js
- Three.js Shaders
- objects.js
- Three.js Loaders
- actionsFor
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
- station.js
- forum.js
- CapApp-SPM/README.md
- juego/package.json
- _f
- vegetation.js
- cars.js
- Three.js Skills for Claude Code
- mock-server.js
- panels.js
- craft.js
- routes/auth.js
- common.sh
- db.js
- ws.js
- ExampleInstrumentedTest.java
- volta-api.js
- realbuilding.js
- friends.js
- state.js
- with_server.py
- Web Application Testing
- Bloque 9 en Android e iPhone: estado real
- Encargo «Rooktown» (partes 1–4), recibido el 18-10-2026 — PENDIENTE
- Frontend Design
- Tasks: [FEATURE NAME]
- VOLTA · Backend social (Node.js + Express + PostgreSQL)
- economy.js
- moderation.js
- buildCoast
- com.getcapacitor.BridgeActivity
- CLAUDE.md
- .claude/CLAUDE.md
- speckit-analyze/SKILL.md
- generator_template.js
- Creation Log: Systematic Debugging Skill
- algorithmic-art/SKILL.md
- labs.js
- LEEME.md
- time.js
- Root Cause Tracing
- Systematic Debugging
- world.js
- ev
- models.js
- Feature Specification: [FEATURE NAME]
- Defense-in-Depth Validation
- speckit-plan/SKILL.md
- speckit-specify/SKILL.md
- speckit-tasks/SKILL.md
- Core Principles
- Core Principles
- Verification Before Completion
- facades.js
- Implementation Plan: [FEATURE]
- speckit-checklist/SKILL.md
- speckit-clarify/SKILL.md
- speckit-implement/SKILL.md
- npc.js
- hands.js
- speckit-constitution/SKILL.md
- speckit-taskstoissues/SKILL.md
- Pressure Test 1: Emergency Production Fix
- Pressure Test 2: Sunk Cost + Exhaustion
- Pressure Test 3: Authority + Social Pressure
- [CHECKLIST TYPE] Checklist: [FEATURE NAME]
- find-polluter.sh
- test-academic.md
- props.js
- grass.js
- sky.js
- coast.js
- game.js
- icons.js
- Execution Steps
- dependencies
- addBox
- hud.js
- helditems.js
- fparms.js
- phone.js
- rideables.js
- scripts
- detail.js
- benches.js
- riding.js
- police.js
- Modelos 3D libres: fuentes, licencias y conversión
- human.js
- interact.js
- goods.js
- terrain.js
- Walker
- setGhost
- streetfurniture.js
- spawnObject
- plant.js
- Nav
- NPC

## God Nodes (most connected - your core abstractions)
1. `three` - 427 edges
2. `sfx` - 112 edges
3. `mat()` - 67 edges
4. `add()` - 61 edges
5. `save()` - 55 edges
6. `_b` - 54 edges
7. `absNow()` - 52 edges
8. `three` - 50 edges
9. `rbox()` - 44 edges
10. `money()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `Outline` --references--> `state()`  [INFERRED]
  .claude/skills/speckit-taskstoissues/SKILL.md → juego/src/systems/cartel.js
- `When to Use` --references--> `sleep()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → juego/src/systems/time.js
- `Dinero sucio y limpio (Bloque B, etapa 1): reglas` --references--> `load()`  [INFERRED]
  juego/docs/MOVIL.md → juego/src/core/state.js
- `Dinero sucio y limpio (Bloque B, etapa 1): reglas` --references--> `earn()`  [INFERRED]
  juego/docs/MOVIL.md → juego/src/systems/economy.js
- `Dinero sucio y limpio (Bloque B, etapa 1): reglas` --references--> `spend()`  [INFERRED]
  juego/docs/MOVIL.md → juego/src/systems/economy.js

## Import Cycles
- None detected.

## Communities (127 total, 18 thin omitted)

### Community 0 - "three"
Cohesion: 0.06
Nodes (123): three, collectSolids(), applyHandLook(), curl(), makeHand(), seg(), ViewModel, Player (+115 more)

### Community 1 - "main.js"
Cohesion: 0.05
Nodes (67): initInput(), input, keys, moveJoy(), pollInput(), resetJoyEl(), resetTouch(), hasSave() (+59 more)

### Community 2 - "Three.js Textures"
Cohesion: 0.04
Nodes (44): Accessing UVs, Background Options, Basic Loading, Canvas Texture, Color Space, Compressed Textures, Cube Textures, CubeCamera (+36 more)

### Community 3 - "island.js"
Cohesion: 0.07
Nodes (44): grassReady(), alley(), ATM_ZONES, block(), blockOf(), buildBlock(), buildIsland(), buildPaths() (+36 more)

### Community 4 - "Three.js Shaders"
Cohesion: 0.06
Nodes (33): Common Injection Points, Common Material Properties, Common Shader Patterns, Debugging Shaders, Dissolve Effect, Extending Built-in Materials, External Shader Files, Fresnel Effect (+25 more)

### Community 5 - "objects.js"
Cohesion: 0.07
Nodes (26): ADDS, BUILD, bx, COOK_MIN, COOK_OUT, COOK_PRO, cyl, cylH (+18 more)

### Community 6 - "Three.js Loaders"
Cohesion: 0.06
Nodes (32): ArrayBuffer, Async/Promise Loading, Blob URL, Built-in Cache, Caching, CubeTextureLoader, Custom Asset Manager, Custom Path/URL (+24 more)

### Community 7 - "actionsFor"
Cohesion: 0.27
Nodes (12): refreshPlant(), ensureBaseProduct(), actionsFor(), collect(), emptyPot(), harvest(), harvestYield(), labCollect() (+4 more)

### Community 8 - "textures.js"
Cohesion: 0.18
Nodes (30): asphaltTex(), billboardTex(), blotches(), cardboardTex(), carpetTex(), chainTex(), clipboardTex(), concreteTex() (+22 more)

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
Nodes (60): guardGhostClick(), INV_SIZE, BEARDS, CLOTHES, HAIR_COLORS, RECOG_MINUTES, RECOG_WEIGHTS, SLOTS (+52 more)

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

### Community 20 - "station.js"
Cohesion: 0.09
Nodes (42): BAG, GEMS, camFrom, camTo, colorOf(), CONT_NAME, CS, done() (+34 more)

### Community 21 - "forum.js"
Cohesion: 0.13
Nodes (18): query(), tx(), config, { HttpError }, { pool }, postCooldown(), secondsLeft(), tooFast() (+10 more)

### Community 23 - "juego/package.json"
Cohesion: 0.08
Nodes (22): dependencies, @capacitor/android, @capacitor/core, @capacitor/ios, @capacitor/preferences, devDependencies, @capacitor/cli, @playwright/test (+14 more)

### Community 24 - "_f"
Cohesion: 0.17
Nodes (22): _f, bench(), buildAlleys(), buildLightsAndSigns(), buildNavNet(), buildStreetFurniture(), clump(), findAlleys() (+14 more)

### Community 26 - "vegetation.js"
Cohesion: 0.18
Nodes (26): N, arbolCopa(), arbusto(), barkNormal(), barkTex(), bladeStrip(), bladeTex(), canopy() (+18 more)

### Community 27 - "cars.js"
Cohesion: 0.07
Nodes (37): box, Car, carMat(), carMats, CROSSES, glassMat, glowMat(), glowMats (+29 more)

### Community 28 - "Three.js Skills for Claude Code"
Cohesion: 0.12
Nodes (15): Acknowledgments, Basic Scene Setup, Contributing, Custom Shaders, How It Works, Installation, License, Loading 3D Models (+7 more)

### Community 29 - "mock-server.js"
Cohesion: 0.16
Nodes (13): crypto, frame(), friends, hb, http, lastPost, posts, pub() (+5 more)

### Community 30 - "panels.js"
Cohesion: 0.09
Nodes (71): Dinero sucio y limpio (Bloque B, etapa 1): reglas, sfx, EFFECTS, FORMS, formsOf(), LAB, RANKS, RESPECT (+63 more)

### Community 31 - "craft.js"
Cohesion: 0.12
Nodes (35): addToBowl(), allIn(), camFrom, camTo, canStart(), collect(), craftAuto(), exitCraft() (+27 more)

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

### Community 38 - "realbuilding.js"
Cohesion: 0.05
Nodes (88): buildingSize(), classify(), files, FIT, FRAME(), GLASS(), KIT_SCALE, loadBuildings() (+80 more)

### Community 39 - "friends.js"
Cohesion: 0.10
Nodes (24): jsonwebtoken, zod, ah(), HttpError, config, { HttpError }, jwt, requireAuth() (+16 more)

### Community 40 - "state.js"
Cohesion: 0.12
Nodes (31): ACCOUNTS, apply(), check(), ensure(), fail(), KEY_DAYS, KEY_MAX, keyUsed() (+23 more)

### Community 41 - "with_server.py"
Cohesion: 0.14
Nodes (3): is_server_ready(), main(), walk()

### Community 42 - "Web Application Testing"
Cohesion: 0.25
Nodes (7): Best Practices, Common Pitfall, Decision Tree: Choosing Your Approach, Example: Using with_server.py, Reconnaissance-Then-Action Pattern, Reference Files, Web Application Testing

### Community 43 - "Bloque 9 en Android e iPhone: estado real"
Cohesion: 0.08
Nodes (22): 1. Motor y arquitectura, 2. Controles táctiles, 3. Pruebas automáticas (referencia del comportamiento actual), 4. Compilación, 5. Rendimiento en móvil (lo que ya hace el juego), Android — estado: proyecto listo, compilación BLOQUEADA en este entorno, Bloque 9 en Android e iPhone: estado real, Encargo maestro (18-10-2026): reglas nuevas (+14 more)

### Community 44 - "Encargo «Rooktown» (partes 1–4), recibido el 18-10-2026 — PENDIENTE"
Cohesion: 0.12
Nodes (15): Complemento — Rooktown: red urbana, callejones, NPC y cambio de nombre (18-10-2026), Complemento — Seis estaciones, empaquetado y El Cartel (18-10-2026), Decisiones previas que siguen vigentes, Decisión sobre los modelos (18-10-2026), Encargo «Rooktown» (partes 1–4), recibido el 18-10-2026 — PENDIENTE, Más indicaciones del usuario, Parte 1 — Auditoría y progresión, Parte 2 — Gameplay, economía y propiedades (+7 more)

### Community 45 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 46 - "Tasks: [FEATURE NAME]"
Cohesion: 0.07
Nodes (26): Dependencies & Execution Order, Format: `[ID] [P?] [Story] Description`, Implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation Strategy, Incremental Delivery, MVP First (User Story 1 Only) (+18 more)

### Community 47 - "VOLTA · Backend social (Node.js + Express + PostgreSQL)"
Cohesion: 0.29
Nodes (6): 1. Puesta en marcha, 2. Endpoints, 3. Integración desde `index.html`, 4. Seguridad: lo que hay y lo que debes saber, 5. Integración ya hecha en `Volta-5.html`, VOLTA · Backend social (Node.js + Express + PostgreSQL)

### Community 48 - "economy.js"
Cohesion: 0.10
Nodes (68): productValue(), rawOf(), PEOPLE, clamp(), emit(), pick(), styleBonus(), acceptChance() (+60 more)

### Community 49 - "moderation.js"
Cohesion: 0.70
Nodes (4): base(), hit(), username(), variants()

### Community 51 - "buildCoast"
Cohesion: 0.26
Nodes (17): buildingModel(), hasBuilding(), buildCoast(), cartelFor(), coastFill(), DOORS, houseAt(), modelBuilding() (+9 more)

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

### Community 65 - "labs.js"
Cohesion: 0.20
Nodes (40): bench(), bins, bottle(), box(), brushed(), btn(), buildAutoPacker(), buildCrystalTable() (+32 more)

### Community 67 - "time.js"
Cohesion: 0.14
Nodes (20): at(), home(), P(), piso(), QUESTS, onHour(), drainK(), lampBoost() (+12 more)

### Community 68 - "Root Cause Tracing"
Cohesion: 0.12
Nodes (15): 1. Observe the Symptom, 2. Find Immediate Cause, 3. Ask: What Called This?, 4. Keep Tracing Up, 5. Find Original Trigger, Adding Stack Traces, Finding Which Test Causes Pollution, Key Principle (+7 more)

### Community 69 - "Systematic Debugging"
Cohesion: 0.12
Nodes (15): Common Rationalizations, Overview, Phase 1: Root Cause Investigation, Phase 2: Pattern Analysis, Phase 3: Hypothesis and Testing, Phase 4: Implementation, Quick Reference, Red Flags - STOP and Follow Process (+7 more)

### Community 70 - "world.js"
Cohesion: 0.07
Nodes (43): setPropOffset(), setRelief(), buildBoxes(), buildBulbs(), buildGround(), buildMountains(), buildNav(), buildRoadDetails() (+35 more)

### Community 71 - "ev"
Cohesion: 0.08
Nodes (59): Common Mistakes, Condition-Based Waiting, Core Pattern, waitForEvent(), waitForEventCount(), waitForEventMatch(), Implementation, Overview (+51 more)

### Community 72 - "models.js"
Cohesion: 0.13
Nodes (14): BONE, CLIPS, clipsFor(), files, findSkin(), loadModels(), makeRealHuman(), h (+6 more)

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

### Community 81 - "facades.js"
Cohesion: 0.06
Nodes (63): BUILDINGS, loadGlbItems(), loadKitItems(), loadLocalItems(), glbParam, lab, r, rows (+55 more)

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

### Community 86 - "npc.js"
Cohesion: 0.22
Nodes (13): modelNames(), MODELS, hitGeo, hitMat, LEO_MODEL, model(), choices(), FEMALE_NAMES (+5 more)

### Community 87 - "hands.js"
Cohesion: 0.12
Nodes (24): crystalCluster(), powderPile(), seed(), seedPile(), seedTexture(), buildItem(), bx(), capG (+16 more)

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
Cohesion: 0.14
Nodes (14): addProp(), buildProps(), GEO, _m, _p, placed, propSize(), propsReady() (+6 more)

### Community 97 - "grass.js"
Cohesion: 0.26
Nodes (9): bladeTex(), fringeMesh(), islandLawn(), lawnGeoFromPositions(), lawnRects(), loadGrass(), n2(), tint() (+1 more)

### Community 98 - "sky.js"
Cohesion: 0.07
Nodes (31): setCarLights(), boxSeg(), _c, _e, GEO, LIT, _m, MAT (+23 more)

### Community 99 - "coast.js"
Cohesion: 0.14
Nodes (45): add(), asphaltTex(), barca(), BOX, boxM(), buque(), canvasTex(), chiringuito() (+37 more)

### Community 100 - "game.js"
Cohesion: 0.12
Nodes (24): G, listeners, randi(), ATM, atmLeft(), atmMove(), usage(), weekOf() (+16 more)

### Community 101 - "icons.js"
Cohesion: 0.16
Nodes (27): amberBottle(), banknote(), blisterPack(), blueCrystals(), bud(), cache, capsule(), crystalCluster() (+19 more)

### Community 102 - "Execution Steps"
Cohesion: 0.12
Nodes (15): 1. Initialize Convergence Context, 2. Load Artifacts (Progressive Disclosure), 3. Build the Intent Inventory, 4. Assess the Codebase and Classify Findings, 5. Assign Severity, 6. Present the In-Session Findings Summary, 7. Append Convergence Tasks (or report converged), 8. Provide Next Actions (Handoff) (+7 more)

### Community 103 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, bcrypt, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken (+3 more)

### Community 104 - "addBox"
Cohesion: 0.12
Nodes (55): _b, _d, addBox(), asphalt(), bench(), billboard(), buildBeach(), buildCommercial() (+47 more)

### Community 105 - "hud.js"
Cohesion: 0.10
Nodes (45): on(), RECOG_LEVEL, orderDrop(), placingMode(), ridingInfo(), clock(), dayName(), apply() (+37 more)

### Community 106 - "helditems.js"
Cohesion: 0.19
Nodes (41): add(), azucar(), balas(), bolsaCompra(), bottle(), boxTex(), cache, catalizador() (+33 more)

### Community 107 - "fparms.js"
Cohesion: 0.10
Nodes (22): _a, _c, _e, FPArms, _g, GRIPS, HANDS, ik() (+14 more)

### Community 108 - "phone.js"
Cohesion: 0.07
Nodes (75): save(), ITEMS, CANDIDATES, ROLES, STAFF, pauseMenu(), balance(), CONTACTS (+67 more)

### Community 109 - "rideables.js"
Cohesion: 0.58
Nodes (8): buildBike(), buildScooter(), chrome(), M(), mats, tire(), tube(), wheel()

### Community 110 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, dev, migrate, start

### Community 111 - "detail.js"
Cohesion: 0.27
Nodes (34): cable(), canvasTex(), cardboardTex(), decal(), G(), geos, labelTex(), lathe() (+26 more)

### Community 112 - "benches.js"
Cohesion: 0.38
Nodes (18): shardsBag(), add(), BENCH_TOP, budTray(), buildJarPacker(), buildPacker(), buildStove(), crate() (+10 more)

### Community 113 - "riding.js"
Cohesion: 0.12
Nodes (30): absNow(), PARKING, RECOVER_PRICE, VEHICLES, bendPose(), clearPose(), spend(), cook() (+22 more)

### Community 114 - "police.js"
Cohesion: 0.06
Nodes (58): amb, audioStatus(), BUF, files, initAudio(), loadSounds(), loopSrc(), play() (+50 more)

### Community 115 - "Modelos 3D libres: fuentes, licencias y conversión"
Cohesion: 0.33
Nodes (5): Acceso a las fuentes, Conversión a GLB, Modelos 3D libres: fuentes, licencias y conversión, Paquetes descargados y verificados (todos CC0, dominio público: uso comercial sin atribución), Texturas realistas (Poly Haven, CC0)

### Community 116 - "human.js"
Cohesion: 0.14
Nodes (17): G_, HAIRS, makeHuman(), h, markerTex, mat(), matCache, mesh() (+9 more)

### Community 117 - "interact.js"
Cohesion: 0.25
Nodes (8): ray, target, updateInteract(), _v, placement, rotatePlacement(), tintGhost(), updatePlacement()

### Community 118 - "goods.js"
Cohesion: 0.17
Nodes (33): ribbedCap(), wrapLabel(), amberBottle(), blackCap(), blisterModel(), bud(), budGeometry(), budMat() (+25 more)

### Community 119 - "terrain.js"
Cohesion: 0.13
Nodes (29): buildLandAndSea(), islandShape(), LAWN_GEO, trimLawnAtShore(), warehouseLights(), baseH(), bulge(), CLAMP() (+21 more)

### Community 120 - "Walker"
Cohesion: 0.27
Nodes (3): markerSprite(), Cop, Walker

### Community 121 - "setGhost"
Cohesion: 0.23
Nodes (12): cancelMove(), cancelPlacement(), furnitureModel(), hideGhost(), pickBlock(), pickUp(), removeObject(), setGhost() (+4 more)

### Community 122 - "streetfurniture.js"
Cohesion: 0.32
Nodes (7): baseMat, createFurniture(), isPlain(), mergeAll(), plain, proto(), protos

### Community 123 - "spawnObject"
Cohesion: 0.29
Nodes (7): canPlace(), footprint(), infoFor(), LAB_TYPES, placeObject(), potInfo(), spawnObject()

### Community 124 - "plant.js"
Cohesion: 0.20
Nodes (16): bud(), buildFabricPot(), buildPlant(), buildStage(), clean(), DRY, fanLeaf(), leaflet() (+8 more)

### Community 127 - "NPC"
Cohesion: 0.21
Nodes (3): randomLook(), NPC, prop()

## Knowledge Gaps
- **12 isolated node(s):** `UIKit`, `Capacitor`, `PackageDescription`, `@capacitor/android`, `@capacitor/core` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1090 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `three` to `main.js`, `island.js`, `actionsFor`, `textures.js`, `dressing.js`, `station.js`, `juego/package.json`, `_f`, `vegetation.js`, `cars.js`, `craft.js`, `realbuilding.js`, `buildCoast`, `labs.js`, `world.js`, `models.js`, `facades.js`, `npc.js`, `hands.js`, `props.js`, `grass.js`, `sky.js`, `coast.js`, `addBox`, `hud.js`, `helditems.js`, `fparms.js`, `rideables.js`, `detail.js`, `benches.js`, `riding.js`, `human.js`, `goods.js`, `terrain.js`, `Walker`, `setGhost`, `streetfurniture.js`, `spawnObject`, `plant.js`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **What connects `UIKit`, `Capacitor`, `PackageDescription` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `three` be split into smaller, more focused modules?**
  _Cohesion score 0.05852490421455939 - nodes in this community are weakly interconnected._
- **Why does `three` connect `facades.js` to `three`, `main.js`, `island.js`, `objects.js`, `textures.js`, `dressing.js`, `station.js`, `juego/package.json`, `vegetation.js`, `cars.js`, `craft.js`, `realbuilding.js`, `labs.js`, `world.js`, `models.js`, `npc.js`, `hands.js`, `props.js`, `grass.js`, `sky.js`, `coast.js`, `hud.js`, `helditems.js`, `fparms.js`, `rideables.js`, `detail.js`, `benches.js`, `riding.js`, `police.js`, `human.js`, `interact.js`, `goods.js`, `streetfurniture.js`, `plant.js`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.053313587560162905 - nodes in this community are weakly interconnected._
- **Why does `@playwright/test` connect `ev` to `juego/package.json`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `Three.js Textures` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._