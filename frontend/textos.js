/* VOLTA · Textos que se quedaban en español con la app en inglés, francés o portugués.
   Formato: "español|inglés|francés|portugués" (texto exacto) y patrones con huecos ($1…) para los que llevan cifras.
   Se comprueba con una prueba que recorre todas las pantallas en inglés buscando español. */
(function () {
  if (!window.vxAddTr || !window.vxAddTrPat) return;
  window.vxAddTr(`
¿Qué equipamiento tienes?|What equipment do you have?|Quel équipement as-tu ?|Que equipamento tens?
¿Qué estás trabajando?|What are you working?|Que travailles-tu ?|O que estás a trabalhar?
¿QUÉ HA PASADO?|WHAT HAPPENED?|QUE S’EST-IL PASSÉ ?|O QUE ACONTECEU?
¿Qué necesito para subir?|What do I need to rank up?|Que me faut-il pour monter ?|O que preciso para subir?
¿Qué quieres mantener?|What do you want to keep?|Que veux-tu garder ?|O que queres manter?
Contraseña (mín. 8 caracteres)|Password (min. 8 characters)|Mot de passe (8 caractères min.)|Palavra-passe (mín. 8 caracteres)
Correo electrónico|Email|E-mail|Email
Ej.: pecho polea, hombro lateral, tríceps cabeza larga|E.g. cable chest, lateral delt, triceps long head|Ex. : pecs poulie, deltoïde latéral, triceps long chef|Ex.: peito polia, ombro lateral, tríceps cabeça longa
Escribe tu duda...|Type your question...|Écris ta question...|Escreve a tua dúvida...
Nombre de usuario (p. ej. ana.fit)|Username (e.g. ana.fit)|Nom d’utilisateur (ex. ana.fit)|Nome de utilizador (ex. ana.fit)
Peso (kg)|Weight (kg)|Poids (kg)|Peso (kg)
★ Recomendado. Las cantidades se calculan por ti.|★ Recommended. Amounts are calculated for you.|★ Recommandé. Les quantités sont calculées pour toi.|★ Recomendado. As quantidades são calculadas por ti.
☆ Guardar en favoritos|☆ Save to favourites|☆ Ajouter aux favoris|☆ Guardar nos favoritos
☑ Máquinas|☑ Machines|☑ Machines|☑ Máquinas
⚙ Mi equipamiento|⚙ My equipment|⚙ Mon équipement|⚙ O meu equipamento
⚡ Más rápido|⚡ Quicker|⚡ Plus rapide|⚡ Mais rápido
🌾 Sin gluten|🌾 Gluten-free|🌾 Sans gluten|🌾 Sem glúten
🍚 Más carbohidratos|🍚 More carbs|🍚 Plus de glucides|🍚 Mais hidratos
🏆 Favoritos primero|🏆 Favourites first|🏆 Favoris d’abord|🏆 Favoritos primeiro
🏆 Récords|🏆 Records|🏆 Records|🏆 Recordes
🏠 Lo tengo en casa|🏠 I have it at home|🏠 Je l’ai chez moi|🏠 Tenho em casa
🐟 Sin pescado|🐟 No fish|🐟 Sans poisson|🐟 Sem peixe
💪 Alta proteína|💪 High protein|💪 Riche en protéines|💪 Alta proteína
💪 Proteína|💪 Protein|💪 Protéines|💪 Proteína
💰 Más barato|💰 Cheaper|💰 Moins cher|💰 Mais barato
📈 Volumen|📈 Volume|📈 Volume|📈 Volume
🔥 Calorías|🔥 Calories|🔥 Calories|🔥 Calorias
🔥 Días entrenados|🔥 Days trained|🔥 Jours d’entraînement|🔥 Dias treinados
🔥 Más utilizados|🔥 Most used|🔥 Les plus utilisés|🔥 Mais usados
🔥 Menos calorías|🔥 Fewer calories|🔥 Moins de calories|🔥 Menos calorias
🥗 Más saciante|🥗 More filling|🥗 Plus rassasiant|🥗 Mais saciante
🥛 Sin lactosa|🥛 Lactose-free|🥛 Sans lactose|🥛 Sem lactose
🥜 Sin frutos secos|🥜 Nut-free|🥜 Sans fruits à coque|🥜 Sem frutos secos
🟢 Principiante primero|🟢 Beginner first|🟢 Débutant d’abord|🟢 Principiante primeiro
Abrir la biblioteca|Open the library|Ouvrir la bibliothèque|Abrir a biblioteca
Alergias (se bloquean por completo)|Allergies (fully blocked)|Allergies (totalement bloquées)|Alergias (bloqueadas por completo)
Alimento|Food|Aliment|Alimento
Alimentos disponibles en casa|Food you have at home|Aliments disponibles à la maison|Alimentos que tens em casa
Alimentos favoritos|Favourite foods|Aliments préférés|Alimentos favoritos
Alimentos que no gustan|Foods you dislike|Aliments que tu n’aimes pas|Alimentos de que não gostas
Añadir ejercicios|Add exercises|Ajouter des exercices|Adicionar exercícios
Aporta prácticamente las mismas calorías. Esta opción contiene menos grasa.|Practically the same calories. This option has less fat.|Pratiquement les mêmes calories. Cette option contient moins de graisses.|Praticamente as mesmas calorias. Esta opção tem menos gordura.
Aún no hay entrenos finalizados|No finished workouts yet|Aucune séance terminée pour l’instant|Ainda não há treinos terminados
Aún no tienes ejercicios favoritos. Toca ☆ en cualquier ejercicio.|No favourite exercises yet. Tap ☆ on any exercise.|Pas encore d’exercices favoris. Touche ☆ sur n’importe quel exercice.|Ainda não tens exercícios favoritos. Toca em ☆ em qualquer exercício.
Aún sin objetivo|No target yet|Pas encore d’objectif|Ainda sem objetivo
Básico|Basic|Basique|Básico
Brazo|Arm|Bras|Braço
Cada cambio se guarda al salir del campo. Mínimo permitido: 1.200 kcal.|Each change is saved when you leave the field. Minimum allowed: 1,200 kcal.|Chaque modification est enregistrée en quittant le champ. Minimum autorisé : 1 200 kcal.|Cada alteração é guardada ao sair do campo. Mínimo permitido: 1.200 kcal.
Cada serie cuenta como serie completa del músculo principal y como esta fracción en los secundarios.|Each set counts as a full set for the main muscle and as this fraction for the secondary ones.|Chaque série compte comme une série complète pour le muscle principal et comme cette fraction pour les secondaires.|Cada série conta como série completa do músculo principal e como esta fração nos secundários.
Calcúlalo desde tu perfil o escríbelo tú.|Calculate it from your profile or type it in.|Calcule-le depuis ton profil ou saisis-le.|Calcula-o a partir do teu perfil ou escreve-o tu.
Calcular objetivo|Calculate target|Calculer l’objectif|Calcular objetivo
Calorías|Calories|Calories|Calorias
Categoría de estándares de fuerza|Strength standards category|Catégorie des standards de force|Categoria de padrões de força
Centro de ayuda|Help centre|Centre d’aide|Centro de ajuda
Cintura|Waist|Taille|Cintura
Colores: morado élite · verde alto · amarillo estable · rojo necesita atención. Contorno sin relleno = sin datos suficientes.|Colours: purple elite · green high · yellow stable · red needs attention. Outline only = not enough data.|Couleurs : violet élite · vert élevé · jaune stable · rouge à surveiller. Contour sans remplissage = données insuffisantes.|Cores: roxo elite · verde alto · amarelo estável · vermelho precisa de atenção. Contorno sem preenchimento = dados insuficientes.
Cómo utilizar la aplicación|How to use the app|Comment utiliser l’application|Como usar a aplicação
Comparado con las 4/8/12 semanas anteriores.|Compared with the previous 4/8/12 weeks.|Comparé aux 4/8/12 semaines précédentes.|Comparado com as 4/8/12 semanas anteriores.
Comparar ejercicios|Compare exercises|Comparer des exercices|Comparar exercícios
Completa tu primer entreno para generar la línea de tendencia|Finish your first workout to draw the trend line|Termine ta première séance pour tracer la courbe de tendance|Termina o teu primeiro treino para gerar a linha de tendência
Copia de seguridad|Backup|Sauvegarde|Cópia de segurança
Crea tu cuenta|Create your account|Crée ton compte|Cria a tua conta
Crear rutina manualmente|Create routine manually|Créer une routine manuellement|Criar rotina manualmente
Créditos|Credits|Crédits|Créditos
Cuando pulses «Finalizar entrenamiento», la sesión aparecerá aquí con todas sus series.|When you tap “Finish workout”, the session will appear here with all its sets.|Quand tu touches « Terminer la séance », elle apparaîtra ici avec toutes ses séries.|Quando tocares em «Terminar treino», a sessão aparece aqui com todas as séries.
Días entrenados|Days trained|Jours d’entraînement|Dias treinados
Días por semana|Days per week|Jours par semaine|Dias por semana
División de entrenamiento|Training split|Répartition de l’entraînement|Divisão de treino
Elige un alimento y qué quieres mantener: Volta calcula los gramos de cada alternativa, respeta tus alergias, dieta, presupuesto y tiempo, y tiene en cuenta lo que te queda del día. Para aplicarla, abre una comida y pulsa "Sustituir" en un ingrediente.|Pick a food and what you want to keep: Volta calculates the grams of each alternative, respects your allergies, diet, budget and time, and takes the rest of your day into account. To apply it, open a meal and tap “Swap” on an ingredient.|Choisis un aliment et ce que tu veux garder : Volta calcule les grammes de chaque alternative, respecte tes allergies, ton régime, ton budget et ton temps, et tient compte du reste de ta journée. Pour l’appliquer, ouvre un repas et touche « Remplacer » sur un ingrédient.|Escolhe um alimento e o que queres manter: o Volta calcula os gramas de cada alternativa, respeita as tuas alergias, dieta, orçamento e tempo, e tem em conta o resto do teu dia. Para a aplicar, abre uma refeição e toca em «Substituir» num ingrediente.
Elige un alimento y qué quieres mantener: Volta calcula los gramos de cada alternativa, respeta tus alergias, dieta, presupuesto y tiempo, y tiene en cuenta lo que te queda del día.|Pick a food and what you want to keep: Volta calculates the grams of each alternative, respects your allergies, diet, budget and time, and takes the rest of your day into account.|Choisis un aliment et ce que tu veux garder : Volta calcule les grammes de chaque alternative, respecte tes allergies, ton régime, ton budget et ton temps, et tient compte du reste de ta journée.|Escolhe um alimento e o que queres manter: o Volta calcula os gramas de cada alternativa, respeita as tuas alergias, dieta, orçamento e tempo, e tem em conta o resto do teu dia.
Empezar ▶|Start ▶|Commencer ▶|Começar ▶
Empezar a entrenar|Start training|Commencer à s’entraîner|Começar a treinar
Esta semana no hay un músculo claramente por delante. Estás dentro de tu objetivo en todos los músculos.|No muscle is clearly ahead this week. You’re within your target for every muscle.|Aucun muscle n’est nettement devant cette semaine. Tu es dans ton objectif pour tous les muscles.|Esta semana nenhum músculo está claramente à frente. Estás dentro do objetivo em todos os músculos.
Esta semana vs anterior|This week vs last|Cette semaine vs précédente|Esta semana vs anterior
Este mes vs anterior|This month vs last|Ce mois-ci vs précédent|Este mês vs anterior
Estética y Resistencia|Aesthetics and Endurance|Esthétique et Endurance|Estética e Resistência
Explorar comidas y sustituir ingredientes|Explore meals and swap ingredients|Explorer les repas et remplacer des ingrédients|Explorar refeições e substituir ingredientes
Exporta todos tus datos de Volta (entrenos, progreso y nutrición) en un archivo JSON, o restaura una copia. La clave de IA, si la usas, no se incluye.|Export all your Volta data (workouts, progress and nutrition) to a JSON file, or restore a backup. Your AI key, if you use one, is not included.|Exporte toutes tes données Volta (séances, progrès et nutrition) dans un fichier JSON, ou restaure une sauvegarde. La clé d’IA, si tu en utilises une, n’est pas incluse.|Exporta todos os teus dados do Volta (treinos, progresso e nutrição) num ficheiro JSON, ou restaura uma cópia. A chave de IA, se a usares, não é incluída.
Fórmula del rango|Rank formula|Formule du rang|Fórmula do nível
Frecuencia por músculo (veces/semana)|Frequency per muscle (times/week)|Fréquence par muscle (fois/semaine)|Frequência por músculo (vezes/semana)
Fuerza (1RM estimado medio)|Strength (average estimated 1RM)|Force (1RM estimé moyen)|Força (1RM estimado médio)
Gemelo|Calf|Mollet|Gémeo
Generar rutina con IA|Generate routine with AI|Générer une routine avec l’IA|Gerar rotina com IA
Guardar medidas|Save measurements|Enregistrer les mesures|Guardar medidas
Guardar rutina|Save routine|Enregistrer la routine|Guardar rotina
Guía de Rangos Volta|Volta Rank Guide|Guide des rangs Volta|Guia de níveis Volta
Hacen falta datos de ambos periodos.|Data from both periods is needed.|Il faut des données des deux périodes.|São precisos dados dos dois períodos.
Hércules|Hercules|Hercule|Hércules
Hoy vs récord histórico|Today vs all-time record|Aujourd’hui vs record absolu|Hoje vs recorde histórico
Ilustración esquemática: indica énfasis, no activación medida.|Schematic illustration: shows emphasis, not measured activation.|Illustration schématique : indique l’accent, pas une activation mesurée.|Ilustração esquemática: indica ênfase, não ativação medida.
Información legal|Legal information|Informations légales|Informação legal
lácteos|dairy|produits laitiers|lacticínios
Maestro del Rayo|Master of Lightning|Maître de la Foudre|Mestre do Raio
Mapa corporal|Body map|Carte corporelle|Mapa corporal
Máx.|Max|Max.|Máx.
Medidas corporales|Body measurements|Mesures corporelles|Medidas corporais
Medio|Medium|Moyen|Médio
Mejor ejercicio|Best exercise|Meilleur exercice|Melhor exercício
Mejor serie y volumen por sesión (series × reps × peso).|Best set and volume per session (sets × reps × weight).|Meilleure série et volume par séance (séries × reps × charge).|Melhor série e volume por sessão (séries × reps × peso).
Mi equipamiento|My equipment|Mon équipement|O meu equipamento
Mín.|Min|Min.|Mín.
Muslo|Thigh|Cuisse|Coxa
Muy similar en proteína y calorías. Esta opción encaja mejor con tus macros restantes.|Very similar in protein and calories. This option fits your remaining macros better.|Très proche en protéines et calories. Cette option correspond mieux à tes macros restantes.|Muito semelhante em proteína e calorias. Esta opção encaixa melhor nos teus macros restantes.
Muy similar en proteína y calorías. Necesitas más cantidad porque tiene menos proteína por 100 g.|Very similar in protein and calories. You need more of it because it has less protein per 100 g.|Très proche en protéines et calories. Il en faut plus car il contient moins de protéines pour 100 g.|Muito semelhante em proteína e calorias. Precisas de mais quantidade porque tem menos proteína por 100 g.
Nivel de cocina|Cooking level|Niveau en cuisine|Nível de cozinha
Nivel de fuerza:|Strength level:|Niveau de force :|Nível de força:
Nombre de la rutina|Routine name|Nom de la routine|Nome da rotina
Objetivo|Goal|Objectif|Objetivo
Objetivo 10-16 series efectivas/semana|Target 10-16 effective sets/week|Objectif 10-16 séries efficaces/semaine|Objetivo 10-16 séries efetivas/semana
Objetivo de entreno|Training goal|Objectif d’entraînement|Objetivo de treino
Objetivo diario|Daily target|Objectif quotidien|Objetivo diário
Objetivo personal (ej. 110x5)|Personal goal (e.g. 110x5)|Objectif personnel (ex. 110x5)|Objetivo pessoal (ex. 110x5)
Objetivo semanal|Weekly target|Objectif hebdomadaire|Objetivo semanal
Omnívora|Omnivore|Omnivore|Omnívora
Otro objetivo|Another goal|Autre objectif|Outro objetivo
Para|To|Pour|Para
Pecho medio (pectoral mayor, porción esternocostal)|Mid chest (pectoralis major, sternocostal head)|Pectoraux moyens (grand pectoral, faisceau sternocostal)|Peito médio (peitoral maior, porção esternocostal)
Pecho superior (pectoral mayor, porción clavicular)|Upper chest (pectoralis major, clavicular head)|Haut des pectoraux (grand pectoral, faisceau claviculaire)|Peito superior (peitoral maior, porção clavicular)
Bíceps braquial|Biceps brachii|Biceps brachial|Bíceps braquial
Bíceps braquial (ambas cabezas)|Biceps brachii (both heads)|Biceps brachial (deux chefs)|Bíceps braquial (ambas as cabeças)
Personalización nutricional|Nutrition preferences|Personnalisation nutritionnelle|Personalização nutricional
Peso|Weight|Poids|Peso
Peso de las series secundarias|Weight of secondary sets|Poids des séries secondaires|Peso das séries secundárias
Peso medio|Average weight|Charge moyenne|Peso médio
Pesos del score (se normalizan a 100%)|Score weights (normalised to 100%)|Pondérations du score (ramenées à 100 %)|Pesos do score (normalizados a 100%)
Política de privacidad|Privacy policy|Politique de confidentialité|Política de privacidade
Por defecto|Default|Par défaut|Predefinido
Progresión|Progression|Progression|Progressão
Proteína|Protein|Protéines|Proteína
Proteína (g)|Protein (g)|Protéines (g)|Proteína (g)
Próximo|Next|Prochain|Próximo
Próximos objetivos|Next goals|Prochains objectifs|Próximos objetivos
Punto de partida|Starting point|Point de départ|Ponto de partida
Rango Máximo / Dios de la Fuerza|Top Rank / God of Strength|Rang suprême / Dieu de la Force|Nível Máximo / Deus da Força
Rangos de series por músculo|Set ranges per muscle|Plages de séries par muscle|Intervalos de séries por músculo
Rangos objetivo|Target ranges|Plages cibles|Intervalos objetivo
Récords|Records|Records|Recordes
Región|Region|Région|Região
Registra series de este músculo para valorarlo.|Log sets for this muscle to rate it.|Enregistre des séries de ce muscle pour l’évaluer.|Regista séries deste músculo para o avaliar.
Registrar|Log|Enregistrer|Registar
Registrar medidas (cm)|Log measurements (cm)|Enregistrer les mesures (cm)|Registar medidas (cm)
Repeticiones|Reps|Répétitions|Repetições
Rutina|Routine|Routine|Rotina
Rutina no encontrada.|Routine not found.|Routine introuvable.|Rotina não encontrada.
Score del músculo (toca para ver el desglose)|Muscle score (tap to see the breakdown)|Score du muscle (touche pour le détail)|Score do músculo (toca para ver o detalhe)
Se usa con el filtro "Según mi gimnasio".|Used by the “Based on my gym” filter.|Utilisé par le filtre « Selon ma salle ».|Usado com o filtro «Segundo o meu ginásio».
Series semanales ponderadas|Weighted weekly sets|Séries hebdomadaires pondérées|Séries semanais ponderadas
Siguiente|Next|Suivant|Seguinte
sin entrenos esta semana|no workouts this week|aucune séance cette semaine|sem treinos esta semana
Sin límite|No limit|Sans limite|Sem limite
Sin series esta semana.|No sets this week.|Aucune série cette semaine.|Sem séries esta semana.
Sin series hoy con marca previa para comparar.|No sets today with a previous mark to compare.|Aucune série aujourd’hui avec une marque précédente à comparer.|Sem séries hoje com marca anterior para comparar.
Sin series registradas de este músculo.|No sets logged for this muscle.|Aucune série enregistrée pour ce muscle.|Sem séries registadas deste músculo.
Son diferencias de estímulo y ejecución, no un ranking.|These are differences in stimulus and execution, not a ranking.|Ce sont des différences de stimulus et d’exécution, pas un classement.|São diferenças de estímulo e execução, não um ranking.
Son estimaciones orientativas, no un consejo médico.|These are rough estimates, not medical advice.|Ce sont des estimations indicatives, pas un avis médical.|São estimativas orientativas, não um conselho médico.
También puedes progresar con +1-2 repeticiones, más series o menos RIR.|You can also progress with +1-2 reps, more sets or lower RIR.|Tu peux aussi progresser avec +1-2 répétitions, plus de séries ou moins de RIR.|Também podes progredir com +1-2 repetições, mais séries ou menos RIR.
Tendencia del volumen|Volume trend|Tendance du volume|Tendência do volume
Términos|Terms|Conditions|Termos
Tiempo para cocinar|Cooking time|Temps pour cuisiner|Tempo para cozinhar
Tiempo por sesión (min)|Time per session (min)|Temps par séance (min)|Tempo por sessão (min)
Tipo de alimentación|Diet type|Type d’alimentation|Tipo de alimentação
Titán|Titan|Titan|Titã
Todavía no hay objetivo. Puedes calcularlo desde tu perfil o escribirlo tú.|No target yet. You can calculate it from your profile or type it in.|Pas encore d’objectif. Tu peux le calculer depuis ton profil ou le saisir.|Ainda não há objetivo. Podes calculá-lo a partir do teu perfil ou escrevê-lo tu.
Tú ahora vs el mes anterior|You now vs last month|Toi maintenant vs le mois dernier|Tu agora vs o mês anterior
TU MES EN VOLTA|YOUR MONTH IN VOLTA|TON MOIS SUR VOLTA|O TEU MÊS NO VOLTA
Tu nombre de usuario será tu identificador único en VOLTA. De 3 a 20 caracteres: letras, números, _ y .|Your username will be your unique ID on VOLTA. 3 to 20 characters: letters, numbers, _ and .|Ton nom d’utilisateur sera ton identifiant unique sur VOLTA. De 3 à 20 caractères : lettres, chiffres, _ et .|O teu nome de utilizador será o teu identificador único no VOLTA. De 3 a 20 caracteres: letras, números, _ e .
Tu perfil|Your profile|Ton profil|O teu perfil
Tu Progreso Mitológico|Your Mythological Progress|Ta progression mythologique|O teu progresso mitológico
Tu rango actual:|Your current rank:|Ton rang actuel :|O teu nível atual:
Últimas 12 semanas|Last 12 weeks|12 dernières semaines|Últimas 12 semanas
Últimas 4 semanas|Last 4 weeks|4 dernières semaines|Últimas 4 semanas
Últimas 8 semanas|Last 8 weeks|8 dernières semaines|Últimas 8 semanas
Últimas sesiones|Recent sessions|Dernières séances|Últimas sessões
Ver más · cómo se calcula|See more · how it’s calculated|Voir plus · comment c’est calculé|Ver mais · como se calcula
Ver todo el detalle ›|See full details ›|Voir tout le détail ›|Ver todo o detalhe ›
Versión 1.0.0|Version 1.0.0|Version 1.0.0|Versão 1.0.0
Volta solo muestra tus datos reales.|Volta only shows your real data.|Volta n’affiche que tes vraies données.|O Volta só mostra os teus dados reais.
Volumen|Volume|Volume|Volume
Volumen 7d|Volume 7d|Volume 7 j|Volume 7d
volumen bajo|low volume|volume faible|volume baixo
VOLUMEN BAJO|LOW VOLUME|VOLUME FAIBLE|VOLUME BAIXO
VOLUMEN ÓPTIMO|OPTIMAL VOLUME|VOLUME OPTIMAL|VOLUME ÓTIMO
Voluntad de Hierro|Iron Will|Volonté de fer|Vontade de Ferro
Aductores|Adductors|Adducteurs|Adutores
Abductores|Abductors|Abducteurs|Abdutores
⚖ Comparar|⚖ Compare|⚖ Comparer|⚖ Comparar
Material|Equipment|Matériel|Material
Nivel|Level|Niveau|Nível
🔴 Experto|🔴 Expert|🔴 Expert|🔴 Especialista
Tipo|Type|Type|Tipo
Libre|Free|Libre|Livre
Ordenar|Sort|Trier|Ordenar
🕘 Recientes|🕘 Recent|🕘 Récents|🕘 Recentes
🆕 Nuevos|🆕 New|🆕 Nouveaux|🆕 Novos
Equipamiento|Equipment|Équipement|Equipamento
Enfoque prioritario|Main focus|Priorité|Foco prioritário
Molestias o lesiones|Pain or injuries|Gênes ou blessures|Dores ou lesões
Generar rutinas|Generate routines|Générer des routines|Gerar rotinas
Ej. hombro, rodilla, lumbar|E.g. shoulder, knee, lower back|Ex. épaule, genou, lombaires|Ex. ombro, joelho, lombar
RIR (esfuerzo)|RIR (effort)|RIR (effort)|RIR (esforço)
Calentam.|Warm-up|Échauff.|Aquec.
Aproxim.|Ramp-up|Approche|Aprox.
Efectiva|Effective|Efficace|Efetiva
Fallo|Failure|Échec|Falha
Resumen|Overview|Résumé|Resumo
🏋️ Fuerza|🏋️ Strength|🏋️ Force|🏋️ Força
🔥 Rendimiento|🔥 Performance|🔥 Performance|🔥 Rendimento
1RM estim.|Est. 1RM|1RM estim.|1RM estim.
1RM estimado|Estimated 1RM|1RM estimé|1RM estimado
Vegetariana|Vegetarian|Végétarienne|Vegetariana
Vegana|Vegan|Végane|Vegana
gluten|gluten|gluten|glúten
huevo|egg|œuf|ovo
pescado|fish|poisson|peixe
marisco|shellfish|fruits de mer|marisco
soja|soy|soja|soja
cacahuete|peanut|cacahuète|amendoim
Intolerancias|Intolerances|Intolérances|Intolerâncias
Lactosa|Lactose|Lactose|Lactose
Gluten|Gluten|Gluten|Glúten
Presupuesto|Budget|Budget|Orçamento
Bajo|Low|Bas|Baixo
Alto|High|Élevé|Alto
Sustituciones|Swaps|Remplacements|Substituições
Cantidad (g)|Amount (g)|Quantité (g)|Quantidade (g)
🧠 Macros similares ★|🧠 Similar macros ★|🧠 Macros similaires ★|🧠 Macros semelhantes ★
🥗 Libre|🥗 Any|🥗 Libre|🥗 Livre
🥑 Menos grasa|🥑 Less fat|🥑 Moins de graisses|🥑 Menos gordura
🌱 Vegetariano|🌱 Vegetarian|🌱 Végétarien|🌱 Vegetariano
🌿 Vegano|🌿 Vegan|🌿 Végane|🌿 Vegano
ALTERNATIVAS|ALTERNATIVES|ALTERNATIVES|ALTERNATIVAS
Preferencias nutricionales|Nutrition preferences|Préférences nutritionnelles|Preferências nutricionais
Entrenos|Workouts|Séances|Treinos
Adherencia|Adherence|Assiduité|Adesão
Semanas|Weeks|Semaines|Semanas
Altura (cm)|Height (cm)|Taille (cm)|Altura (cm)
Altura|Height|Taille|Altura
Ganar masa muscular|Build muscle|Prendre du muscle|Ganhar massa muscular
Perder grasa|Lose fat|Perdre du gras|Perder gordura
Mejorar fuerza|Get stronger|Gagner en force|Melhorar a força
sesiones|sessions|séances|sessões
kg totales|total kg|kg au total|kg totais
Entrenamiento|Workout|Séance|Treino
Exportar|Export|Exporter|Exportar
Importar|Import|Importer|Importar
Distancia|Distance|Distance|Distância
Datos personales|Personal details|Données personnelles|Dados pessoais
Preguntas frecuentes|FAQ|Questions fréquentes|Perguntas frequentes
Entrenamientos|Workouts|Entraînements|Treinos
Contacto / soporte|Contact / support|Contact / assistance|Contacto / suporte
Fuentes|Sources|Sources|Fontes
Valores nutricionales aproximados.|Approximate nutrition values.|Valeurs nutritionnelles approximatives.|Valores nutricionais aproximados.
Enfoque|Focus|Objectif|Foco
Ej. Torso Fuerza|E.g. Upper Strength|Ex. Haut du corps force|Ex. Tronco Força
Enviar|Send|Envoyer|Enviar
Todo|All|Tout|Tudo
Frecuencia|Frequency|Fréquence|Frequência
🟢 Rendimiento similar|🟢 Similar performance|🟢 Performance similaire|🟢 Rendimento semelhante
Comparar periodos|Compare periods|Comparer des périodes|Comparar períodos
Ejemplo|Example|Exemple|Exemplo
Veces/sem|Times/wk|Fois/sem|Vezes/sem
Restablecer valores recomendados|Reset recommended values|Rétablir les valeurs recommandées|Repor valores recomendados
🔥 Muy desarrollado|🔥 Very developed|🔥 Très développé|🔥 Muito desenvolvido
RESUMEN SEMANAL|WEEKLY SUMMARY|RÉSUMÉ DE LA SEMAINE|RESUMO SEMANAL
⚡ Fuerza|⚡ Strength|⚡ Force|⚡ Força
XP total|Total XP|XP totale|XP total
Mayor progreso|Biggest progress|Plus grand progrès|Maior progresso
Racha / cumplimiento|Streak / adherence|Série / assiduité|Sequência / cumprimento
Fuerza|Strength|Force|Força
Consistencia|Consistency|Régularité|Consistência
Restablecer|Reset|Rétablir|Repor
Principal|Main|Principal|Principal
Dificultad|Difficulty|Difficulté|Dificuldade
Banco|Bench|Banc|Banco
Plano — 0°|Flat — 0°|Plat — 0°|Plano — 0°
Ajustable|Adjustable|Réglable|Ajustável
Lateralidad|Laterality|Latéralité|Lateralidade
Diferencias|Differences|Différences|Diferenças
☑ Poleas|☑ Cables|☑ Poulies|☑ Polias
☑ Banco|☑ Bench|☑ Banc|☑ Banco
Objetivos nutricionales|Nutrition targets|Objectifs nutritionnels|Objetivos nutricionais
No especificado|Not specified|Non précisé|Não especificado
Sexo|Sex|Sexe|Sexo
Actividad|Activity|Activité|Atividade
Editar perfil|Edit profile|Modifier le profil|Editar perfil
Ajustar a mano|Adjust manually|Ajuster à la main|Ajustar à mão
Carbohidratos (g)|Carbs (g)|Glucides (g)|Hidratos (g)
Grasas (g)|Fat (g)|Lipides (g)|Gorduras (g)
Fibra (g)|Fibre (g)|Fibres (g)|Fibra (g)
Agua (ml)|Water (ml)|Eau (ml)|Água (ml)
Metabolismo basal|Basal metabolism|Métabolisme de base|Metabolismo basal
Gasto diario|Daily expenditure|Dépense quotidienne|Gasto diário
Hidratos|Carbs|Glucides|Hidratos
Fibra|Fibre|Fibres|Fibra
Agua|Water|Eau|Água
Crear cuenta|Create account|Créer un compte|Criar conta
Ya tengo cuenta|I already have an account|J’ai déjà un compte|Já tenho conta
Cargando…|Loading…|Chargement…|A carregar…
Fuerza Divina|Divine Strength|Force divine|Força Divina
Poder Puro|Pure Power|Puissance pure|Poder Puro
Mortal (I-V)|Mortal (I-V)|Mortel (I-V)|Mortal (I-V)
Prot.|Prot.|Prot.|Prot.
Carb.|Carbs|Gluc.|Hidr.
Ingredientes|Ingredients|Ingrédients|Ingredientes
Sustituir|Swap|Remplacer|Substituir
🔄 Crear alternativa|🔄 Create alternative|🔄 Créer une alternative|🔄 Criar alternativa
Vista frontal|Front view|Vue de face|Vista frontal
Vista posterior|Back view|Vue de dos|Vista posterior
— principal|— main|— principal|— principal
Material: Barra frente a Mancuernas.|Equipment: Barbell vs Dumbbells.|Matériel : barre face aux haltères.|Material: Barra frente a Halteres.
Banco: Plano — 0° frente a Ajustable.|Bench: Flat — 0° vs Adjustable.|Banc : plat — 0° face à réglable.|Banco: Plano — 0° frente a Ajustável.
romboides|rhomboids|rhomboïdes|romboides
trapecio|trapezius|trapèze|trapézio
deltoides anterior|front delts|deltoïdes antérieurs|deltoide anterior
Hombros · deltoides anterior|Shoulders · front delts|Épaules · deltoïdes antérieurs|Ombros · deltoide anterior
Rango Máximo / El Destructor|Top Rank / God of Strength|Rang suprême / Dieu de la Force|Nível Máximo / Deus da Força
Anti-trampa: un registro que se aleja mucho de tu historial (más de +35% de 1RM de golpe o fuera de lo razonable) se marca como dato inusual y no cuenta para el rango. Para subir de rango hace falta historial suficiente, no una sola marca.|Anti-cheat: an entry far from your history (over +35% 1RM at once or outside what’s reasonable) is flagged as unusual and doesn’t count towards your rank. Ranking up needs enough history, not a single mark.|Anti-triche : une saisie très éloignée de ton historique (plus de +35 % de 1RM d’un coup ou hors du raisonnable) est signalée comme inhabituelle et ne compte pas pour le rang. Pour monter, il faut un historique suffisant, pas une seule marque.|Antibatota: um registo muito longe do teu histórico (mais de +35% de 1RM de uma vez ou fora do razoável) é marcado como invulgar e não conta para o nível. Para subir de nível é preciso histórico suficiente, não uma só marca.
Aún no hay ejercicios con estándar de fuerza para este músculo (hoy: press banca, sentadilla, press militar, remo, dominadas, hip thrust y algunos aislamientos). Su score usa volumen, consistencia y frecuencia.|There are no exercises with a strength standard for this muscle yet (currently: bench press, squat, overhead press, row, pull-ups, hip thrust and some isolation moves). Its score uses volume, consistency and frequency.|Pas encore d’exercice avec un standard de force pour ce muscle (actuellement : développé couché, squat, développé militaire, rowing, tractions, hip thrust et quelques exercices d’isolation). Son score utilise le volume, la régularité et la fréquence.|Ainda não há exercícios com padrão de força para este músculo (hoje: supino, agachamento, press militar, remada, elevações, hip thrust e alguns de isolamento). O seu score usa volume, consistência e frequência.
Series efectivas por semana y frecuencia deseada. Por defecto se ajustan a tu objetivo (Ganar masa muscular) y nivel (Intermedio); cámbialos como quieras. Son orientativos, no una verdad médica universal.|Effective sets per week and desired frequency. By default they match your goal (Build muscle) and level (Intermediate); change them as you like. They are guidelines, not a universal medical truth.|Séries efficaces par semaine et fréquence souhaitée. Par défaut, elles suivent ton objectif (Prise de muscle) et ton niveau (Intermédiaire) ; modifie-les à ta guise. Elles sont indicatives, pas une vérité médicale universelle.|Séries efetivas por semana e frequência desejada. Por defeito ajustam-se ao teu objetivo (Ganhar massa muscular) e nível (Intermédio); muda-os como quiseres. São orientativos, não uma verdade médica universal.
volumen|volume|volume|volume
fuerza|strength|force|força
progresión|progression|progression|progressão
consistencia|consistency|régularité|consistência
frecuencia|frequency|fréquence|frequência
récords|records|records|recordes
edad|age|âge|idade
altura|height|taille|altura
peso|weight|poids|peso
nivel de actividad|activity level|niveau d’activité|nível de atividade
bíceps|biceps|biceps|bíceps
tríceps|triceps|triceps|tríceps
gemelos|calves|mollets|gémeos
pecho|chest|pectoraux|peito
espalda|back|dos|costas
hombros|shoulders|épaules|ombros
cuádriceps|quads|quadriceps|quadríceps
isquiosurales|hamstrings|ischio-jambiers|isquiotibiais
glúteos|glutes|fessiers|glúteos
antebrazos|forearms|avant-bras|antebraços
trapecios|traps|trapèzes|trapézios
aductores|adductors|adducteurs|adutores
abductores|abductors|abducteurs|abdutores
lumbar|lower back|lombaires|lombar
MORTAL|MORTAL|MORTEL|MORTAL
ESPARTANO|SPARTAN|SPARTIATE|ESPARTANO
HÉRCULES|HERCULES|HERCULE|HÉRCULES
APOLO|APOLLO|APOLLON|APOLO
TITÁN|TITAN|TITAN|TITÃ
Espartano|Spartan|Spartiate|Espartano
Apolo|Apollo|Apollon|Apolo
Mortal|Mortal|Mortel|Mortal
En calibración|Calibrating|En calibrage|Em calibração
Sin datos|No data|Pas de données|Sem dados
En calibración · ⚪ Sin datos|Calibrating · ⚪ No data|En calibrage · ⚪ Pas de données|Em calibração · ⚪ Sem dados
`);
  const P = window.vxAddTrPat;
  // con cifras
  P(/^(-?[\d.,]+ kg) desde el primer registro$/, ['$1 since your first entry', '$1 depuis la première mesure', '$1 desde o primeiro registo']);
  P(/^· ([\d.,]+) XP\. Subes de nivel \(I–V\) con tu fuerza relativa\.$/, ['· $1 XP. You level up (I–V) with your relative strength.', '· $1 XP. Tu montes de niveau (I–V) avec ta force relative.', '· $1 XP. Sobes de nível (I–V) com a tua força relativa.']);
  P(/^≈ \+([\d.,]+) kg de 1RM estimado$/, ['≈ +$1 kg estimated 1RM', '≈ +$1 kg de 1RM estimé', '≈ +$1 kg de 1RM estimado']);
  P(/^≈ \+([\d.,]+) kg de 1RM estimado · o \+(\d+) repeticiones con tu peso actual$/, ['≈ +$1 kg estimated 1RM · or +$2 reps at your current weight', '≈ +$1 kg de 1RM estimé · ou +$2 répétitions à ta charge actuelle', '≈ +$1 kg de 1RM estimado · ou +$2 repetições com o teu peso atual']);
  P(/^([\d.,]+) \/ ([\d.,]+) XP · siguiente: (.+)$/, ['$1 / $2 XP · next: $3', '$1 / $2 XP · suivant : $3', '$1 / $2 XP · seguinte: $3']);
  P(/^([\d.,]+) kg de carga · ([\d.,]+)% de peso · \+(\d+) reps · volumen ([\d.,]+)%$/, ['$1 kg load · $2% weight · +$3 reps · volume $4%', '$1 kg de charge · $2 % de poids · +$3 reps · volume $4 %', '$1 kg de carga · $2% de peso · +$3 reps · volume $4%']);
  P(/^(\d+) series efectivas · objetivo ([\d-]+) \((\d+)% del mínimo\)$/, ['$1 effective sets · target $2 ($3% of minimum)', '$1 séries efficaces · objectif $2 ($3 % du minimum)', '$1 séries efetivas · objetivo $2 ($3% do mínimo)']);
  P(/^(\d+) años?$/, ['$1 yr', '$1 an', '$1 ano']);
  P(/^(\d+) MESES · volumen$/, ['$1 MONTHS · volume', '$1 MOIS · volume', '$1 MESES · volume']);
  P(/^(\d+) meses vs (\d+) anteriores$/, ['$1 months vs previous $2', '$1 mois vs $2 précédents', '$1 meses vs $2 anteriores']);
  P(/^7d · hoy (\d+) · mes (\d+)$/, ['7d · today $1 · month $2', '7 j · aujourd’hui $1 · mois $2', '7d · hoje $1 · mês $2']);
  P(/^(\d+) ejercicios · (\d+) series · ([\d.,]+ kg)$/, ['$1 exercises · $2 sets · $3', '$1 exercices · $2 séries · $3', '$1 exercícios · $2 séries · $3']);
  P(/^Ahora ≈ ([\d.,]+ kg)\. Es una estimación \(Epley\), no una medición real; pierde precisión por encima de ~10 repeticiones\.$/, ['Now ≈ $1. It’s an estimate (Epley), not a real measurement; it loses accuracy above ~10 reps.', 'Maintenant ≈ $1. C’est une estimation (Epley), pas une mesure réelle ; elle perd en précision au-delà de ~10 répétitions.', 'Agora ≈ $1. É uma estimativa (Epley), não uma medição real; perde precisão acima de ~10 repetições.']);
  P(/^Ahora: (.+)$/, ['Now: $1', 'Maintenant : $1', 'Agora: $1']);
  P(/^Ajusta los ratios 1RM \/ peso corporal\. Peso corporal usado: ([\d.,]+ kg)\.$/, ['Adjust the 1RM / bodyweight ratios. Bodyweight used: $1.', 'Ajuste les ratios 1RM / poids de corps. Poids utilisé : $1.', 'Ajusta os rácios 1RM / peso corporal. Peso corporal usado: $1.']);
  P(/^(.+) · 1RM est\.$/, ['$1 · est. 1RM', '$1 · 1RM est.', '$1 · 1RM est.']);
  P(/^De rango \((.+)\)$/, ['Rank ($1)', 'De rang ($1)', 'De nível ($1)']);
  P(/^Ejercicios · mejor: (.+)$/, ['Exercises · best: $1', 'Exercices · meilleur : $1', 'Exercícios · melhor: $1']);
  P(/^Ejercicios \((\d+)\)$/, ['Exercises ($1)', 'Exercices ($1)', 'Exercícios ($1)']);
  P(/^Ejercicios Favoritos \((\d+)\)$/, ['Favourite exercises ($1)', 'Exercices favoris ($1)', 'Exercícios favoritos ($1)']);
  P(/^Hace 1 año vs ahora \((\d+) días\): (.+) de volumen\.$/, ['1 year ago vs now ($1 days): $2 volume.', 'Il y a 1 an vs maintenant ($1 jours) : $2 de volume.', 'Há 1 ano vs agora ($1 dias): $2 de volume.']);
  P(/^Hace (\d+) días: (.+)$/, ['$1 days ago: $2', 'Il y a $1 jours : $2', 'Há $1 dias: $2']);
  P(/^Has realizado (\d+) de las ([\d-]+) series de tu rango objetivo\.$/, ['You’ve done $1 of the $2 sets in your target range.', 'Tu as fait $1 des $2 séries de ta plage cible.', 'Fizeste $1 das $2 séries do teu intervalo objetivo.']);
  P(/^máx (.+)$/, ['max $1', 'max $1', 'máx $1']);
  P(/^último (.+)$/, ['latest $1', 'dernier $1', 'último $1']);
  P(/^Para calcular tu objetivo falta: (.+)\.$/, ['To calculate your target we still need: $1.', 'Pour calculer ton objectif, il manque : $1.', 'Para calcular o teu objetivo falta: $1.']);
  P(/^Peso: ([\d.,]+ kg) · Reps: (.+) · Volumen sesión: ([\d.,]+ kg)$/, ['Weight: $1 · Reps: $2 · Session volume: $3', 'Charge : $1 · Reps : $2 · Volume de séance : $3', 'Peso: $1 · Reps: $2 · Volume da sessão: $3']);
  P(/^Por defecto según tu objetivo: (.+?)\. Fuerza y progresión pesan más en fuerza; volumen en hipertrofia; consistencia en pérdida de grasa\.$/, ['Default for your goal: $1. Strength and progression weigh more for strength; volume for hypertrophy; consistency for fat loss.', 'Par défaut selon ton objectif : $1. Force et progression comptent plus pour la force ; le volume pour l’hypertrophie ; la régularité pour la perte de graisse.', 'Predefinido segundo o teu objetivo: $1. Força e progressão pesam mais na força; volume na hipertrofia; consistência na perda de gordura.']);
  P(/^Punto fuerte: (.+) \((\d+)\)\. A mejorar: (.+) \((\d+)\)\.$/, ['Strong point: $1 ($2). To improve: $3 ($4).', 'Point fort : $1 ($2). À améliorer : $3 ($4).', 'Ponto forte: $1 ($2). A melhorar: $3 ($4).']);
  P(/^🔥 Muy desarrollado\. Punto fuerte: (.+) \((\d+)\)\. A mejorar: (.+) \((\d+)\)\.$/, ['🔥 Very developed. Strong point: $1 ($2). To improve: $3 ($4).', '🔥 Très développé. Point fort : $1 ($2). À améliorer : $3 ($4).', '🔥 Muito desenvolvido. Ponto forte: $1 ($2). A melhorar: $3 ($4).']);
  P(/^Región: (.+) frente a (.+)\.$/, ['Region: $1 vs $2.', 'Région : $1 face à $2.', 'Região: $1 frente a $2.']);
  P(/^Series efectivas por semana y frecuencia deseada\. Por defecto se ajustan a tu objetivo \((.+)\) y nivel \((.+)\); cámbialos como quieras\. Son orientativos\.?$/, ['Effective sets per week and desired frequency. By default they match your goal ($1) and level ($2); change them as you like. They are guidelines.', 'Séries efficaces par semaine et fréquence souhaitée. Par défaut, elles suivent ton objectif ($1) et ton niveau ($2) ; modifie-les à ta guise. Elles sont indicatives.', 'Séries efetivas por semana e frequência desejada. Por defeito ajustam-se ao teu objetivo ($1) e nível ($2); muda-os como quiseres. São orientativos.']);
  P(/^Te faltan ~(\d+) series para el mínimo de tu objetivo \(([\d-]+)\)\.$/, ['You’re ~$1 sets short of your target minimum ($2).', 'Il te manque ~$1 séries pour le minimum de ton objectif ($2).', 'Faltam-te ~$1 séries para o mínimo do teu objetivo ($2).']);
  P(/^Tu marca: (.+)$/, ['Your best: $1', 'Ta marque : $1', 'A tua marca: $1']);
  P(/^Tu mayor progreso de volumen esta semana ha sido en (.+?)\.(.*)$/, ['Your biggest volume gain this week was in $1.$2', 'Ta plus forte progression de volume cette semaine : $1.$2', 'O teu maior progresso de volume esta semana foi em $1.$2']);
  P(/^ Has hecho menos series de (.+) que tu objetivo configurado\.$/, [' You did fewer sets of $1 than your set target.', ' Tu as fait moins de séries de $1 que ton objectif.', ' Fizeste menos séries de $1 do que o teu objetivo.']);
  P(/^Valores nutricionales aproximados · (\d+) ración · (\d+) min$/, ['Approximate nutrition values · $1 serving · $2 min', 'Valeurs nutritionnelles approximatives · $1 portion · $2 min', 'Valores nutricionais aproximados · $1 dose · $2 min']);
  P(/^veces\/sem · objetivo (\d+)$/, ['times/wk · target $1', 'fois/sem · objectif $1', 'vezes/sem · objetivo $1']);
  P(/^Volumen ([+−-][\d.,]+%) · Fuerza ([+−-][\d.,]+%) · Cumplimiento (\d+%)$/, ['Volume $1 · Strength $2 · Adherence $3', 'Volume $1 · Force $2 · Assiduité $3', 'Volume $1 · Força $2 · Cumprimento $3']);
  P(/^🟢 Mejora · récord 1RM est\. ≈ (.+)$/, ['🟢 Improving · est. 1RM record ≈ $1', '🟢 Progression · record 1RM est. ≈ $1', '🟢 Melhoria · recorde 1RM est. ≈ $1']);
  P(/^(🟡|🟢) (.+) — secundario$/, ['$1 $2 — secondary', '$1 $2 — secondaire', '$1 $2 — secundário']);
  P(/^🟢 (.+)$/, ['🟢 $1', '🟢 $1', '🟢 $1']);
  P(/^(.+) · (\d+) g$/, ['$1 · $2 g', '$1 · $2 g', '$1 · $2 g']);
  P(/^≈ mismas calorías(.*)$/, ['≈ same calories$1', '≈ mêmes calories$1', '≈ mesmas calorias$1']);
  P(/^(.*) · ↑ más proteína \(\+(\d+) g\)(.*)$/, ['$1 · ↑ more protein (+$2 g)$3', '$1 · ↑ plus de protéines (+$2 g)$3', '$1 · ↑ mais proteína (+$2 g)$3']);
  P(/^(.*) · ≈ misma proteína(.*)$/, ['$1 · ≈ same protein$2', '$1 · ≈ mêmes protéines$2', '$1 · ≈ mesma proteína$2']);
  P(/^(.*) · ≈ mismos carbohidratos(.*)$/, ['$1 · ≈ same carbs$2', '$1 · ≈ mêmes glucides$2', '$1 · ≈ mesmos hidratos$2']);
  P(/^(.*) · ≈ misma grasa$/, ['$1 · ≈ same fat', '$1 · ≈ mêmes graisses', '$1 · ≈ mesma gordura']);
  P(/^(.*) · ↓ menos grasa \(−(\d+) g\)$/, ['$1 · ↓ less fat (−$2 g)', '$1 · ↓ moins de graisses (−$2 g)', '$1 · ↓ menos gordura (−$2 g)']);
  // explicación del cálculo del objetivo (fragmentos tras una etiqueta en negrita)
  P(/^: ([\d,]+) g\/kg \(([\d,]+) si ganas masa, ([\d,]+) si pierdes grasa\), con tope del (\d+) % de las kcal\.$/, [': $1 g/kg ($2 if gaining muscle, $3 if losing fat), capped at $4% of kcal.', ' : $1 g/kg ($2 pour prendre du muscle, $3 pour perdre du gras), plafonné à $4 % des kcal.', ': $1 g/kg ($2 se ganas massa, $3 se perdes gordura), com limite de $4% das kcal.']);
  P(/^: (\d+) g por cada ([\d.]+) kcal\.$/, [': $1 g per $2 kcal.', ' : $1 g pour $2 kcal.', ': $1 g por cada $2 kcal.']);
  P(/^: (\d+) % de las kcal \(mínimo ([\d,]+) g\/kg\)\.$/, [': $1% of kcal (minimum $2 g/kg).', ' : $1 % des kcal (minimum $2 g/kg).', ': $1% das kcal (mínimo $2 g/kg).']);
  P(/^: (\d+) ml por kg de peso\.$/, [': $1 ml per kg of bodyweight.', ' : $1 ml par kg de poids.', ': $1 ml por kg de peso.']);
  P(/^: el resto\.$/, [': the rest.', ' : le reste.', ': o resto.']);
  P(/^: fórmula de Mifflin–St Jeor = 10 × peso \(kg\) \+ 6,25 × altura \(cm\) − 5 × edad \+ 5 \(hombre\) o − 161 \(mujer\)\. Si no indicas el sexo se usa el valor medio\.?$/, [': Mifflin–St Jeor formula = 10 × weight (kg) + 6.25 × height (cm) − 5 × age + 5 (male) or − 161 (female). If you don’t give your sex, the average is used.', ' : formule de Mifflin–St Jeor = 10 × poids (kg) + 6,25 × taille (cm) − 5 × âge + 5 (homme) ou − 161 (femme). Sans sexe indiqué, la valeur moyenne est utilisée.', ': fórmula de Mifflin–St Jeor = 10 × peso (kg) + 6,25 × altura (cm) − 5 × idade + 5 (homem) ou − 161 (mulher). Se não indicares o sexo usa-se o valor médio.']);
  P(/^: ganar masa \+10 %, perder grasa −15 %, resto de objetivos mantenimiento\. En menores de 18 años no se aplica ajuste\. Mínimo 1\.200 kcal\.$/, [': gain muscle +10%, lose fat −15%, other goals maintenance. No adjustment under 18. Minimum 1,200 kcal.', ' : prise de muscle +10 %, perte de gras −15 %, autres objectifs maintien. Aucun ajustement avant 18 ans. Minimum 1 200 kcal.', ': ganhar massa +10 %, perder gordura −15 %, restantes objetivos manutenção. Abaixo dos 18 anos não há ajuste. Mínimo 1.200 kcal.']);
  P(/^= basal × factor de actividad \((.+)\)\.$/, ['= BMR × activity factor ($1).', '= métabolisme de base × facteur d’activité ($1).', '= basal × fator de atividade ($1).']);
  P(/^(-?[\d.,]+ kg) vs the previous measurement$/, ['$1 vs the previous measurement', '$1 par rapport à la mesure précédente', '$1 vs a medição anterior']);
  P(/^(MORTAL|ESPARTANO|HÉRCULES|APOLO|TITÁN|ZEUS|KRATOS) (I|II|III|IV|V)$/, ['$1 $2', '$1 $2', '$1 $2']);
  P(/^Aún no has registrado este ejercicio\. Sugerencia inicial de carga: (.+)$/, ['You haven’t logged this exercise yet. Suggested starting load: $1', 'Tu n’as pas encore enregistré cet exercice. Charge de départ suggérée : $1', 'Ainda não registaste este exercício. Carga inicial sugerida: $1']);
  P(/^: fórmula de Mifflin–St Jeor = 10 × peso \(kg\) \+ 6,25 × altura \(cm\) − 5 × edad \+ 5 \(hombre\) o − 161 \(mujer\)\. Si no indicas el sexo se usa el valor medio \((.+)\)\.$/, [': Mifflin–St Jeor formula = 10 × weight (kg) + 6.25 × height (cm) − 5 × age + 5 (male) or − 161 (female). If you don’t give your sex, the average is used ($1).', ' : formule de Mifflin–St Jeor = 10 × poids (kg) + 6,25 × taille (cm) − 5 × âge + 5 (homme) ou − 161 (femme). Sans sexe indiqué, la valeur moyenne est utilisée ($1).', ': fórmula de Mifflin–St Jeor = 10 × peso (kg) + 6,25 × altura (cm) − 5 × idade + 5 (homem) ou − 161 (mulher). Se não indicares o sexo usa-se o valor médio ($1).']);
  P(/^(Mortal|Espartano|Hércules|Apolo|Titán|Zeus|Kratos) (I|II|III|IV|V)$/, ['$1 $2', '$1 $2', '$1 $2']);
  P(/^Dominio (I|II|III|IV|V)$/, ['Mastery $1', 'Maîtrise $1', 'Domínio $1']);
  P(/^Actual: (.+)$/, ['Current: $1', 'Actuel : $1', 'Atual: $1']);
  P(/^Antes: (.+)$/, ['Before: $1', 'Avant : $1', 'Antes: $1']);
  P(/^1RM estimado: (.+)$/, ['Estimated 1RM: $1', '1RM estimé : $1', '1RM estimado: $1']);
  P(/^Progreso (\d+%)$/, ['Progress $1', 'Progression $1', 'Progresso $1']);
  P(/^(\d+) sem · (\d+%)$/, ['$1 wk · $2', '$1 sem · $2', '$1 sem · $2']);
  P(/^(\d+) sem$/, ['$1 wk', '$1 sem', '$1 sem']);
  P(/^Rutinas Favoritas \((\d+)\)$/, ['Favourite routines ($1)', 'Routines favorites ($1)', 'Rotinas favoritas ($1)']);
  P(/^(\d+) kcal · P (\d+) · C (\d+) · G (\d+)$/, ['$1 kcal · P $2 · C $3 · F $4', '$1 kcal · P $2 · G $3 · L $4', '$1 kcal · P $2 · H $3 · G $4']);
  P(/^SUSTITUIR (.+)$/, ['SWAP $1', 'REMPLACER $1', 'SUBSTITUIR $1']);
  P(/^Secondary: (.+)$/, ['Secondary: $1', 'Secondaires : $1', 'Secundários: $1']);
})();
