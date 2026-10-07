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
  };
  const LI = { es: 0, en: 1, fr: 2, pt: 3 };
  const tt = (k) => TXT[k][LI[S.lang] || 0];
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
          st.map((s, j) => { const k = 's' + m.id + j, on = !!S.mk[k]; return `<div class="row vx-step${on ? ' done' : ''}"><div class="ck ${on ? 'on' : ''}" onclick="tk('${k}')" role="checkbox" aria-checked="${on}" tabindex="0"></div><span class="g"><b class="ac">${j + 1}.</b> ${esc(text(s))}</span></div>`; }).join('') +
          `<div class="mu">${tt('tip')}</div></div>`;
        return h.slice(0, a) + block + h.slice(b + endMark.length);
      } catch (e) { return h; }
    };
  }
})();
