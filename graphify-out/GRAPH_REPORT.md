# Graph Report - volta-servidor  (2026-10-16)

## Corpus Check
- 128 files · ~158,977 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 46 file(s) not represented in the graph (top: .glb 22, .xml 10, (none) 7)

## Summary
- 1548 nodes · 2768 edges · 96 communities (80 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aba3bc98`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- world.js
- main.js
- Three.js Textures
- three
- Three.js Shaders
- objects.js
- Three.js Loaders
- phone.js
- textures.js
- Three.js Interaction
- Common Effects
- panels.js
- Three.js Lighting
- hud.js
- Three.js Animation
- Three.js Geometry
- Three.js Fundamentals
- Three.js Materials
- index.js
- economy.js
- sky.js
- forum.js
- time.js
- juego/package.json
- human.js
- police.js
- models.js
- cars.js
- Three.js Skills for Claude Code
- mock-server.js
- Walker
- npc.js
- routes/auth.js
- common.sh
- db.js
- ws.js
- ExampleInstrumentedTest.java
- volta-api.js
- dependencies
- friends.js
- users.js
- with_server.py
- Web Application Testing
- BLOQUE 9 · Puerto Lomas
- economy.js
- Frontend Design
- Tasks: [FEATURE NAME]
- VOLTA · Backend social (Node.js + Express + PostgreSQL)
- moderation.js
- scripts
- com.getcapacitor.BridgeActivity
- CLAUDE.md
- .claude/CLAUDE.md
- speckit-analyze/SKILL.md
- generator_template.js
- Creation Log: Systematic Debugging Skill
- algorithmic-art/SKILL.md
- building
- audio.js
- Execution Steps
- Root Cause Tracing
- Systematic Debugging
- addBox
- Condition-Based Waiting
- palm
- Feature Specification: [FEATURE NAME]
- Defense-in-Depth Validation
- speckit-plan/SKILL.md
- speckit-specify/SKILL.md
- speckit-tasks/SKILL.md
- Core Principles
- Core Principles
- Verification Before Completion
- render.js
- Implementation Plan: [FEATURE]
- speckit-checklist/SKILL.md
- speckit-clarify/SKILL.md
- speckit-implement/SKILL.md
- layout.js
- Nav
- speckit-constitution/SKILL.md
- speckit-taskstoissues/SKILL.md
- Pressure Test 1: Emergency Production Fix
- Pressure Test 2: Sunk Cost + Exhaustion
- Pressure Test 3: Authority + Social Pressure
- [CHECKLIST TYPE] Checklist: [FEATURE NAME]
- find-polluter.sh
- test-academic.md

## God Nodes (most connected - your core abstractions)
1. `sfx` - 43 edges
2. `addBox()` - 37 edges
3. `createWorld()` - 32 edges
4. `G` - 22 edges
5. `money()` - 22 edges
6. `Three.js Materials` - 21 edges
7. `save()` - 19 edges
8. `rng()` - 19 edges
9. `three` - 18 edges
10. `startGame()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `7. Append Convergence Tasks (or report converged)` --references--> `M()`  [INFERRED]
  .claude/skills/speckit-converge/SKILL.md → src/entities/hands.js
- `When to Use` --references--> `sleep()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → src/systems/time.js
- `Implementation` --references--> `waitForEvent()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → .claude/skills/systematic-debugging/condition-based-waiting-example.ts
- `Implementation` --references--> `waitForEventCount()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → .claude/skills/systematic-debugging/condition-based-waiting-example.ts
- `Implementation` --references--> `waitForEventMatch()`  [INFERRED]
  .claude/skills/systematic-debugging/condition-based-waiting.md → .claude/skills/systematic-debugging/condition-based-waiting-example.ts

## Import Cycles
- None detected.

## Communities (96 total, 16 thin omitted)

### Community 0 - "world.js"
Cohesion: 0.08
Nodes (38): addProp(), buildProps(), propSize(), propsReady(), buildBoxes(), buildBulbs(), buildGround(), buildNav() (+30 more)

### Community 1 - "main.js"
Cohesion: 0.10
Nodes (32): pollInput(), load(), newState(), autoQuality(), boot(), buildWorld(), camera, clerks (+24 more)

### Community 2 - "Three.js Textures"
Cohesion: 0.04
Nodes (44): Accessing UVs, Background Options, Basic Loading, Canvas Texture, Color Space, Compressed Textures, Cube Textures, CubeCamera (+36 more)

### Community 3 - "three"
Cohesion: 0.11
Nodes (14): initInput(), input, keys, moveJoy(), resetJoyEl(), resetTouch(), applyHandLook(), Player (+6 more)

### Community 4 - "Three.js Shaders"
Cohesion: 0.06
Nodes (33): Common Injection Points, Common Material Properties, Common Shader Patterns, Debugging Shaders, Dissolve Effect, Extending Built-in Materials, External Shader Files, Fresnel Effect (+25 more)

### Community 5 - "objects.js"
Cohesion: 0.10
Nodes (33): slotsCount(), randi(), ensureBaseProduct(), actionsFor(), BUILD, bx, cyl, cylTaper (+25 more)

### Community 6 - "Three.js Loaders"
Cohesion: 0.06
Nodes (32): ArrayBuffer, Async/Promise Loading, Blob URL, Built-in Cache, Caching, CubeTextureLoader, Custom Asset Manager, Custom Path/URL (+24 more)

### Community 7 - "phone.js"
Cohesion: 0.13
Nodes (36): wipe(), clock(), dayName(), clearWaypoint(), drawMinimap(), getWaypoint(), setWaypoint(), updateHUD() (+28 more)

### Community 8 - "textures.js"
Cohesion: 0.08
Nodes (48): budCluster(), buildItem(), bx(), capG, cardMat(), curl(), handMats, M() (+40 more)

### Community 9 - "Three.js Interaction"
Cohesion: 0.07
Nodes (29): Basic Raycasting, Box Selection, Camera Controls, Click to Select, DragControls, Efficient Raycasting, Event Handling Best Practices, FirstPersonControls (+21 more)

### Community 10 - "Common Effects"
Cohesion: 0.07
Nodes (28): Bloom (Glow), Chromatic Aberration, Color Correction, Combining Multiple Effects, Common Effects, Custom ShaderPass, Depth of Field (DOF), EffectComposer Setup (+20 more)

### Community 11 - "panels.js"
Cohesion: 0.24
Nodes (27): sfx, illegalCount(), slotsAdd(), money(), previewMix(), product(), registerMix(), cooperate() (+19 more)

### Community 12 - "Three.js Lighting"
Cohesion: 0.07
Nodes (27): AmbientLight, Common Lighting Setups, Contact Shadows (Fake, Fast), Cube Texture Environment, DirectionalLight, DirectionalLight Shadows, Enable Shadows, Environment Lighting (IBL) (+19 more)

### Community 13 - "hud.js"
Cohesion: 0.23
Nodes (8): QUESTS, G, on(), CONTACTS, wanted, els, floatMoney(), initHUD()

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

### Community 19 - "economy.js"
Cohesion: 0.11
Nodes (18): hasSave(), inv, INV_SIZE, same(), slotsRemove(), slotsRoom(), EFFECTS, INGREDIENTS (+10 more)

### Community 20 - "sky.js"
Cohesion: 0.07
Nodes (29): setCarLights(), _c, _e, GEO, LIT, _m, MAT, _p (+21 more)

### Community 21 - "forum.js"
Cohesion: 0.13
Nodes (17): HttpError, config, { HttpError }, { pool }, postCooldown(), secondsLeft(), tooFast(), { ah, HttpError } (+9 more)

### Community 22 - "time.js"
Cohesion: 0.25
Nodes (18): absNow(), save(), pauseMenu(), addMoney(), deadDropActions(), onHour(), onMinute(), orderSeeds() (+10 more)

### Community 23 - "juego/package.json"
Cohesion: 0.10
Nodes (19): dependencies, @capacitor/android, @capacitor/core, three, devDependencies, @capacitor/cli, vite, name (+11 more)

### Community 24 - "human.js"
Cohesion: 0.14
Nodes (16): G_, HAIRS, makeHuman(), h, markerTex, mat(), matCache, mesh() (+8 more)

### Community 25 - "police.js"
Cohesion: 0.22
Nodes (13): setSiren(), CUSTOMER_LINES, GREETINGS, OFFICERS, PEOPLE, STARTING_CUSTOMERS, arrest(), curfew() (+5 more)

### Community 26 - "models.js"
Cohesion: 0.12
Nodes (15): BONE, CLIPS, clipsFor(), files, findSkin(), loadModels(), makeRealHuman(), h (+7 more)

### Community 27 - "cars.js"
Cohesion: 0.08
Nodes (32): box, Car, carMat(), carMats, glassMat, glowMat(), glowMats, laneLoop() (+24 more)

### Community 28 - "Three.js Skills for Claude Code"
Cohesion: 0.12
Nodes (15): Acknowledgments, Basic Scene Setup, Contributing, Custom Shaders, How It Works, Installation, License, Loading 3D Models (+7 more)

### Community 29 - "mock-server.js"
Cohesion: 0.16
Nodes (13): crypto, frame(), friends, hb, http, lastPost, posts, pub() (+5 more)

### Community 30 - "Walker"
Cohesion: 0.14
Nodes (7): markerSprite(), randomLook(), Cop, NPC, prop(), Walker, spawnPolice()

### Community 31 - "npc.js"
Cohesion: 0.26
Nodes (12): modelNames(), MODELS, hitGeo, hitMat, LEO_MODEL, choices(), FEMALE_NAMES, lookFor() (+4 more)

### Community 32 - "routes/auth.js"
Cohesion: 0.12
Nodes (13): config, { ah, HttpError }, authLimiter, bcrypt, config, loginSchema, { query }, rateLimit (+5 more)

### Community 33 - "common.sh"
Cohesion: 0.11
Nodes (30): check-prerequisites.sh script, check_dir(), check_file(), find_specify_root(), format_speckit_command(), get_current_branch(), get_feature_paths(), get_invoke_separator() (+22 more)

### Community 34 - "db.js"
Cohesion: 0.20
Nodes (8): pg, fs, path, { pool }, config, { Pool }, query(), tx()

### Community 35 - "ws.js"
Cohesion: 0.22
Nodes (12): ws, shutdown(), allowedOrigin(), attach(), broadcast(), close(), config, send() (+4 more)

### Community 37 - "volta-api.js"
Cohesion: 0.27
Nodes (6): http(), login(), logout(), register(), respondFriend(), setToken()

### Community 38 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, bcrypt, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken (+3 more)

### Community 39 - "friends.js"
Cohesion: 0.14
Nodes (15): jsonwebtoken, ah(), config, { HttpError }, jwt, requireAuth(), sign(), verify() (+7 more)

### Community 40 - "users.js"
Cohesion: 0.20
Nodes (9): express-rate-limit, { ah, HttpError }, checkLimiter, { query }, rateLimit, { requireAuth }, router, VMOD (+1 more)

### Community 42 - "Web Application Testing"
Cohesion: 0.25
Nodes (7): Best Practices, Common Pitfall, Decision Tree: Choosing Your Approach, Example: Using with_server.py, Reconnaissance-Then-Action Pattern, Reference Files, Web Application Testing

### Community 43 - "BLOQUE 9 · Puerto Lomas"
Cohesion: 0.22
Nodes (8): Android (Play Store), BLOQUE 9 · Puerto Lomas, Coches, productos y sonidos, Estructura, Habilidades de Claude Code instaladas, Personajes, Probarlo, Qué incluye esta versión

### Community 44 - "economy.js"
Cohesion: 0.17
Nodes (23): productValue(), clamp(), emit(), listeners, pick(), rand(), acceptDeal(), addXP() (+15 more)

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

### Community 51 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, dev, migrate, start

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

### Community 65 - "building"
Cohesion: 0.18
Nodes (19): asphalt(), billboard(), buildCommercial(), buildIndustrial(), building(), buildMotel(), buildPolice(), buildShops() (+11 more)

### Community 66 - "audio.js"
Cohesion: 0.16
Nodes (13): amb, audioStatus(), BUF, files, initAudio(), loadSounds(), loopSrc(), play() (+5 more)

### Community 67 - "Execution Steps"
Cohesion: 0.12
Nodes (15): 1. Initialize Convergence Context, 2. Load Artifacts (Progressive Disclosure), 3. Build the Intent Inventory, 4. Assess the Codebase and Classify Findings, 5. Assign Severity, 6. Present the In-Session Findings Summary, 7. Append Convergence Tasks (or report converged), 8. Provide Next Actions (Handoff) (+7 more)

### Community 68 - "Root Cause Tracing"
Cohesion: 0.12
Nodes (15): 1. Observe the Symptom, 2. Find Immediate Cause, 3. Ask: What Called This?, 4. Keep Tracing Up, 5. Find Original Trigger, Adding Stack Traces, Finding Which Test Causes Pollution, Key Principle (+7 more)

### Community 69 - "Systematic Debugging"
Cohesion: 0.12
Nodes (15): Common Rationalizations, Overview, Phase 1: Root Cause Investigation, Phase 2: Pattern Analysis, Phase 3: Hypothesis and Testing, Phase 4: Implementation, Quick Reference, Red Flags - STOP and Follow Process (+7 more)

### Community 70 - "addBox"
Cohesion: 0.28
Nodes (16): addBox(), buildNave(), buildOutskirts(), buildResidential(), cardBox(), chainFence(), forklift(), hitbox() (+8 more)

### Community 71 - "Condition-Based Waiting"
Cohesion: 0.15
Nodes (12): Common Mistakes, Condition-Based Waiting, Core Pattern, waitForEvent(), waitForEventCount(), waitForEventMatch(), Implementation, Overview (+4 more)

### Community 72 - "palm"
Cohesion: 0.19
Nodes (13): bench(), buildBeach(), buildMountains(), buildPlaza(), buildSkyline(), buildStreetFurniture(), bush(), frondGeo() (+5 more)

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

### Community 81 - "render.js"
Cohesion: 0.28
Nodes (8): applyQuality(), buildComposer(), GradeShader, initRender(), _q, R, setQuality(), _v

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

### Community 86 - "layout.js"
Cohesion: 0.62
Nodes (6): applyLayout(), CONTROLS, el(), fitHud(), openLayoutEditor(), settings()

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

## Knowledge Gaps
- **4 isolated node(s):** `@capacitor/android`, `@capacitor/core`, `@capacitor/cli`, `dotenv`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 834 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `three` to `world.js`, `main.js`, `objects.js`, `textures.js`, `render.js`, `sky.js`, `juego/package.json`, `human.js`, `models.js`, `cars.js`, `npc.js`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `createWorld()` (e.g. with `addBox()` and `inProperty()`) actually correct?**
  _`createWorld()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@capacitor/android`, `@capacitor/core`, `@capacitor/cli` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `world.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0796221322537112 - nodes in this community are weakly interconnected._
- **Why does `G` connect `hud.js` to `world.js`, `main.js`, `audio.js`, `three`, `objects.js`, `phone.js`, `textures.js`, `panels.js`, `economy.js`, `render.js`, `economy.js`, `sky.js`, `time.js`, `layout.js`, `police.js`, `cars.js`, `npc.js`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10420168067226891 - nodes in this community are weakly interconnected._
- **Why does `M()` connect `textures.js` to `Execution Steps`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._