/* VOLTA · recetas: pasos reales de preparación para todas las comidas y 36 comidas nuevas.
   Los ingredientes usan nombres de la base de alimentos (FDB) para que la app calcule cantidades y macros. */
(function () {
  'use strict';
  if (!Array.isArray(window.MEALS || (typeof MEALS !== 'undefined' && MEALS))) return;

  // ── Pasos de las comidas que ya traía la app: [es, en] por paso ──
  const STEPS = {
    pasta_pollo: [
      ['Pon a hervir agua con sal y cuece la pasta el tiempo del paquete (unos 10 min).', 'Boil salted water and cook the pasta as per the packet (about 10 min).'],
      ['Corta el pollo en dados, salpimienta y dóralo 6–7 min en una sartén con una cucharadita de aceite de oliva.', 'Dice the chicken, season and brown it for 6–7 min in a pan with a teaspoon of olive oil.'],
      ['Añade el tomate troceado y cocina 5 min a fuego medio hasta que se forme una salsa.', 'Add the chopped tomato and cook for 5 min over medium heat until it turns into a sauce.'],
      ['Escurre la pasta, mézclala con el pollo y la salsa y saltea 1 minuto.', 'Drain the pasta, toss it with the chicken and sauce and stir-fry for 1 minute.'],
      ['Sirve con orégano o albahaca por encima.', 'Serve topped with oregano or basil.'],
    ],
    salmon_patata: [
      ['Precalienta el horno a 200 °C.', 'Preheat the oven to 200 °C (400 °F).'],
      ['Corta la patata en gajos, alíñala con aceite, sal y pimentón y hornéala 20 min.', 'Cut the potato into wedges, season with oil, salt and paprika and roast for 20 min.'],
      ['Coloca el salmón y los espárragos en la bandeja junto a la patata y hornea 12 min más.', 'Add the salmon and asparagus to the tray and roast 12 more minutes.'],
      ['El salmón está listo cuando se separa en láminas al presionarlo con un tenedor.', 'The salmon is done when it flakes easily with a fork.'],
      ['Sirve con un chorrito de limón.', 'Serve with a squeeze of lemon.'],
    ],
    arroz_pollo: [
      ['Lava el arroz bajo el grifo hasta que el agua salga clara.', 'Rinse the rice under the tap until the water runs clear.'],
      ['Dora el pollo troceado en una cazuela con un poco de aceite, 5 min.', 'Brown the diced chicken in a pot with a little oil, 5 min.'],
      ['Añade el pimiento en tiras y sofríe 3 min.', 'Add the sliced pepper and sauté for 3 min.'],
      ['Incorpora el arroz y el doble de su volumen en agua o caldo; cocina tapado 15 min a fuego bajo.', 'Stir in the rice and twice its volume of water or stock; simmer covered for 15 min on low.'],
      ['Deja reposar 5 min tapado antes de servir.', 'Let it rest covered for 5 min before serving.'],
    ],
    tortilla_verduras: [
      ['Pica la cebolla y corta el calabacín en dados pequeños.', 'Chop the onion and dice the zucchini small.'],
      ['Póchalos 6–8 min en una sartén antiadherente con unas gotas de aceite hasta que estén tiernos.', 'Soften them for 6–8 min in a non-stick pan with a few drops of oil.'],
      ['Bate los huevos con una pizca de sal y añade las verduras.', 'Beat the eggs with a pinch of salt and add the vegetables.'],
      ['Cuaja a fuego medio-bajo 3 min por cada lado, ayudándote de un plato para darle la vuelta.', 'Set over medium-low heat for 3 min per side, using a plate to flip it.'],
    ],
    yogur_fruta: [
      ['Lava las fresas y córtalas por la mitad.', 'Wash the strawberries and halve them.'],
      ['Corta el plátano en rodajas.', 'Slice the banana.'],
      ['Sirve el yogur en un cuenco y coloca la fruta por encima.', 'Spoon the yogurt into a bowl and top with the fruit.'],
      ['Opcional: canela o unas semillas para dar textura.', 'Optional: cinnamon or a few seeds for crunch.'],
    ],
    avena_platano: [
      ['Pon la avena y la leche en un cazo (1 parte de avena por 2 de leche).', 'Put the oats and milk in a saucepan (1 part oats to 2 parts milk).'],
      ['Cuece a fuego medio 4–5 min removiendo hasta que espese.', 'Cook over medium heat for 4–5 min, stirring, until thick.'],
      ['Aplasta la mitad del plátano dentro para endulzar sin azúcar.', 'Mash half the banana into it to sweeten without sugar.'],
      ['Sirve con el resto del plátano en rodajas y canela.', 'Serve topped with the remaining banana slices and cinnamon.'],
    ],
    bowl_garbanzos: [
      ['Escurre y enjuaga los garbanzos cocidos.', 'Drain and rinse the cooked chickpeas.'],
      ['Saltéalos 5 min en una sartén con pimentón y comino hasta que estén dorados.', 'Sauté them for 5 min with paprika and cumin until golden.'],
      ['Cuece el brócoli al vapor 5 min, que quede verde y algo firme.', 'Steam the broccoli for 5 min so it stays green and slightly firm.'],
      ['Monta el bowl con garbanzos, brócoli y aguacate en láminas; aliña con limón y aceite.', 'Build the bowl with chickpeas, broccoli and sliced avocado; dress with lemon and oil.'],
    ],
    ensalada_atun: [
      ['Lava y trocea la lechuga; sécala bien.', 'Wash, chop and dry the lettuce well.'],
      ['Corta el tomate en gajos.', 'Cut the tomato into wedges.'],
      ['Escurre el atún y desmígalo por encima.', 'Drain the tuna and flake it over the top.'],
      ['Aliña con aceite de oliva, vinagre y una pizca de sal justo antes de servir.', 'Dress with olive oil, vinegar and a pinch of salt just before serving.'],
    ],
    tostada_aguacate: [
      ['Tuesta el pan hasta que esté crujiente.', 'Toast the bread until crisp.'],
      ['Machaca el aguacate con limón, sal y pimienta.', 'Mash the avocado with lemon, salt and pepper.'],
      ['Úntalo sobre la tostada y cubre con tomate en rodajas.', 'Spread it on the toast and top with sliced tomato.'],
      ['Termina con un hilo de aceite y semillas o escamas de chile.', 'Finish with a drizzle of oil and seeds or chili flakes.'],
    ],
    pavo_verduras: [
      ['Corta la zanahoria en rodajas finas y el calabacín en medias lunas.', 'Slice the carrot thinly and the zucchini into half-moons.'],
      ['Saltea la zanahoria 4 min y añade el calabacín 3 min más.', 'Stir-fry the carrot for 4 min, then add the zucchini for 3 more.'],
      ['Haz el pavo a la plancha 3–4 min por lado.', 'Grill the turkey for 3–4 min per side.'],
      ['Sirve el pavo en tiras sobre las verduras con hierbas provenzales.', 'Serve the turkey in strips over the vegetables with mixed herbs.'],
    ],
    lentejas: [
      ['Pica la cebolla y la zanahoria y sofríelas 5 min en una olla.', 'Chop the onion and carrot and sauté them in a pot for 5 min.'],
      ['Añade las lentejas lavadas, pimentón y agua que las cubra dos dedos.', 'Add the rinsed lentils, paprika and water to cover by two fingers.'],
      ['Cuece a fuego lento 30 min (o 10 min en olla rápida) hasta que estén tiernas.', 'Simmer for 30 min (or 10 min in a pressure cooker) until tender.'],
      ['Rectifica de sal y deja reposar 5 min: espesan solas.', 'Adjust the salt and let rest 5 min: they thicken on their own.'],
    ],
    batido_proteina: [
      ['Pon en la batidora la leche, el plátano troceado y un cacito de proteína.', 'Add the milk, sliced banana and a scoop of protein to the blender.'],
      ['Añade unos cubitos de hielo si lo quieres frío.', 'Add a few ice cubes if you like it cold.'],
      ['Bate 30 segundos hasta que quede cremoso y sírvelo al momento.', 'Blend for 30 seconds until creamy and drink straight away.'],
    ],
    requeson_manzana: [
      ['Lava la manzana, quítale el corazón y córtala en láminas.', 'Wash and core the apple and slice it thinly.'],
      ['Sirve el requesón en un plato junto a la manzana.', 'Serve the cottage cheese next to the apple.'],
      ['Espolvorea canela por encima.', 'Sprinkle with cinnamon.'],
    ],
    tarta_queso: [
      ['Precalienta el horno a 180 °C.', 'Preheat the oven to 180 °C (350 °F).'],
      ['Bate el requesón con los huevos y el edulcorante hasta que no queden grumos.', 'Whisk the cottage cheese with the eggs and sweetener until smooth.'],
      ['Vierte en un molde forrado con papel y hornea 35–40 min: el centro debe temblar un poco.', 'Pour into a lined tin and bake 35–40 min: the centre should still wobble slightly.'],
      ['Deja enfriar y refrigera al menos 2 h antes de cortar.', 'Let it cool and chill for at least 2 h before slicing.'],
      ['Sirve con fresas o mermelada sin azúcar.', 'Serve with strawberries or sugar-free jam.'],
    ],
    wrap_pollo: [
      ['Haz el pollo a la plancha con especias y córtalo en tiras.', 'Grill the chicken with spices and slice it into strips.'],
      ['Calienta la tortilla 20 segundos en la sartén para que no se rompa.', 'Warm the tortilla in the pan for 20 seconds so it doesn’t crack.'],
      ['Reparte la lechuga y el pollo en el centro; añade yogur o salsa ligera.', 'Lay the lettuce and chicken in the centre; add yogurt or a light sauce.'],
      ['Dobla los laterales, enrolla bien y corta por la mitad en diagonal.', 'Fold in the sides, roll tightly and cut in half diagonally.'],
    ],
    huevos_espinacas: [
      ['Saltea las espinacas 2 min en una sartén con ajo picado hasta que reduzcan.', 'Sauté the spinach with chopped garlic for 2 min until wilted.'],
      ['Haz dos huecos y casca un huevo en cada uno.', 'Make two wells and crack an egg into each.'],
      ['Tapa y cocina 3–4 min a fuego bajo hasta que la clara cuaje y la yema siga jugosa.', 'Cover and cook 3–4 min on low until the whites set and the yolks stay runny.'],
      ['Salpimienta y sirve al momento.', 'Season and serve straight away.'],
    ],
    tofu_arroz: [
      ['Seca el tofu con papel de cocina y córtalo en dados.', 'Pat the tofu dry with kitchen paper and cut into cubes.'],
      ['Dóralo 6–8 min en una sartén caliente hasta que esté crujiente por fuera.', 'Brown it for 6–8 min in a hot pan until crisp on the outside.'],
      ['Añade el pimiento en tiras y saltea 3 min; riega con un poco de salsa de soja.', 'Add the sliced pepper and stir-fry 3 min; splash in a little soy sauce.'],
      ['Sirve sobre el arroz cocido con sésamo por encima.', 'Serve over cooked rice topped with sesame seeds.'],
    ],
    merluza_horno: [
      ['Precalienta el horno a 200 °C.', 'Preheat the oven to 200 °C (400 °F).'],
      ['Corta la patata en rodajas finas y hornéala 15 min con un poco de aceite.', 'Slice the potato thinly and roast it for 15 min with a little oil.'],
      ['Coloca la merluza encima, añade rodajas de limón, ajo y perejil.', 'Lay the hake on top with lemon slices, garlic and parsley.'],
      ['Hornea 10–12 min hasta que el pescado esté blanco y jugoso.', 'Bake 10–12 min until the fish is white and moist.'],
    ],
    ternera_boniato: [
      ['Pela el boniato, córtalo en dados y ásalo 25 min a 200 °C.', 'Peel and dice the sweet potato and roast it for 25 min at 200 °C.'],
      ['Cuece el brócoli al vapor 5 min.', 'Steam the broccoli for 5 min.'],
      ['Sella la ternera en una sartén muy caliente 2–3 min por lado y déjala reposar 3 min.', 'Sear the beef in a very hot pan for 2–3 min per side and let it rest 3 min.'],
      ['Córtala en tiras finas a contraveta y sirve con el boniato y el brócoli.', 'Slice it thinly against the grain and serve with the sweet potato and broccoli.'],
    ],
    gazpacho: [
      ['Trocea los tomates maduros, el pepino pelado y el pimiento.', 'Roughly chop ripe tomatoes, peeled cucumber and pepper.'],
      ['Tritúralo todo con un diente de ajo, aceite de oliva, vinagre y sal.', 'Blend everything with a garlic clove, olive oil, vinegar and salt.'],
      ['Cuela si lo quieres muy fino y ajusta con agua fría.', 'Strain for a smoother texture and loosen with cold water.'],
      ['Enfría al menos 1 h y sirve con picadillo de pepino y pimiento.', 'Chill for at least 1 h and serve topped with diced cucumber and pepper.'],
    ],
    hummus_crudites: [
      ['Tritura los garbanzos cocidos con tahini, limón, ajo y un poco de su agua.', 'Blend cooked chickpeas with tahini, lemon, garlic and a little of their liquid.'],
      ['Añade aceite de oliva poco a poco hasta que quede cremoso.', 'Drizzle in olive oil until creamy.'],
      ['Corta la zanahoria y el pepino en bastones.', 'Cut the carrot and cucumber into sticks.'],
      ['Sirve el hummus con pimentón y aceite por encima, y los bastones para mojar.', 'Serve the hummus topped with paprika and oil, with the sticks for dipping.'],
    ],
  };

  // ── Comidas nuevas ──
  // id | nombres es~en~fr~pt | categorías | kcal | prot | carb | grasa | min | ingredientes | colores | alérgenos | recipiente
  const ROWS = `
tortitas_avena|Tortitas de avena y plátano~Oat & banana pancakes~Pancakes avoine-banane~Panquecas de aveia e banana|d,v,hp|410|22|55|11|15|avena,plátano,huevos,arándanos|#d9a35a,#f0d54a,#3d4f9a|gluten,huevo|plate
bowl_skyr|Bowl de skyr con frutos rojos~Skyr berry bowl~Bowl de skyr aux fruits rouges~Taça de skyr com frutos vermelhos|d,m,r,hp,v|320|28|38|6|5|skyr,frambuesas,arándanos,granola|#f6f3ee,#d7264d,#3d4f9a|lácteos,gluten|bowl
tostada_huevo|Tostada con huevo y aguacate~Egg & avocado toast~Tartine œuf-avocat~Tosta com ovo e abacate|d,r,v,hp|420|20|34|22|10|pan integral,huevos,aguacate,tomate|#c9a56a,#f2b51e,#8fbf4a|gluten,huevo|plate
porridge_manzana|Porridge de manzana y canela~Apple cinnamon porridge~Porridge pomme-cannelle~Papas de aveia com maçã e canela|d,e,v|360|13|62|7|10|avena,leche,manzana,nueces|#dcc39a,#c93a2a,#a8743f|gluten,lácteos,frutos secos|bowl
revuelto_pavo|Revuelto de claras con pavo y espinacas~Egg white, turkey & spinach scramble~Brouillade de blancs, dinde et épinards~Mexido de claras com peru e espinafres|d,hp,bc,r|260|38|6|8|8|claras,pavo,espinacas,tomate|#fbfaf4,#e9c891,#3f8a2a|huevo|plate
yogur_kiwi|Yogur griego con kiwi y almendras~Greek yogurt with kiwi & almonds~Yaourt grec, kiwi et amandes~Iogurte grego com kiwi e amêndoas|d,m,r,v|290|17|22|14|3|yogur griego,kiwi,almendras|#f7f4ec,#8fbf3a,#b07a45|lácteos,frutos secos|bowl
avena_nocturna|Avena nocturna con mango~Mango overnight oats~Overnight oats à la mangue~Overnight oats de manga|d,v,e|380|16|60|8|5|avena,bebida de avena,mango,yogur griego|#efe4cc,#f7a91e,#f7f4ec|gluten,lácteos|bowl
bowl_pollo_quinoa|Bowl de pollo y quinoa~Chicken quinoa bowl~Bowl poulet-quinoa~Bowl de frango e quinoa|c,hp|560|45|52|16|25|pollo,quinoa,aguacate,pepino|#e9c891,#e6d29a,#8fbf4a|-|bowl
salmon_arroz_brocoli|Salmón con arroz integral y brócoli~Salmon, brown rice & broccoli~Saumon, riz complet et brocoli~Salmão com arroz integral e brócolos|c,n,hp|610|40|55|24|25|salmón,arroz integral,brócoli,limón|#f08a5d,#e8dcc0,#3f7f2a|pescado|plate
pasta_bolonesa|Pasta integral a la boloñesa~Wholewheat bolognese~Pâtes complètes bolognaise~Massa integral à bolonhesa|c,hp,e|640|40|72|18|30|pasta integral,ternera magra,tomate,cebolla|#c9a05a,#7a3f22,#d9442f|gluten|plate
curry_garbanzos|Curry de garbanzos y espinacas~Chickpea & spinach curry~Curry de pois chiches aux épinards~Caril de grão-de-bico e espinafres|c,v,e|480|20|62|15|25|garbanzos,espinacas,tomate,basmati|#e0a24a,#3f8a2a,#f6f1e2|-|bowl
poke_atun|Poke de atún~Tuna poke bowl~Poké bowl au thon~Poke de atum|c,hp,r|530|36|58|15|15|atún,arroz,edamame,aguacate|#d97a7a,#f6f1e2,#6aa83a|pescado,soja|bowl
ensalada_lentejas|Ensalada de lentejas~Lentil salad~Salade de lentilles~Salada de lentilhas|c,v,e,bc,r|390|21|48|12|10|lentejas,tomate,pepino,pimiento|#9a5a2a,#d9442f,#8fbf4a|-|plate
burrito_bowl|Burrito bowl de pollo~Chicken burrito bowl~Burrito bowl au poulet~Burrito bowl de frango|c,hp|620|42|66|18|25|pollo,arroz,alubias,maíz|#e9c891,#f6f1e2,#c8a26a|-|bowl
dorada_horno|Dorada al horno con patatas~Baked sea bream with potatoes~Dorade au four et pommes de terre~Dourada no forno com batatas|c,n,hp|520|38|40|20|35|dorada,patata,cebolla,limón|#f5efe3,#e7c06a,#f4d22a|pescado|plate
wok_tofu|Wok de tofu con verduras y fideos de arroz~Tofu veggie rice-noodle stir-fry~Wok de tofu, légumes et nouilles de riz~Wok de tofu com legumes e massa de arroz|c,n,v|520|24|64|17|20|fideos de arroz,tofu,brócoli,pimiento|#f4ecd4,#f2e6c4,#3f7f2a|soja|bowl
cerdo_boniato|Solomillo de cerdo con boniato~Pork tenderloin with sweet potato~Filet mignon de porc et patate douce~Lombo de porco com batata-doce|c,hp|560|44|48|16|35|cerdo magro,boniato,judías verdes|#c98b5a,#ef8a3a,#6bb22e|-|plate
trucha_esparragos|Trucha a la plancha con espárragos~Grilled trout with asparagus~Truite grillée aux asperges~Truta grelhada com espargos|n,hp,bc|360|38|8|18|15|trucha,espárragos,limón|#f08a5d,#6bb22e,#f4d22a|pescado|plate
crema_calabaza|Crema de calabaza~Pumpkin soup~Velouté de courge~Creme de abóbora|n,v,e,bc|220|6|30|8|30|calabaza,zanahoria,cebolla,patata|#ef9a3a,#e8913a,#e8e2c8|-|bowl
tortilla_patata|Tortilla de patata ligera~Light Spanish omelette~Tortilla espagnole légère~Tortilha de batata leve|n,v,e|420|22|34|20|25|huevos,patata,cebolla|#f2cf5b,#e7c06a,#e8e2c8|huevo|plate
cesar_ligera|Ensalada César ligera~Light Caesar salad~Salade César légère~Salada César leve|n,hp,bc,r|390|40|18|17|15|pollo,lechuga,tomate,pan integral|#e9c891,#5fae3a,#c9a56a|gluten|plate
gambas_calabacin|Gambas al ajillo con calabacín~Garlic prawns with zucchini~Crevettes à l'ail et courgette~Camarão ao alho com curgete|n,hp,bc,r|300|32|10|15|15|gambas,calabacín,aceite de oliva|#f07a4a,#3c7a2a,#c8b02a|marisco|plate
pizza_tortilla|Pizza de tortilla integral~Wholewheat tortilla pizza~Pizza sur tortilla complète~Pizza de tortilha integral|n,r|450|28|40|18|15|tortilla de trigo,tomate,mozzarella,pavo|#ecd3a2,#d9442f,#fbf8ef|gluten,lácteos|pizza
berenjena_rellena|Berenjena rellena de ternera~Beef-stuffed aubergine~Aubergine farcie au bœuf~Beringela recheada com vitela|n,hp,bc|380|32|18|18|40|berenjena,ternera magra,tomate,mozzarella|#4a2a5a,#7a3f22,#d9442f|lácteos|plate
sardinas_ensalada|Sardinas con ensalada de rúcula~Sardines with rocket salad~Sardines et salade de roquette~Sardinhas com salada de rúcula|n,hp,e|380|28|8|26|10|sardina,rúcula,tomate|#9fb1bf,#5fae3a,#d9442f|pescado|plate
lubina_verduras|Lubina con verduras asadas~Sea bass with roasted vegetables~Bar et légumes rôtis~Robalo com legumes assados|n,hp,bc|410|36|22|19|30|lubina,calabacín,pimiento,cebolla|#f5efe3,#3c7a2a,#d9442f|pescado|plate
tortitas_cacahuete|Tortitas de arroz con crema de cacahuete y plátano~Rice cakes with peanut butter & banana~Galettes de riz, beurre de cacahuète et banane~Bolachas de arroz com manteiga de amendoim e banana|m,s,v,r|280|9|38|11|3|tortitas de arroz,crema de cacahuete,plátano|#e9d3a0,#b07a3a,#f6ecc2|cacahuete|ricecake
edamame_sal|Edamame con sal marina~Sea-salt edamame~Edamame au sel~Edamame com sal|s,v,hp,r,bc|180|17|10|8|6|edamame|#6aa83a,#8cc456,#f4f1ea|soja|bowl
mix_frutos_secos|Mix de frutos secos y arándanos~Nuts & blueberry mix~Mélange de noix et myrtilles~Mix de frutos secos e mirtilos|s,m,v,r|260|7|22|17|2|almendras,nueces,arándanos|#b07a45,#a8743f,#3d4f9a|frutos secos|bowl
batido_kefir|Batido verde de kéfir~Green kefir smoothie~Smoothie vert au kéfir~Batido verde de kefir|m,s,v,r|220|10|32|5|5|kéfir,espinacas,plátano,kiwi|#9cc76a,#f1dfa0,#8fbf3a|lácteos|glass
cottage_pina|Cottage con piña~Cottage cheese with pineapple~Cottage à l'ananas~Cottage com ananás|m,s,hp,bc,r|190|20|16|5|3|cottage,piña|#f4f1e6,#f4d34a,#8fbf4a|lácteos|bowl
huevos_cocidos|Huevos cocidos con tomate~Boiled eggs with tomato~Œufs durs et tomate~Ovos cozidos com tomate|s,hp,bc,r,e|180|13|4|11|12|claras,tomate|#fbfaf4,#f2b51e,#d9442f|huevo|plate
manzana_asada|Manzana asada con canela y nueces~Baked apple with cinnamon & walnuts~Pomme au four, cannelle et noix~Maçã assada com canela e nozes|p,v,e,bc|170|3|30|5|25|manzana,nueces,yogur griego|#c93a2a,#a8743f,#f7f4ec|frutos secos,lácteos|plate
helado_platano|Helado de plátano y frambuesa~Banana & raspberry nice cream~Glace banane-framboise~Gelado de banana e framboesa|p,v,e,bc|180|3|40|1|5|plátano,frambuesas,bebida de almendras|#f2dba0,#d7264d,#f1e8d8|frutos secos|bowl
fresas_skyr|Fresas con skyr y granola~Strawberries with skyr & granola~Fraises, skyr et granola~Morangos com skyr e granola|p,m,hp,r|230|18|30|4|4|skyr,fresas,granola|#f6f3ee,#d7263d,#d8c29a|lácteos,gluten|bowl
batido_frutos_rojos|Batido de frutos rojos y proteína~Berry protein shake~Shake protéiné aux fruits rouges~Batido de frutos vermelhos e proteína|m,s,hp,r|240|27|26|3|3|whey,fresas,frambuesas,leche desnatada|#d98aa0,#d7263d,#f3eee2|lácteos|glass
shakshuka|Shakshuka con pan de centeno~Shakshuka with rye bread~Shakshuka et pain de seigle~Shakshuka com pão de centeio|d,n,v,hp|430|24|38|20|20|huevos,tomate,pimiento,cebolla,pan de centeno|#c8361f,#f2b51e,#d9442f|huevo,gluten|bowl
crepes_proteicos|Crepes proteicos con fresas~Protein crêpes with strawberries~Crêpes protéinées aux fraises~Crepes proteicos com morangos|d,hp,v|390|32|42|10|15|claras,harina de avena,fresas,yogur griego|#e9cf9a,#d8323a,#f7f4ec|huevo,gluten,lácteos|plate
tostada_salmon|Tostada de salmón ahumado y queso fresco~Smoked salmon & cream cheese toast~Tartine saumon fumé et fromage frais~Tosta de salmão fumado e queijo fresco|d,r,hp|380|26|30|16|5|pan de centeno,salmón,queso fresco,pepino|#b88a55,#f08a5d,#f6f2e8|gluten,pescado,lácteos|plate
bowl_acai|Bowl de açaí con plátano y granola~Açaí bowl with banana & granola~Bowl d’açaí, banane et granola~Taça de açaí com banana e granola|d,m,v|420|10|70|11|8|plátano,arándanos,granola,frambuesas|#4b2350,#f0d54a,#c9a56a|gluten|bowl
burrito_desayuno|Burrito de desayuno con huevo y alubias~Breakfast burrito with egg & beans~Burrito petit-déj œuf et haricots~Burrito de pequeno-almoço com ovo e feijão|d,hp,e|520|30|52|20|15|tortilla de trigo,huevos,alubias,tomate,aguacate|#e6c48a,#f2b51e,#6b3a2a|gluten,huevo|plate
gofres_avena|Gofres de avena y proteína~Protein oat waffles~Gaufres avoine-protéine~Waffles de aveia e proteína|d,hp,v|400|30|46|9|15|avena,claras,plátano,arándanos|#d9a35a,#f0d54a,#3d4f9a|gluten,huevo|plate
huevos_turcos|Huevos turcos con yogur~Turkish eggs with yogurt~Œufs à la turque au yaourt~Ovos turcos com iogurte|d,v,hp,r|360|22|14|24|12|huevos,yogur griego,pan integral|#f7f4ec,#f2b51e,#c8361f|huevo,lácteos,gluten|bowl
porridge_cacao|Porridge proteico de cacao y plátano~Chocolate protein porridge~Porridge protéiné cacao-banane~Papas de aveia proteicas de cacau|d,hp,v|450|32|60|9|8|avena,leche,plátano,almendras|#6b4430,#f0d54a,#b07a45|gluten,lácteos,frutos secos|bowl
pollo_teriyaki|Pollo teriyaki con arroz y brócoli~Teriyaki chicken, rice & broccoli~Poulet teriyaki, riz et brocoli~Frango teriyaki com arroz e brócolos|c,n,hp|590|46|68|12|25|pollo,arroz,brócoli,sésamo|#a8551e,#f4efe2,#3f7f2a|soja,sésamo|plate
fajitas_pollo|Fajitas de pollo con pimientos~Chicken fajitas with peppers~Fajitas de poulet aux poivrons~Fajitas de frango com pimentos|c,n,hp,r|540|42|50|18|20|tortilla de trigo,pollo,pimiento,cebolla,aguacate|#e6c48a,#d9442f,#8fbf4a|gluten|plate
paella_marisco|Paella ligera de marisco~Light seafood paella~Paella légère aux fruits de mer~Paella ligeira de marisco|c,hp|560|36|72|12|40|arroz,gambas,calamar,pimiento,guisantes|#f2b51e,#e8745a,#5a9a3a|marisco|plate
lentejas_estofadas|Lentejas estofadas con verduras~Lentil and vegetable stew~Lentilles mijotées aux légumes~Lentilhas estufadas com legumes|c,v,e|480|26|70|8|35|lentejas,zanahoria,patata,cebolla,pimiento|#7a4a22,#e8913a,#e7c06a|-|bowl
albondigas_pavo|Albóndigas de pavo en salsa de tomate~Turkey meatballs in tomato sauce~Boulettes de dinde à la tomate~Almôndegas de peru com molho de tomate|c,n,hp|510|44|40|18|30|pavo,tomate,arroz integral,cebolla|#b4502f,#c8361f,#e8dcc0|huevo,gluten|bowl
merluza_salsa_verde|Merluza en salsa verde con patatas~Hake in green sauce with potatoes~Merlu sauce verte et pommes de terre~Pescada em molho verde com batatas|n,c,hp,bc|420|38|34|12|25|merluza,patata,guisantes,perejil|#f3ede0,#5a9a3a,#e7c06a|pescado,gluten|plate
pad_thai|Pad thai de pollo~Chicken pad thai~Pad thaï au poulet~Pad thai de frango|c,n,hp|580|40|66|16|25|fideos de arroz,pollo,huevos,cacahuetes,zanahoria|#f2d89a,#e9c891,#e8913a|huevo,cacahuete,soja|plate
chili_carne|Chili con carne y arroz~Chili con carne with rice~Chili con carne et riz~Chili com carne e arroz|c,n,hp,e|600|42|64|18|35|ternera magra,alubias,tomate,arroz,maíz|#8a2d1c,#6b3a2a,#f4efe2|-|bowl
hamburguesa_casera|Hamburguesa casera de ternera magra~Homemade lean beef burger~Burger maison au bœuf maigre~Hambúrguer caseiro de novilho magro|c,n,hp|610|45|50|24|20|pan integral,ternera magra,lechuga,tomate,cebolla|#c9883f,#7a3a22,#5aa832|gluten,lácteos|plate
risotto_setas|Risotto de setas y pollo~Mushroom & chicken risotto~Risotto aux champignons et poulet~Risotto de cogumelos e frango|c,n,hp|560|38|66|14|35|arroz,pollo,champiñones,cebolla|#efe2c2,#8a6a4a,#e9c891|lácteos|bowl
gnocchi_pesto|Gnocchi al pesto con tomates cherry~Pesto gnocchi with cherry tomatoes~Gnocchi au pesto et tomates cerises~Gnocchi ao pesto com tomate cherry|c,v,r|540|16|78|18|15|gnocchi,tomate,albahaca,mozzarella|#f1e2b8,#3f8a2a,#d8323a|gluten,lácteos,frutos secos|plate
salmon_teriyaki_bowl|Bowl de salmón teriyaki y aguacate~Teriyaki salmon & avocado bowl~Bowl saumon teriyaki et avocat~Bowl de salmão teriyaki e abacate|c,n,hp|640|38|62|26|25|salmón,arroz,aguacate,edamame,pepino|#f08a5d,#f4efe2,#8fbf4a|pescado,soja,sésamo|bowl
pollo_curry_coco|Pollo al curry con leche de coco~Coconut chicken curry~Poulet au curry et lait de coco~Frango de caril com leite de coco|c,n,hp|590|42|58|20|30|pollo,arroz,pimiento,espinacas|#e0a23a,#f4efe2,#3f8a2a|-|bowl
tacos_pescado|Tacos de pescado con col y lima~Fish tacos with slaw & lime~Tacos de poisson, chou et citron vert~Tacos de peixe com couve e lima|c,n,hp,r|480|34|48|16|20|tortilla de maíz,merluza,lechuga,aguacate,limón|#e8c46a,#f3ede0,#8fbf4a|pescado|plate
garbanzos_espinacas|Garbanzos con espinacas y huevo~Chickpeas with spinach & egg~Pois chiches aux épinards et œuf~Grão com espinafres e ovo|c,n,v,e|460|24|52|16|20|garbanzos,espinacas,huevos,tomate|#d8b26a,#3f8a2a,#f2b51e|huevo|bowl
pechuga_rellena|Pechuga rellena de espinacas y queso~Spinach & cheese stuffed chicken~Blanc de poulet farci épinards-fromage~Peito de frango recheado com espinafres e queijo|n,hp,bc|420|52|10|18|30|pollo,espinacas,mozzarella,calabacín|#e9c891,#3f8a2a,#f6f2e8|lácteos|plate
calamares_plancha|Calamares a la plancha con ensalada~Grilled squid with salad~Calamars grillés et salade~Lulas grelhadas com salada|n,hp,bc,r|320|34|12|14|15|calamar,lechuga,tomate,limón|#f3e7d6,#5aa832,#d8323a|marisco|plate
ensalada_quinoa_feta|Ensalada de quinoa, feta y granada~Quinoa, feta & pomegranate salad~Salade quinoa, feta et grenade~Salada de quinoa, feta e romã|c,n,v|470|18|52|20|20|quinoa,pepino,tomate,queso fresco,rúcula|#e6d29a,#b5203a,#f6f2e8|lácteos|bowl
tortilla_espinacas|Tortilla de espinacas y champiñones~Spinach & mushroom omelette~Omelette épinards-champignons~Omelete de espinafres e cogumelos|n,v,hp,bc,r|310|26|6|20|10|huevos,espinacas,champiñones|#f2c94c,#3f8a2a,#8a6a4a|huevo|plate
sopa_miso|Sopa miso con tofu y fideos~Miso soup with tofu & noodles~Soupe miso au tofu et nouilles~Sopa miso com tofu e massa|n,v,bc|340|20|42|9|15|tofu,fideos de arroz,espinacas,cebolla|#d9b77a,#f5f0e1,#3f8a2a|soja|bowl
pizza_coliflor|Pizza de base de coliflor~Cauliflower-crust pizza~Pizza pâte de chou-fleur~Pizza de base de couve-flor|n,v,bc|390|28|18|22|35|coliflor,huevos,mozzarella,tomate|#efe6cf,#c8361f,#f6f2e8|huevo,lácteos|plate
bacalao_pisto|Bacalao con pisto~Cod with ratatouille~Cabillaud et ratatouille~Bacalhau com pisto|n,hp,bc|380|36|22|14|30|bacalao,calabacín,pimiento,tomate,cebolla|#f3ede0,#c8361f,#5aa832|pescado|plate
wrap_atun|Wrap de atún y hummus~Tuna & hummus wrap~Wrap thon et houmous~Wrap de atum e húmus|c,r,hp,e|450|32|44|15|5|tortilla de trigo,atún,hummus,lechuga,tomate|#e6c48a,#c9a38a,#5aa832|gluten,pescado,sésamo|plate
ternera_brocoli|Salteado de ternera y brócoli~Beef & broccoli stir-fry~Sauté de bœuf au brocoli~Salteado de novilho com brócolos|c,n,hp,bc,r|470|42|38|16|20|ternera magra,brócoli,arroz,pimiento|#7a3a22,#3f7f2a,#f4efe2|soja|plate
tostada_cacahuete_fresa|Tostada de crema de cacahuete y fresas~Peanut butter & strawberry toast~Tartine beurre de cacahuète et fraises~Tosta de manteiga de amendoim e morangos|m,s,v,r|330|12|38|14|5|pan integral,crema de cacahuete,fresas|#c9a56a,#a8743f,#d8323a|gluten,cacahuete|plate
bolitas_energia|Bolitas energéticas de avena y dátil~Oat & date energy balls~Boules d’énergie avoine-datte~Bolinhas energéticas de aveia e tâmara|s,m,v|280|8|36|12|15|avena,dátiles,almendras,cacao|#7a5232,#d9a35a,#b07a45|gluten,frutos secos|plate
pudin_chia|Pudin de chía con mango~Mango chia pudding~Pudding de chia à la mangue~Pudim de chia com manga|m,p,v,d|300|10|34|14|5|bebida de almendras,chía,mango,yogur griego|#efe7d6,#f7a91e,#3a3a3a|frutos secos,lácteos|bowl
yogur_proteico_choco|Mousse proteica de chocolate~Protein chocolate mousse~Mousse protéinée au chocolat~Mousse proteica de chocolate|p,hp,r|230|28|18|5|5|yogur griego,cacao,frambuesas|#5a3a2a,#f7f4ec,#d7264d|lácteos|bowl
cheesecake_ligero|Cheesecake ligero de frutos rojos~Light berry cheesecake~Cheesecake léger aux fruits rouges~Cheesecake leve de frutos vermelhos|p,hp,v|310|22|30|11|40|queso fresco batido,huevos,frambuesas,avena|#f4ead2,#d7264d,#c9a56a|lácteos,huevo,gluten|plate
brownie_proteico|Brownie proteico de cacao~Protein cocoa brownie~Brownie protéiné au cacao~Brownie proteico de cacau|p,hp,v|260|18|26|9|30|cacao,claras,harina de avena,nueces|#4a2c1e,#6b4430,#a8743f|huevo,gluten,frutos secos|plate
batido_cafe|Batido proteico de café~Protein coffee shake~Shake protéiné au café~Batido proteico de café|s,d,hp,r|260|30|24|5|3|leche,plátano,avena|#a07450,#f3eee2,#f0d54a|lácteos,gluten|glass
batido_verde|Batido verde de piña y espinacas~Green pineapple & spinach smoothie~Smoothie vert ananas-épinards~Batido verde de ananás e espinafres|s,d,v,bc,r|210|8|40|3|5|piña,espinacas,manzana,pepino|#7fbf3a,#f7d24a,#3f8a2a|-|glass
`.trim();

  const NEW_STEPS = {
    tortitas_avena: [['Tritura 60 g de avena hasta hacer harina.', 'Blitz 60 g of oats into flour.'], ['Aplasta el plátano y mézclalo con 2 huevos y la harina de avena.', 'Mash the banana and mix it with 2 eggs and the oat flour.'], ['Calienta una sartén antiadherente a fuego medio con unas gotas de aceite.', 'Heat a non-stick pan over medium heat with a few drops of oil.'], ['Vierte porciones pequeñas y cocina 2 min por lado hasta que doren.', 'Pour in small rounds and cook 2 min per side until golden.'], ['Sirve con arándanos por encima.', 'Serve topped with blueberries.']],
    bowl_skyr: [['Pon el skyr en un cuenco y alísalo con una cuchara.', 'Spoon the skyr into a bowl and smooth it out.'], ['Lava las frambuesas y los arándanos con cuidado.', 'Gently rinse the raspberries and blueberries.'], ['Reparte la fruta por encima y termina con la granola para que cruja.', 'Top with the berries and finish with granola for crunch.']],
    tostada_huevo: [['Tuesta el pan integral.', 'Toast the wholemeal bread.'], ['Cuece el huevo 6–7 min (yema cremosa) o hazlo a la plancha.', 'Boil the egg for 6–7 min (jammy yolk) or fry it.'], ['Machaca el aguacate con sal y limón y úntalo en la tostada.', 'Mash the avocado with salt and lemon and spread it on the toast.'], ['Coloca el tomate en rodajas y el huevo encima; termina con pimienta.', 'Top with sliced tomato and the egg; finish with pepper.']],
    porridge_manzana: [['Ralla la mitad de la manzana y corta el resto en dados.', 'Grate half the apple and dice the rest.'], ['Cuece la avena con la leche y la manzana rallada 5 min removiendo.', 'Simmer the oats with the milk and grated apple for 5 min, stirring.'], ['Añade canela al gusto.', 'Add cinnamon to taste.'], ['Sirve con la manzana en dados y las nueces troceadas.', 'Serve topped with the diced apple and chopped walnuts.']],
    revuelto_pavo: [['Corta el pavo en tiras y saltéalo 2 min.', 'Cut the turkey into strips and sauté for 2 min.'], ['Añade las espinacas y deja que reduzcan 1 minuto.', 'Add the spinach and let it wilt for 1 minute.'], ['Vierte las claras y remueve a fuego bajo hasta que cuajen pero sigan jugosas.', 'Pour in the egg whites and stir on low heat until just set.'], ['Sirve con tomate en dados y pimienta.', 'Serve with diced tomato and pepper.']],
    yogur_kiwi: [['Pela el kiwi y córtalo en rodajas.', 'Peel and slice the kiwi.'], ['Tuesta las almendras 2 min en una sartén sin aceite.', 'Toast the almonds in a dry pan for 2 min.'], ['Sirve el yogur con el kiwi y las almendras por encima.', 'Serve the yogurt topped with kiwi and almonds.']],
    avena_nocturna: [['Mezcla en un tarro la avena, la bebida de avena y el yogur.', 'Mix the oats, oat drink and yogurt in a jar.'], ['Tapa y deja en la nevera toda la noche (mínimo 4 h).', 'Cover and refrigerate overnight (at least 4 h).'], ['Por la mañana, remueve y añade el mango en dados por encima.', 'In the morning, stir and top with diced mango.']],
    bowl_pollo_quinoa: [['Lava la quinoa y cuécela 12 min en el doble de agua; escúrrela.', 'Rinse the quinoa and cook it 12 min in twice its volume of water; drain.'], ['Haz el pollo a la plancha con especias y córtalo en tiras.', 'Grill the spiced chicken and slice it.'], ['Corta el aguacate y el pepino.', 'Slice the avocado and cucumber.'], ['Monta el bowl por secciones y aliña con limón, aceite y sal.', 'Arrange everything in sections and dress with lemon, oil and salt.']],
    salmon_arroz_brocoli: [['Cuece el arroz integral 25–30 min (o usa uno ya cocido).', 'Cook the brown rice for 25–30 min (or use pre-cooked).'], ['Cuece el brócoli al vapor 5 min.', 'Steam the broccoli for 5 min.'], ['Marca el salmón con la piel hacia abajo 4 min y 2 min por el otro lado.', 'Sear the salmon skin-side down for 4 min, then 2 min on the other side.'], ['Sirve con el arroz, el brócoli y un gajo de limón.', 'Serve with the rice, broccoli and a lemon wedge.']],
    pasta_bolonesa: [['Pica la cebolla y sofríela 4 min.', 'Chop the onion and sauté it for 4 min.'], ['Añade la ternera picada y desmenúzala mientras se dora, 5 min.', 'Add the minced beef and break it up as it browns, 5 min.'], ['Incorpora el tomate triturado, orégano y sal; cuece a fuego lento 15 min.', 'Stir in the crushed tomato, oregano and salt; simmer 15 min.'], ['Cuece la pasta integral y mézclala con la salsa.', 'Cook the wholewheat pasta and toss it with the sauce.']],
    curry_garbanzos: [['Cuece el arroz basmati 12 min.', 'Cook the basmati rice for 12 min.'], ['Sofríe ajo, jengibre y curry en polvo 1 minuto.', 'Fry garlic, ginger and curry powder for 1 minute.'], ['Añade el tomate y los garbanzos y cuece 10 min.', 'Add the tomato and chickpeas and simmer 10 min.'], ['Incorpora las espinacas hasta que reduzcan y sirve con el arroz.', 'Stir in the spinach until wilted and serve with the rice.']],
    poke_atun: [['Cuece el arroz y aliña con un chorrito de vinagre de arroz.', 'Cook the rice and season with a splash of rice vinegar.'], ['Corta el atún en dados y marínalo 10 min con soja y sésamo.', 'Dice the tuna and marinate it 10 min with soy sauce and sesame.'], ['Cuece el edamame 4 min y pélalo.', 'Boil the edamame for 4 min and shell it.'], ['Monta el bowl con arroz, atún, edamame y aguacate.', 'Build the bowl with rice, tuna, edamame and avocado.']],
    ensalada_lentejas: [['Escurre y enjuaga las lentejas cocidas.', 'Drain and rinse the cooked lentils.'], ['Pica el tomate, el pepino y el pimiento en dados pequeños.', 'Dice the tomato, cucumber and pepper.'], ['Mezcla todo y aliña con aceite, vinagre, sal y comino.', 'Mix everything and dress with oil, vinegar, salt and cumin.'], ['Deja reposar 10 min en la nevera para que se integren los sabores.', 'Chill for 10 min to let the flavours come together.']],
    burrito_bowl: [['Cuece el arroz y añade lima y cilantro picado.', 'Cook the rice and stir in lime and chopped coriander.'], ['Haz el pollo con pimentón y comino y córtalo.', 'Cook the chicken with paprika and cumin and slice it.'], ['Calienta las alubias y el maíz escurridos 3 min.', 'Warm the drained beans and corn for 3 min.'], ['Monta el bowl por secciones y añade salsa de tomate picante si te gusta.', 'Arrange in sections and add spicy salsa if you like.']],
    dorada_horno: [['Precalienta el horno a 200 °C.', 'Preheat the oven to 200 °C (400 °F).'], ['Hornea la patata y la cebolla en rodajas 20 min con aceite y sal.', 'Roast the sliced potato and onion for 20 min with oil and salt.'], ['Coloca la dorada encima con rodajas de limón y hornea 15 min.', 'Lay the sea bream on top with lemon slices and bake 15 min.'], ['Está lista cuando la carne se separa fácilmente de la espina.', 'It’s done when the flesh comes away easily from the bone.']],
    wok_tofu: [['Hidrata los fideos de arroz en agua caliente 5 min y escúrrelos.', 'Soak the rice noodles in hot water for 5 min and drain.'], ['Dora el tofu en dados en el wok muy caliente.', 'Brown the diced tofu in a very hot wok.'], ['Añade el brócoli y el pimiento y saltea 4 min.', 'Add the broccoli and pepper and stir-fry 4 min.'], ['Incorpora los fideos con salsa de soja y saltea 1 minuto más.', 'Toss in the noodles with soy sauce and stir-fry 1 more minute.']],
    cerdo_boniato: [['Asa el boniato en dados 25 min a 200 °C.', 'Roast the diced sweet potato for 25 min at 200 °C.'], ['Sella el solomillo por todos los lados y termínalo 10 min en el horno.', 'Sear the tenderloin on all sides and finish it 10 min in the oven.'], ['Cuece las judías verdes 6 min.', 'Boil the green beans for 6 min.'], ['Deja reposar la carne 5 min antes de cortarla en medallones.', 'Rest the meat 5 min before slicing into medallions.']],
    trucha_esparragos: [['Seca la trucha y salpimiéntala.', 'Pat the trout dry and season it.'], ['Hazla a la plancha 3 min por cada lado, primero por la piel.', 'Grill it 3 min per side, skin-side first.'], ['Saltea los espárragos 5 min en la misma plancha.', 'Grill the asparagus for 5 min in the same pan.'], ['Sirve con limón y perejil picado.', 'Serve with lemon and chopped parsley.']],
    crema_calabaza: [['Pela y trocea la calabaza, la patata, la zanahoria y la cebolla.', 'Peel and chop the pumpkin, potato, carrot and onion.'], ['Rehoga la cebolla 3 min y añade el resto con agua o caldo que lo cubra.', 'Soften the onion for 3 min, then add the rest with water or stock to cover.'], ['Cuece 20 min hasta que todo esté tierno.', 'Simmer for 20 min until everything is tender.'], ['Tritura, ajusta de sal y sirve con un hilo de aceite y semillas.', 'Blend, season and serve with a drizzle of oil and seeds.']],
    tortilla_patata: [['Corta la patata y la cebolla en láminas finas.', 'Thinly slice the potato and onion.'], ['Ásalas en el microondas 8 min tapadas o póchalas con poco aceite.', 'Cook them covered in the microwave for 8 min or soften with a little oil.'], ['Mézclalas con los huevos batidos y deja reposar 5 min.', 'Mix them with the beaten eggs and rest 5 min.'], ['Cuaja en sartén antiadherente 3 min por lado.', 'Set in a non-stick pan for 3 min per side.']],
    cesar_ligera: [['Haz el pollo a la plancha y córtalo en tiras.', 'Grill the chicken and slice it.'], ['Tuesta el pan en dados para hacer picatostes.', 'Toast the bread cubes into croutons.'], ['Prepara la salsa con yogur, limón, mostaza y un poco de parmesano.', 'Make the dressing with yogurt, lemon, mustard and a little parmesan.'], ['Mezcla la lechuga con la salsa y añade el pollo, el tomate y los picatostes.', 'Toss the lettuce with the dressing and top with chicken, tomato and croutons.']],
    gambas_calabacin: [['Corta el calabacín en tiras finas o espirales.', 'Cut the zucchini into thin ribbons or spirals.'], ['Dora ajo laminado y una guindilla en el aceite de oliva.', 'Fry sliced garlic and a chili in the olive oil.'], ['Añade las gambas peladas y saltea 2 min hasta que cambien de color.', 'Add the peeled prawns and sauté 2 min until they turn pink.'], ['Incorpora el calabacín 1 minuto y sirve con perejil.', 'Add the zucchini for 1 minute and serve with parsley.']],
    pizza_tortilla: [['Precalienta el horno a 220 °C.', 'Preheat the oven to 220 °C (425 °F).'], ['Extiende tomate triturado con orégano sobre la tortilla.', 'Spread crushed tomato with oregano over the tortilla.'], ['Añade el pavo en tiras y la mozzarella.', 'Top with turkey strips and mozzarella.'], ['Hornea 8–10 min hasta que el borde esté crujiente.', 'Bake 8–10 min until the edge is crisp.']],
    berenjena_rellena: [['Parte la berenjena a lo largo, haz cortes en la pulpa y hornéala 20 min a 200 °C.', 'Halve the aubergine, score the flesh and roast it 20 min at 200 °C.'], ['Saca la pulpa y sofríela con la ternera picada y el tomate 8 min.', 'Scoop out the flesh and cook it with the minced beef and tomato for 8 min.'], ['Rellena las mitades y cubre con mozzarella.', 'Fill the halves and top with mozzarella.'], ['Gratina 8 min hasta que se dore el queso.', 'Grill for 8 min until the cheese is golden.']],
    sardinas_ensalada: [['Haz las sardinas a la plancha 2 min por lado (o usa de lata, escurridas).', 'Grill the sardines 2 min per side (or use tinned, drained).'], ['Lava la rúcula y corta el tomate en gajos.', 'Rinse the rocket and cut the tomato into wedges.'], ['Aliña la ensalada con aceite, limón y sal en escamas.', 'Dress the salad with oil, lemon and flaky salt.'], ['Sirve las sardinas encima.', 'Serve the sardines on top.']],
    lubina_verduras: [['Precalienta el horno a 200 °C.', 'Preheat the oven to 200 °C (400 °F).'], ['Asa el calabacín, el pimiento y la cebolla en trozos 15 min con aceite y sal.', 'Roast the chopped zucchini, pepper and onion for 15 min with oil and salt.'], ['Coloca los lomos de lubina encima y hornea 10 min.', 'Lay the sea bass fillets on top and bake 10 min.'], ['Termina con limón y hierbas frescas.', 'Finish with lemon and fresh herbs.']],
    tortitas_cacahuete: [['Unta las tortitas de arroz con una cucharada de crema de cacahuete.', 'Spread the rice cakes with a spoonful of peanut butter.'], ['Coloca el plátano en rodajas encima.', 'Top with banana slices.'], ['Opcional: canela o unas virutas de chocolate negro.', 'Optional: cinnamon or a few dark chocolate shavings.']],
    edamame_sal: [['Cuece el edamame congelado 4–5 min en agua hirviendo.', 'Boil the frozen edamame for 4–5 min.'], ['Escúrrelo y saltéalo 1 minuto con unas gotas de aceite.', 'Drain and toss it 1 minute with a few drops of oil.'], ['Espolvorea sal marina en escamas y sírvelo templado.', 'Sprinkle with flaky sea salt and serve warm.']],
    mix_frutos_secos: [['Mezcla un puñado de almendras y nueces (unos 30 g).', 'Mix a small handful of almonds and walnuts (about 30 g).'], ['Añade los arándanos lavados.', 'Add the rinsed blueberries.'], ['Sírvelo en un cuenco pequeño: es fácil pasarse con las raciones.', 'Serve in a small bowl: portions add up quickly.']],
    batido_kefir: [['Pon en la batidora el kéfir, las espinacas, el plátano y el kiwi pelado.', 'Add the kefir, spinach, banana and peeled kiwi to the blender.'], ['Bate 40 segundos hasta que no queden trozos de hoja.', 'Blend for 40 seconds until no leafy bits remain.'], ['Sírvelo frío al momento.', 'Serve cold straight away.']],
    cottage_pina: [['Corta la piña en dados.', 'Dice the pineapple.'], ['Sirve el queso cottage en un cuenco con la piña por encima.', 'Spoon the cottage cheese into a bowl and top with the pineapple.'], ['Añade menta picada para refrescar.', 'Add chopped mint for freshness.']],
    huevos_cocidos: [['Cuece los huevos 9–10 min desde que el agua hierve.', 'Boil the eggs for 9–10 min once the water is boiling.'], ['Enfríalos en agua con hielo y pélalos.', 'Cool them in ice water and peel.'], ['Sírvelos en mitades con tomate, sal y pimentón.', 'Serve halved with tomato, salt and paprika.']],
    manzana_asada: [['Precalienta el horno a 180 °C y quita el corazón a la manzana.', 'Preheat the oven to 180 °C and core the apple.'], ['Rellena el hueco con nueces troceadas y canela.', 'Fill the hole with chopped walnuts and cinnamon.'], ['Hornea 20–25 min hasta que esté tierna.', 'Bake 20–25 min until tender.'], ['Sirve templada con una cucharada de yogur griego.', 'Serve warm with a spoonful of Greek yogurt.']],
    helado_platano: [['Congela el plátano en rodajas al menos 4 h.', 'Freeze the sliced banana for at least 4 h.'], ['Tritúralo con las frambuesas y un chorrito de bebida de almendras.', 'Blend it with the raspberries and a splash of almond drink.'], ['Raspa los bordes y bate hasta que quede cremoso como un helado.', 'Scrape down and blend until creamy like soft-serve.'], ['Sirve al momento o congela 30 min para que endurezca.', 'Serve straight away or freeze 30 min to firm up.']],
    fresas_skyr: [['Lava y corta las fresas.', 'Wash and slice the strawberries.'], ['Pon el skyr en un cuenco y coloca las fresas encima.', 'Spoon the skyr into a bowl and top with the strawberries.'], ['Añade la granola justo antes de comer para que cruja.', 'Add the granola right before eating so it stays crunchy.']],
    batido_frutos_rojos: [['Pon en la batidora la leche, la proteína y los frutos rojos (congelados quedan más espesos).', 'Add the milk, protein and berries to the blender (frozen ones make it thicker).'], ['Bate 30 segundos.', 'Blend for 30 seconds.'], ['Sírvelo al momento.', 'Serve straight away.']],
  };

  // Recetas añadidas en la 3.ª tanda: id en una línea y luego un paso por línea (es~en)
  const STEPS3 = `
shakshuka
Sofríe la cebolla y el pimiento en tiras 5 min con un poco de aceite.~Sauté the onion and pepper strips with a little oil for 5 min.
Añade el tomate triturado, comino, pimentón y sal; cuece 8 min hasta que espese.~Add crushed tomato, cumin, paprika and salt; simmer 8 min until thick.
Haz 2–3 huecos en la salsa y casca un huevo en cada uno.~Make 2–3 wells in the sauce and crack an egg into each.
Tapa y cocina 5–6 min a fuego bajo hasta que la clara cuaje y la yema siga líquida.~Cover and cook 5–6 min on low until the whites set and yolks stay runny.
Sirve en la sartén con el pan de centeno tostado para mojar.~Serve in the pan with toasted rye bread for dipping.
crepes_proteicos
Bate las claras con la harina de avena, una pizca de sal y canela hasta tener una masa fina.~Whisk the egg whites with oat flour, a pinch of salt and cinnamon into a thin batter.
Deja reposar la masa 5 min.~Let the batter rest 5 min.
Engrasa una sartén con unas gotas de aceite y vierte un cucharón, girando para cubrir el fondo.~Lightly oil a pan, pour in a ladleful and swirl to coat the base.
Cocina 1 min, dale la vuelta y 30 segundos más.~Cook 1 min, flip and cook 30 seconds more.
Rellena con yogur griego y fresas en láminas y dobla en cuartos.~Fill with Greek yogurt and sliced strawberries and fold into quarters.
tostada_salmon
Tuesta el pan de centeno.~Toast the rye bread.
Unta una capa generosa de queso fresco.~Spread a generous layer of cream cheese.
Coloca el pepino en láminas finas y el salmón ahumado encima.~Top with thin cucumber slices and the smoked salmon.
Termina con pimienta negra, eneldo y unas gotas de limón.~Finish with black pepper, dill and a few drops of lemon.
bowl_acai
Tritura el açaí congelado con medio plátano y un chorrito de bebida vegetal hasta que quede espeso.~Blend the frozen açaí with half a banana and a splash of plant milk until thick.
Pásalo a un cuenco frío y alisa la superficie.~Pour into a chilled bowl and smooth the top.
Decora en filas con el resto del plátano, los arándanos, las frambuesas y la granola.~Top in rows with the remaining banana, blueberries, raspberries and granola.
Cómelo al momento antes de que se derrita.~Eat immediately before it melts.
burrito_desayuno
Calienta las alubias escurridas con comino 3 min y aplástalas un poco.~Warm the drained beans with cumin for 3 min and lightly mash them.
Haz un revuelto con los huevos a fuego bajo.~Scramble the eggs on low heat.
Calienta la tortilla 20 segundos por cada lado en la sartén.~Warm the tortilla 20 seconds per side in the pan.
Rellena con alubias, huevo, tomate en dados y aguacate.~Fill with beans, egg, diced tomato and avocado.
Dobla los lados, enrolla y dora 1 min por la juntura para sellarlo.~Fold in the sides, roll up and toast 1 min seam-side down to seal.
gofres_avena
Tritura la avena, las claras, el plátano y una cucharadita de levadura hasta tener una masa lisa.~Blend the oats, egg whites, banana and a teaspoon of baking powder until smooth.
Precalienta la gofrera y engrásala ligeramente.~Preheat the waffle iron and lightly grease it.
Vierte la masa y cocina 4–5 min hasta que esté dorada.~Pour in the batter and cook 4–5 min until golden.
Sirve con arándanos y un poco de yogur o miel.~Serve with blueberries and a little yogurt or honey.
huevos_turcos
Mezcla el yogur griego con ajo rallado y sal y repártelo en un plato hondo.~Mix the Greek yogurt with grated garlic and salt and spread it in a shallow bowl.
Escalfa los huevos 3 min en agua con un chorrito de vinagre, sin que hierva fuerte.~Poach the eggs for 3 min in barely simmering water with a splash of vinegar.
Calienta una cucharada de aceite con pimentón (o chile en escamas) 30 segundos.~Warm a spoonful of oil with paprika (or chili flakes) for 30 seconds.
Coloca los huevos sobre el yogur, riega con el aceite y sirve con pan tostado.~Place the eggs on the yogurt, drizzle with the oil and serve with toast.
porridge_cacao
Cuece la avena con la leche a fuego medio 5 min removiendo.~Simmer the oats with the milk for 5 min, stirring.
Retira del fuego y añade el cacao puro y la proteína (si usas), removiendo para que no haga grumos.~Off the heat, stir in the cocoa and protein (if using) so it doesn’t clump.
Sirve con el plátano en rodajas y las almendras troceadas.~Top with sliced banana and chopped almonds.
pollo_teriyaki
Mezcla la salsa: soja, un poco de miel, jengibre rallado, ajo y una cucharadita de maicena en agua.~Mix the sauce: soy, a little honey, grated ginger, garlic and a teaspoon of cornflour in water.
Cuece el arroz y el brócoli al vapor.~Cook the rice and steam the broccoli.
Dora el pollo en dados 6 min en una sartén caliente.~Brown the diced chicken in a hot pan for 6 min.
Vierte la salsa y cocina 2 min hasta que brille y espese.~Pour in the sauce and cook 2 min until glossy and thick.
Sirve sobre el arroz con el brócoli y sésamo tostado.~Serve over the rice with broccoli and toasted sesame.
fajitas_pollo
Corta el pollo, el pimiento y la cebolla en tiras.~Slice the chicken, pepper and onion into strips.
Mezcla el pollo con pimentón, comino, ajo en polvo, sal y lima.~Toss the chicken with paprika, cumin, garlic powder, salt and lime.
Saltea el pollo 5 min a fuego fuerte, añade las verduras y 4 min más.~Stir-fry the chicken 5 min on high, add the vegetables and cook 4 min more.
Calienta las tortillas y rellénalas con el salteado y el aguacate.~Warm the tortillas and fill them with the stir-fry and avocado.
paella_marisco
Sofríe el pimiento y el calamar en tiras 5 min en la paellera.~Sauté the pepper and squid strips in the paella pan for 5 min.
Añade el tomate rallado y el pimentón y cocina 2 min.~Add grated tomato and paprika and cook 2 min.
Incorpora el arroz, remueve 1 minuto y vierte el caldo caliente con azafrán (el triple que de arroz).~Add the rice, stir 1 minute, then pour in hot stock with saffron (three times the rice volume).
Cuece 10 min a fuego fuerte y 8 min a fuego bajo sin remover; añade gambas y guisantes en los últimos 5.~Cook 10 min on high and 8 min on low without stirring; add prawns and peas for the last 5.
Deja reposar 5 min tapada con un paño antes de servir.~Rest 5 min covered with a cloth before serving.
lentejas_estofadas
Pica la cebolla, el pimiento y la zanahoria y sofríelos 6 min.~Chop the onion, pepper and carrot and sauté for 6 min.
Añade una cucharadita de pimentón y las lentejas lavadas.~Add a teaspoon of paprika and the rinsed lentils.
Cubre con agua o caldo, añade la patata en trozos y una hoja de laurel.~Cover with water or stock, add the chopped potato and a bay leaf.
Cuece a fuego suave 25–30 min hasta que estén tiernas (10 min si son cocidas).~Simmer 25–30 min until tender (10 min if pre-cooked).
Rectifica de sal y deja reposar 5 min: están más ricas.~Season and rest 5 min — they taste even better.
albondigas_pavo
Mezcla el pavo picado con huevo, ajo, perejil, sal y una cucharada de pan rallado.~Mix the minced turkey with egg, garlic, parsley, salt and a spoonful of breadcrumbs.
Forma bolitas del tamaño de una nuez.~Shape into walnut-sized balls.
Dóralas en la sartén 4 min y resérvalas.~Brown them in the pan for 4 min and set aside.
Sofríe la cebolla, añade el tomate triturado y cuece 8 min.~Fry the onion, add crushed tomato and simmer 8 min.
Vuelve a poner las albóndigas en la salsa 10 min y sirve con el arroz integral.~Return the meatballs to the sauce for 10 min and serve with brown rice.
merluza_salsa_verde
Cuece la patata en rodajas 12 min en agua con sal.~Boil the sliced potato in salted water for 12 min.
Dora ajo picado en aceite sin que se queme y añade una cucharadita de harina.~Gently fry chopped garlic in oil without burning and stir in a teaspoon of flour.
Vierte un vaso de caldo de pescado poco a poco, removiendo para ligar la salsa.~Slowly pour in a glass of fish stock, stirring to thicken the sauce.
Añade la merluza y los guisantes, y cocina 5–6 min moviendo la cazuela.~Add the hake and peas and cook 5–6 min, gently shaking the pan.
Termina con mucho perejil picado y sirve con las patatas.~Finish with plenty of chopped parsley and serve with the potatoes.
pad_thai
Hidrata los fideos de arroz en agua caliente 8 min y escúrrelos.~Soak the rice noodles in hot water for 8 min and drain.
Mezcla la salsa: soja, lima, un poco de azúcar moreno y salsa de pescado (opcional).~Mix the sauce: soy, lime, a little brown sugar and fish sauce (optional).
Saltea el pollo en tiras 5 min y la zanahoria rallada 1 minuto.~Stir-fry the chicken strips 5 min and the grated carrot 1 minute.
Aparta a un lado, cuaja el huevo revuelto y mezcla todo con los fideos y la salsa.~Push aside, scramble the egg, then toss everything with the noodles and sauce.
Sirve con cacahuetes picados, cebollino y un gajo de lima.~Serve with chopped peanuts, spring onion and a lime wedge.
chili_carne
Sofríe la cebolla 4 min y añade la ternera picada hasta que se dore.~Fry the onion 4 min, then add the minced beef until browned.
Añade comino, pimentón, chile y orégano y cocina 1 minuto.~Add cumin, paprika, chili and oregano and cook 1 minute.
Incorpora el tomate, las alubias y el maíz escurridos.~Stir in the tomato and the drained beans and corn.
Cuece tapado a fuego suave 20 min.~Simmer covered for 20 min.
Sirve con arroz y un poco de yogur griego por encima.~Serve with rice and a little Greek yogurt on top.
hamburguesa_casera
Sazona la ternera picada con sal, pimienta y ajo en polvo y forma una hamburguesa de 2 cm.~Season the minced beef with salt, pepper and garlic powder and shape a 2 cm patty.
Haz una pequeña hendidura en el centro para que no se abombe.~Press a small dimple in the centre so it stays flat.
Cocina a la plancha muy caliente 3–4 min por lado.~Cook on a very hot grill 3–4 min per side.
Tuesta el pan y monta con lechuga, tomate, cebolla y la carne.~Toast the bun and build with lettuce, tomato, onion and the patty.
Acompaña con ensalada o patata al horno en lugar de fritas.~Serve with salad or baked potato instead of fries.
risotto_setas
Dora el pollo en dados y resérvalo.~Brown the diced chicken and set aside.
Sofríe la cebolla picada y las setas laminadas 5 min.~Sauté the chopped onion and sliced mushrooms for 5 min.
Añade el arroz y nácaralo 1 minuto.~Add the rice and toast it for 1 minute.
Vierte caldo caliente cazo a cazo durante 18 min, removiendo a menudo.~Add hot stock a ladle at a time for 18 min, stirring often.
Fuera del fuego, añade el pollo y una cucharada de parmesano y remueve hasta que quede cremoso.~Off the heat, stir in the chicken and a spoonful of parmesan until creamy.
gnocchi_pesto
Cuece los gnocchi en agua hirviendo con sal hasta que floten (2–3 min).~Boil the gnocchi in salted water until they float (2–3 min).
Saltea los tomates cherry partidos 2 min.~Sauté the halved cherry tomatoes for 2 min.
Escurre los gnocchi y mézclalos en la sartén con el pesto y los tomates.~Drain the gnocchi and toss them in the pan with the pesto and tomatoes.
Sirve con mozzarella fresca y hojas de albahaca.~Serve with fresh mozzarella and basil leaves.
salmon_teriyaki_bowl
Cuece el arroz y el edamame.~Cook the rice and edamame.
Marca el salmón en dados 3 min y añade salsa teriyaki 1 minuto hasta glasear.~Sear the diced salmon for 3 min and add teriyaki sauce for 1 minute to glaze.
Corta el aguacate y el pepino.~Slice the avocado and cucumber.
Monta el bowl por secciones y termina con sésamo y cebollino.~Arrange in sections and finish with sesame and spring onion.
pollo_curry_coco
Cuece el arroz basmati.~Cook the basmati rice.
Dora el pollo en dados 5 min con ajo y jengibre.~Brown the diced chicken for 5 min with garlic and ginger.
Añade el pimiento y 2 cucharadas de pasta de curry y cocina 2 min.~Add the pepper and 2 tablespoons of curry paste and cook 2 min.
Vierte la leche de coco ligera y cuece 10 min a fuego suave.~Pour in light coconut milk and simmer 10 min.
Incorpora las espinacas al final y sirve con el arroz.~Stir in the spinach at the end and serve with the rice.
tacos_pescado
Sazona la merluza con pimentón, comino, sal y lima.~Season the hake with paprika, cumin, salt and lime.
Hazla a la plancha 3 min por lado y desmígala en trozos grandes.~Grill it 3 min per side and flake into large pieces.
Mezcla la lechuga o col en tiras con yogur, lima y sal.~Toss shredded lettuce or cabbage with yogurt, lime and salt.
Calienta las tortillas y rellena con la ensalada, el pescado y el aguacate.~Warm the tortillas and fill with the slaw, fish and avocado.
garbanzos_espinacas
Sofríe ajo con comino y pimentón 1 minuto.~Fry garlic with cumin and paprika for 1 minute.
Añade el tomate rallado y cocina 3 min.~Add grated tomato and cook 3 min.
Incorpora los garbanzos cocidos y las espinacas y cocina hasta que reduzcan.~Add the cooked chickpeas and spinach and cook until wilted.
Sirve con un huevo cocido o a la plancha por encima.~Serve topped with a boiled or fried egg.
pechuga_rellena
Precalienta el horno a 200 °C y abre la pechuga en libro.~Preheat the oven to 200 °C and butterfly the chicken breast.
Saltea las espinacas 1 minuto y escúrrelas bien.~Wilt the spinach for 1 minute and squeeze dry.
Rellena con espinacas y mozzarella, cierra con palillos y salpimienta.~Fill with spinach and mozzarella, secure with toothpicks and season.
Dórala 2 min por lado y hornéala 18 min junto al calabacín en rodajas.~Sear 2 min per side and bake 18 min with sliced zucchini.
Deja reposar 3 min antes de cortar.~Rest 3 min before slicing.
calamares_plancha
Limpia los calamares y sécalos bien con papel.~Clean the squid and pat it completely dry.
Haz cortes en rombo y salpimienta.~Score in a diamond pattern and season.
Hazlos a la plancha muy caliente 1–2 min por lado: si te pasas, quedan duros.~Grill on very high heat 1–2 min per side — overcooking makes them tough.
Sirve con la ensalada, ajo y perejil picados y limón.~Serve with the salad, chopped garlic and parsley and lemon.
ensalada_quinoa_feta
Lava la quinoa y cuécela 12 min; deja que se enfríe extendida.~Rinse the quinoa, cook 12 min and spread out to cool.
Corta el pepino y el tomate en dados.~Dice the cucumber and tomato.
Mezcla la quinoa con las verduras, la rúcula y el queso desmenuzado.~Mix the quinoa with the vegetables, rocket and crumbled cheese.
Aliña con limón, aceite, menta y sal; añade granada por encima.~Dress with lemon, oil, mint and salt; top with pomegranate.
tortilla_espinacas
Saltea los champiñones laminados 4 min y añade las espinacas 1 minuto.~Sauté the sliced mushrooms for 4 min and add the spinach for 1 minute.
Bate los huevos con sal y pimienta.~Beat the eggs with salt and pepper.
Vierte los huevos sobre las verduras y cocina a fuego medio-bajo.~Pour the eggs over the vegetables and cook on medium-low.
Cuando el borde cuaje, dobla por la mitad y sirve jugosa.~When the edge sets, fold in half and serve while still soft.
sopa_miso
Calienta el agua o caldo sin que llegue a hervir.~Heat the water or stock without letting it boil.
Disuelve la pasta de miso en un poco de caldo y añádela a la olla.~Dissolve the miso paste in a little stock and add it to the pot.
Añade el tofu en dados y los fideos de arroz y cocina 4 min.~Add the diced tofu and rice noodles and cook 4 min.
Incorpora las espinacas y el cebollino y sirve caliente.~Stir in the spinach and spring onion and serve hot.
pizza_coliflor
Precalienta el horno a 220 °C y ralla la coliflor.~Preheat the oven to 220 °C and grate the cauliflower.
Calienta la coliflor en el microondas 5 min y escúrrela muy bien con un paño.~Microwave it 5 min, then squeeze out all the moisture with a cloth.
Mezcla con huevo, un poco de mozzarella y orégano y extiende una base fina sobre papel de horno.~Mix with egg, a little mozzarella and oregano and spread a thin base on baking paper.
Hornea 15 min hasta que dore.~Bake 15 min until golden.
Añade tomate y mozzarella y hornea 8 min más.~Add tomato and mozzarella and bake 8 min more.
bacalao_pisto
Pica la cebolla, el pimiento y el calabacín en dados.~Dice the onion, pepper and zucchini.
Póchalos 12 min a fuego medio con un poco de aceite.~Cook them gently for 12 min with a little oil.
Añade el tomate triturado y cuece 8 min más.~Add crushed tomato and simmer 8 min more.
Coloca el bacalao sobre el pisto, tapa y cocina 6–8 min hasta que se separe en lascas.~Lay the cod on top, cover and cook 6–8 min until it flakes.
wrap_atun
Escurre el atún.~Drain the tuna.
Unta la tortilla con hummus.~Spread the tortilla with hummus.
Añade lechuga, tomate en rodajas y el atún.~Add lettuce, sliced tomato and the tuna.
Enrolla apretado y corta en diagonal.~Roll tightly and cut diagonally.
ternera_brocoli
Corta la ternera en tiras finas y mézclala con soja, ajo y una cucharadita de maicena.~Slice the beef thinly and toss with soy, garlic and a teaspoon of cornflour.
Cuece el arroz y blanquea el brócoli 2 min en agua hirviendo.~Cook the rice and blanch the broccoli 2 min in boiling water.
Saltea la ternera 2 min en el wok muy caliente y resérvala.~Stir-fry the beef 2 min in a very hot wok and set aside.
Saltea el brócoli y el pimiento 3 min, vuelve a añadir la carne con un chorrito de soja y jengibre.~Stir-fry the broccoli and pepper 3 min, return the beef with a splash of soy and ginger.
Sirve al momento sobre el arroz.~Serve straight away over the rice.
tostada_cacahuete_fresa
Tuesta el pan integral.~Toast the wholemeal bread.
Unta una cucharada de crema de cacahuete 100 %.~Spread a spoonful of 100 % peanut butter.
Coloca las fresas en láminas y una pizca de canela.~Top with sliced strawberries and a pinch of cinnamon.
bolitas_energia
Tritura los dátiles deshuesados con las almendras hasta que se forme una pasta.~Blend the pitted dates with the almonds until they form a paste.
Añade la avena y el cacao y tritura unos segundos más.~Add the oats and cocoa and pulse a few seconds more.
Forma bolitas con las manos húmedas.~Shape into balls with damp hands.
Rebózalas en cacao o coco y guárdalas en la nevera 30 min.~Roll in cocoa or coconut and chill for 30 min.
pudin_chia
Mezcla 3 cucharadas de chía con la bebida de almendras y remueve bien.~Mix 3 tablespoons of chia with the almond drink and stir well.
Espera 5 min y vuelve a remover para que no se formen grumos.~Wait 5 min and stir again to stop clumps.
Deja en la nevera al menos 2 h (o toda la noche).~Refrigerate at least 2 h (or overnight).
Sirve con una capa de yogur griego y mango en dados.~Serve with a layer of Greek yogurt and diced mango.
yogur_proteico_choco
Mezcla el yogur griego con el cacao puro y un poco de edulcorante o miel.~Mix the Greek yogurt with cocoa powder and a little sweetener or honey.
Bate 1 minuto con varillas para que quede aireado.~Whisk for 1 minute to make it airy.
Sirve en vasitos con frambuesas por encima.~Serve in small glasses topped with raspberries.
cheesecake_ligero
Precalienta el horno a 170 °C y tritura la avena con un poco de agua para hacer la base.~Preheat the oven to 170 °C and blitz the oats with a little water for the base.
Presiona la base en un molde pequeño.~Press the base into a small tin.
Bate el queso fresco batido con los huevos, limón y edulcorante y viértelo encima.~Whisk the quark with the eggs, lemon and sweetener and pour on top.
Hornea 30–35 min, apaga y deja enfriar dentro con la puerta entreabierta.~Bake 30–35 min, then switch off and cool inside with the door ajar.
Enfría 4 h en la nevera y cubre con frambuesas.~Chill 4 h and top with raspberries.
brownie_proteico
Precalienta el horno a 180 °C.~Preheat the oven to 180 °C.
Mezcla las claras con la harina de avena, el cacao, edulcorante y una pizca de levadura.~Mix the egg whites with oat flour, cocoa, sweetener and a pinch of baking powder.
Añade las nueces troceadas y vierte en un molde con papel.~Fold in the chopped walnuts and pour into a lined tin.
Hornea 18–20 min: el centro debe quedar algo húmedo.~Bake 18–20 min — the centre should stay slightly fudgy.
Deja enfriar antes de cortar en cuadrados.~Cool before cutting into squares.
batido_cafe
Prepara un café y déjalo enfriar (o usa café frío).~Brew a coffee and let it cool (or use cold brew).
Bate el café con la leche, el plátano, la avena y la proteína.~Blend the coffee with the milk, banana, oats and protein.
Añade hielo y bate 10 segundos más.~Add ice and blend 10 seconds more.
batido_verde
Pela y trocea la piña, la manzana y el pepino.~Peel and chop the pineapple, apple and cucumber.
Bate con las espinacas y un vaso de agua fría 45 segundos.~Blend with the spinach and a glass of cold water for 45 seconds.
Sírvelo al momento con hielo.~Serve right away with ice.
`.trim();
  { let cur = null; STEPS3.split('\n').forEach((l) => { if (!l.includes('~')) { cur = l.trim(); NEW_STEPS[cur] = []; } else if (cur) NEW_STEPS[cur].push(l.split('~')); }); }

  // Alimentos nuevos que usan estas recetas (valores por 100 g, referencia USDA FoodData Central)
  if (window.FDB) {
    const src = 'USDA FoodData Central (aprox.)';
    [['calamar', 'F', 92, 15.6, 3.1, 1.4, 0, 'marisco', ''], ['champiñones', 'u', 22, 3.1, 3.3, .3, 1, '', 'v'], ['hummus', 'L', 166, 7.9, 14.3, 9.6, 6, 'sésamo', 'v'],
      ['dátiles', 'r', 282, 2.5, 75, .4, 8, '', 'v'], ['chía', 'n', 486, 17, 42, 31, 34, '', 'v'], ['cacao', 'n', 228, 20, 58, 14, 37, '', 'v'],
      ['sésamo', 'n', 573, 18, 23, 50, 12, 'sésamo', 'v'], ['perejil', 'h', 36, 3, 6, .8, 3, '', 'v'], ['albahaca', 'h', 23, 3.2, 2.7, .6, 1.6, '', 'v'],
    ].forEach(([n, cx, k, pr, c, f, fi, al, dt]) => { if (!FDB[n]) FDB[n] = { n, cx, k, p: pr, c, f, fi, al, dt, $: 1, t: 0, src }; });
  }

  // ── Registro ──
  const tr = [];
  ROWS.split('\n').forEach((line) => {
    const a = line.split('|');
    if (a.length < 12 || MEALS.some((m) => m.id === a[0])) return;
    const names = a[1].split('~');
    MEALS.push({
      id: a[0], n: names[0], cat: a[2].split(','), k: +a[3], p: +a[4], c: +a[5], f: +a[6], t: +a[7],
      ing: a[8].split(','), col: a[9].split(','), al: a[10] === '-' ? [] : a[10].split(','), v: a[11] === 'plate' ? '' : a[11],
    });
    tr.push(names.join('|'));
  });
  tr.push('calamar|squid|calamar|lula', 'champiñones|mushrooms|champignons|cogumelos', 'hummus|hummus|houmous|húmus', 'dátiles|dates|dattes|tâmaras', 'chía|chia seeds|graines de chia|sementes de chia', 'cacao|cocoa|cacao|cacau', 'sésamo|sesame|sésame|sésamo', 'perejil|parsley|persil|salsa', 'albahaca|basil|basilic|manjericão');
  if (window.vxAddTr && tr.length) window.vxAddTr(tr.join('\n'));
  // Recipientes especiales sin forma propia en el dibujante → plato
  MEALS.forEach((m) => { if (m.v === 'pizza' || m.v === 'ricecake') m.v = ''; });
  window.vxSteps = (m) => STEPS[m.id] || NEW_STEPS[m.id] || null;

  // ── Ficha de la comida: pasos reales en vez de los genéricos ──
  const TXT = {
    prep: ['Preparación', 'Method', 'Préparation', 'Preparação'],
    tip: ['Marca cada paso al terminarlo.', 'Tick each step as you finish it.', 'Coche chaque étape une fois terminée.', 'Marca cada passo ao terminá-lo.'],
    time: ['min en total', 'min in total', 'min au total', 'min no total'],
    easy: ['Fácil', 'Easy', 'Facile', 'Fácil'], mid: ['Media', 'Medium', 'Moyenne', 'Média'],
    srv: ['Raciones', 'Servings', 'Portions', 'Doses'],
    tot: ['Total', 'Total', 'Total', 'Total'],
    have: ['Marca lo que ya tienes o has comprado.', 'Tick what you already have or have bought.', 'Coche ce que tu as déjà ou as acheté.', 'Marca o que já tens ou compraste.'],
    ready: ['¡Tiempo! Paso listo', 'Time’s up! Step done', 'Temps écoulé ! Étape prête', 'Tempo! Passo pronto'],
    step: ['Paso', 'Step', 'Étape', 'Passo'],
    timer: ['Temporizador', 'Timer', 'Minuteur', 'Temporizador'],
  };
  const LI = { es: 0, en: 1, fr: 2, pt: 3 };
  const tt = (k) => TXT[k][LI[S.lang] || 0];

  // ── Temporizador de cocina por paso ("cuece 12 min" → botón ⏱ 12 min) ──
  const secsOf = (t) => {
    const m = /(\d+)(?:\s*[–-]\s*\d+)?\s*(min|minutos?|segundos?|s\b)/i.exec(t);
    if (!m) return 0;
    const n = +m[1]; if (!n) return 0;
    const sec = /^min/i.test(m[2]) ? n * 60 : n;
    return sec >= 10 && sec <= 7200 ? sec : 0; // horas de nevera o reposo largo: sin temporizador
  };
  const fmt = (x) => `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`;
  function timerBtn(es, n) {
    const sec = secsOf(es);
    return sec ? ` <button class="chip vx-tmr" onclick="event.stopPropagation();vxCook(${sec},${n})" aria-label="${tt('timer')} ${fmt(sec)}">⏱ ${sec >= 60 ? Math.round(sec / 60) + ' min' : sec + ' s'}</button>` : '';
  }
  let cookIv = 0;
  window.vxCook = function (sec, n) {
    clearInterval(cookIv);
    let el = document.getElementById('vx-cook');
    if (!el) { el = document.createElement('div'); el.id = 'vx-cook'; el.className = 'vx-cook'; el.setAttribute('role', 'timer'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    const end = Date.now() + sec * 1000;
    el.classList.remove('done');
    const paint = () => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      el.innerHTML = `<span>🍳 ${tt('step')} ${n}</span><b>${fmt(left)}</b><button aria-label="✕" onclick="vxCookStop()">✕</button>`;
      if (!left) {
        clearInterval(cookIv); el.classList.add('done');
        el.innerHTML = `<span>🔔 ${tt('ready')} ${n}</span><button aria-label="✕" onclick="vxCookStop()">✕</button>`;
        try { navigator.vibrate && navigator.vibrate([300, 120, 300]); } catch (e) {}
        try { const C = new (window.AudioContext || window.webkitAudioContext)(); [0, .35, .7].forEach((t) => { const o = C.createOscillator(), g = C.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(.18, C.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, C.currentTime + t + .3); o.connect(g).connect(C.destination); o.start(C.currentTime + t); o.stop(C.currentTime + t + .3); }); } catch (e) {}
        try { if (document.hidden && window.Notification && Notification.permission === 'granted') new Notification('Volta', { body: `${tt('ready')} ${n}` }); } catch (e) {}
        if (typeof toast === 'function') toast(`🔔 ${tt('ready')} ${n}`);
      }
    };
    paint(); cookIv = setInterval(paint, 1000);
  };
  window.vxCookStop = () => { clearInterval(cookIv); const el = document.getElementById('vx-cook'); if (el) el.remove(); };

  // ── Raciones ajustables: multiplica los macros de la receta ──
  const srvGet = (id) => { try { return (JSON.parse(localStorage.getItem('vx:srv') || '{}')[id]) || 1; } catch (e) { return 1; } };
  window.vxSrv = (id, d) => {
    let o = {}; try { o = JSON.parse(localStorage.getItem('vx:srv') || '{}'); } catch (e) {}
    o[id] = Math.min(8, Math.max(1, (o[id] || 1) + d));
    try { localStorage.setItem('vx:srv', JSON.stringify(o)); } catch (e) {}
    R();
  };
  window.vxSrvGet = srvGet;
  function servings(h, m) {
    const n = srvGet(m.id);
    const card = `<div class="card vx-srv"><div class="row" style="justify-content:space-between;align-items:center"><b>👥 ${tt('srv')}</b><div class="row vx-step-ctl" style="gap:10px;align-items:center"><button class="btn s g" onclick="vxSrv('${m.id}',-1)" aria-label="−" ${n <= 1 ? 'disabled' : ''}>−</button><b class="big" style="font-size:20px;min-width:22px;text-align:center">${n}</b><button class="btn s g" onclick="vxSrv('${m.id}',1)" aria-label="+" ${n >= 8 ? 'disabled' : ''}>+</button></div></div>` +
      (n > 1 ? `<div class="mu" style="margin-top:8px">${tt('tot')} ×${n}: <b>${m.k * n} kcal</b> · ${m.p * n} g prot · ${m.c * n} g carb · ${m.f * n} g ${LI[S.lang] === 1 ? 'fat' : 'grasas'}</div>` : '') + '</div>';
    const mark = 'Valores nutricionales aproximados';
    const a = h.indexOf(mark);
    if (a >= 0) { const b = h.indexOf('</div></div>', a); if (b >= 0) h = h.slice(0, b + 12) + card + h.slice(b + 12); }
    if (n > 1) {
      // Escala las cantidades de cada ingrediente (gramos o unidades) y sus macros en la lista
      const a = h.indexOf('<h2>Ingredientes</h2>'), b = h.indexOf('Cantidades estimadas a partir', a);
      if (a >= 0 && b > a) {
        const num = (x) => +String(x).replace(',', '.');
        let part = h.slice(a, b)
          .replace(/ · (\d+(?:[.,]\d+)?) (k?g|ml|l|[a-záéíóúñ]+)(?=<div class="mu">)/gi, (_, q, u) => { const v = num(q) * (/^kg$/i.test(u) ? 1000 : 1) * n; return /^k?g$/i.test(u) ? ` · ${v >= 1000 ? (v / 1000).toFixed(1).replace('.', ',') + ' kg' : Math.round(v) + ' g'}` : ` · ${Math.round(num(q) * n)} ${u}`; })
          .replace(/(\d+) kcal · P (\d+) · C (\d+) · G (\d+)/g, (_, k, pr, c, f) => `${k * n} kcal · P ${pr * n} · C ${c * n} · G ${f * n}`);
        h = h.slice(0, a) + part.replace('<h2>Ingredientes</h2>', `<h2>Ingredientes · ${n} ${tt('srv').toLowerCase()}</h2>`) + h.slice(b);
      }
    }
    return h.replace('Marca lo que ya tienes o has comprado. Cantidades: se completarán desde la base de datos de recetas.', tt('have'));
  }
  if (typeof V.meal === 'function') {
    const _meal = V.meal;
    V.meal = function (i) {
      let h = _meal.apply(this, arguments);
      try {
        const m = MEALS[i], st = window.vxSteps(m);
        if (!m || !st) return h;
        const a = h.indexOf('<h2>Preparación'), endMark = 'Pasos generales: ajusta tiempos al ingrediente.</div></div>';
        const b = h.indexOf(endMark, a);
        if (a < 0 || b < 0) return h;
        const L = LI[S.lang] || 0, text = (s) => (L === 0 ? s[0] : s[1]);
        const done = st.filter((_, j) => S.mk['s' + m.id + j]).length;
        const diff = m.t >= 30 || st.length >= 5 ? tt('mid') : tt('easy');
        const block = `<h2>${tt('prep')} · ${done}/${st.length}</h2><div class="row" style="gap:8px;margin:-4px 0 10px"><span class="chip">⏱ ${m.t} ${tt('time')}</span><span class="chip">👨‍🍳 ${diff}</span></div><div class="bar" style="margin-bottom:10px"><i style="width:${(done / st.length) * 100}%"></i></div><div class="card vx-steps">` +
          st.map((s, j) => { const k = 's' + m.id + j, on = !!S.mk[k]; return `<div class="row vx-step${on ? ' done' : ''}"><div class="ck ${on ? 'on' : ''}" onclick="tk('${k}')" role="checkbox" aria-checked="${on}" tabindex="0"></div><span class="g"><b class="ac">${j + 1}.</b> ${esc(text(s))}${timerBtn(s[0], j + 1)}</span></div>`; }).join('') +
          `<div class="mu">${tt('tip')}</div></div>`;
        h = h.slice(0, a) + block + h.slice(b + endMark.length);
        return servings(h, m);
      } catch (e) { return h; }
    };
  }
})();
