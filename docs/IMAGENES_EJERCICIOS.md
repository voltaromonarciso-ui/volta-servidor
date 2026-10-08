# Imágenes de ejercicios · especificación (estilo «Press de banca»)

La referencia absoluta es la imagen actual de **Press de banca**: una ilustración anatómica sobre un fondo liso.
Este documento sirve para dos cosas:

- en la app, los ejercicios sin imagen propia ya usan una ilustración vectorial animada que sigue estas mismas reglas (`frontend/avatar.js`, estilo `REF`);
- con esta guía, un ilustrador o un generador de imágenes puede producir los recursos definitivos idénticos en estilo.

## Guía de estilo (medida sobre la imagen de referencia)

| Elemento | Valor |
|---|---|
| Formato | 4:3 apaisado. Mínimo 960 × 720 px; se exporta también en 480 × 360 para miniaturas. WebP calidad 82, o JPG. |
| Fondo | Liso `#c4cfc9`, sin suelo, sin escenario, sin degradado visible, sin texto ni marcas de agua. |
| Iluminación | Luz de estudio suave desde arriba a la izquierda, sin sombras duras. Solo una sombra de contacto muy difusa bajo el cuerpo y el banco. |
| Figura | Maniquí anatómico sin ropa ni rasgos faciales y de sexo neutro. Gris medio `#8e9a92`, con sombras en `#77827e`. Fibras musculares en trazo fino `#414c44`, con contorno del mismo color. |
| Músculo objetivo | Verde suave semitransparente: relleno `#82be97`, sombra `#42604d` y opacidad 80–90 %. Sin brillo ni neón. Solo se marca el músculo principal. |
| Material | Gris pizarra mate `#4d5c55`. Brillos en `#bfccc5` (discos, barra y banco). Sin logotipos. |
| Encuadre | El atleta y el material ocupan el 80–90 % del ancho, centrados, con un margen uniforme. Nada cortado. |
| Vista | Tres cuartos desde arriba para ejercicios en banco o suelo y lateral tres cuartos para los de pie. Se elige la vista que mejor muestra la técnica. |
| Momento | La posición más reconocible del movimiento (normalmente la final o la de máxima contracción). |
| Prohibido | Personas reales, marcas, estilos de otras apps, texto, flechas incrustadas, fondos fotográficos, colores neón. |

## Plantilla de prompt (para generar cada imagen)

> Ilustración anatómica médica de un maniquí humano gris sin ropa ni cara haciendo **{EJERCICIO}** con **{MATERIAL}**,
> vista {VISTA}, en la posición de {MOMENTO}. Fibras musculares dibujadas con trazo fino gris oscuro. El músculo
> **{MÚSCULO}** está resaltado en verde suave semitransparente (#82be97). Fondo liso gris verdoso #c4cfc9 sin suelo,
> luz de estudio suave y sombra de contacto difusa. Material gris pizarra mate. Formato 4:3, centrado, nada cortado,
> sin texto ni logotipos. Mismo estilo que la ilustración de referencia de press de banca.

Al recibir cada imagen, se comprueba con esta lista:

1. El fondo mide `#c4cfc9` ± 4 en cada canal.
2. El formato es 4:3.
3. Solo está resaltado el músculo principal y en el verde indicado.
4. La técnica es correcta según la ficha (`frontend/tecnica.js`): espalda neutra, articulaciones alineadas y recorrido completo.
5. No hay manos ni pies deformes ni material imposible.

## Cómo añadir una imagen definitiva

Hay que añadir la imagen (data URL o ruta) al ejercicio en `EMB` o en `e.image`. La app detecta automáticamente que
ya tiene foto real (`hasReal`) y la muestra en la lista y en la ficha. En la ficha la animación sigue apareciendo
debajo, como referencia del movimiento.

## Ejercicios que todavía no tienen imagen propia (182)

| # | Ejercicio | Grupo | Músculo principal | Material | Movimiento | Vista sugerida |
|---|---|---|---|---|---|---|
| 1 | Press militar | Hombros | Deltoides anterior (Anterior) | Barra | ohp | lateral tres cuartos |
| 2 | Curl de bíceps | Bíceps | Bíceps braquial (Cabeza larga) | Mancuernas | curl | lateral tres cuartos |
| 3 | Extensión de tríceps | Tríceps | Tríceps braquial (Cabeza larga) | Polea | overhead | lateral tres cuartos |
| 4 | Sentadilla | Cuádriceps | Cuádriceps (Vasto lateral) | Barra | squat | lateral tres cuartos |
| 5 | Hip thrust | Glúteos | Glúteo mayor (Fibras inferiores) | Barra | thrust | lateral tres cuartos |
| 6 | Plancha | Core | Recto abdominal (Porción media) | Peso corporal | plank | lateral tres cuartos |
| 7 | Elevación de gemelos | Gemelos | Gastrocnemio (Cabeza medial) | Máquina | calf | lateral tres cuartos |
| 8 | Elevaciones laterales | Hombros | Deltoides lateral (Lateral) | Mancuernas | lateral | lateral tres cuartos |
| 9 | Pájaros (deltoides posterior) | Hombros | Deltoides posterior (Posterior) | Mancuernas | reardelt | lateral tres cuartos |
| 10 | Extensión de tríceps sobre la cabeza | Tríceps | Tríceps braquial (Cabeza larga) | Polea | overhead | lateral tres cuartos |
| 11 | Prensa de piernas | Cuádriceps | Cuádriceps (Vasto medial) | Máquina | legpress | lateral tres cuartos |
| 12 | Curl martillo | Bíceps | Braquial (Braquiorradial) | Mancuernas | curl | lateral tres cuartos |
| 13 | Press inclinado en máquina | Pecho | Pectoral mayor (Pectoral clavicular) | Máquina | incline | tres cuartos desde arriba |
| 14 | Aperturas en máquina (peck deck) | Pecho | Pectoral mayor (Pectoral esternal) | Máquina | fly | tres cuartos desde arriba |
| 15 | Flexiones | Pecho | Pectoral mayor (Pectoral esternal) | Peso corporal | pushup | lateral tres cuartos |
| 16 | Pullover en polea | Espalda | Dorsal ancho (Dorsal ancho) | Polea | fly | tres cuartos desde arriba |
| 17 | Peso muerto | Espalda | Dorsal ancho (Erectores / dorsal) | Barra | hinge | lateral tres cuartos |
| 18 | Encogimientos de trapecio | Espalda | Dorsal ancho (Trapecio superior) | Mancuernas | shrug | lateral tres cuartos |
| 19 | Face pull | Espalda | Dorsal ancho (Trapecio medio / deltoides posterior) | Polea | reardelt | lateral tres cuartos |
| 20 | Press militar con mancuernas | Hombros | Deltoides (Deltoides anterior) | Mancuernas | ohp | lateral tres cuartos |
| 21 | Press Arnold | Hombros | Deltoides (Deltoides anterior / lateral) | Mancuernas | ohp | lateral tres cuartos |
| 22 | Press de hombros en máquina | Hombros | Deltoides (Deltoides anterior) | Máquina | ohp | lateral tres cuartos |
| 23 | Press de hombros en Smith | Hombros | Deltoides (Deltoides anterior) | Smith | ohp | lateral tres cuartos |
| 24 | Elevaciones laterales en polea | Hombros | Deltoides (Deltoides lateral) | Polea | lateral | lateral tres cuartos |
| 25 | Elevaciones laterales en máquina | Hombros | Deltoides (Deltoides lateral) | Máquina | lateral | lateral tres cuartos |
| 26 | Elevaciones frontales | Hombros | Deltoides (Deltoides anterior) | Mancuernas | front | lateral tres cuartos |
| 27 | Pájaros en máquina inversa | Hombros | Deltoides (Deltoides posterior) | Máquina | lateral | lateral tres cuartos |
| 28 | Pájaros en polea | Hombros | Deltoides (Deltoides posterior) | Polea | reardelt | lateral tres cuartos |
| 29 | Remo al mentón | Hombros | Deltoides (Deltoides lateral / trapecio) | Barra | reardelt | lateral tres cuartos |
| 30 | Curl con barra Z | Bíceps | Bíceps braquial (Bíceps cabeza larga / corta) | Barra | curl | lateral tres cuartos |
| 31 | Curl con barra recta | Bíceps | Bíceps braquial (Bíceps cabeza corta) | Barra | curl | lateral tres cuartos |
| 32 | Curl inclinado | Bíceps | Bíceps braquial (Bíceps cabeza larga) | Mancuernas | curl | lateral tres cuartos |
| 33 | Curl predicador | Bíceps | Bíceps braquial (Bíceps cabeza corta) | Barra | curl | lateral tres cuartos |
| 34 | Curl concentrado | Bíceps | Bíceps braquial (Bíceps cabeza corta) | Mancuernas | curl | lateral tres cuartos |
| 35 | Curl en polea | Bíceps | Bíceps braquial (Bíceps braquial) | Polea | curl | lateral tres cuartos |
| 36 | Curl spider | Bíceps | Bíceps braquial (Bíceps cabeza corta) | Mancuernas | curl | lateral tres cuartos |
| 37 | Curl martillo con cuerda | Bíceps | Bíceps braquial (Braquial / braquiorradial) | Polea | curl | lateral tres cuartos |
| 38 | Curl inverso | Bíceps | Bíceps braquial (Braquiorradial) | Barra | curl | lateral tres cuartos |
| 39 | Press francés | Tríceps | Tríceps braquial (Tríceps cabeza larga) | Barra | skull | lateral tres cuartos |
| 40 | Fondos en paralelas (tríceps) | Tríceps | Tríceps braquial (Tríceps cabeza lateral / medial) | Peso corporal | dip | lateral tres cuartos |
| 41 | Fondos en banco | Tríceps | Tríceps braquial (Tríceps cabeza lateral / medial) | Peso corporal | dip | lateral tres cuartos |
| 42 | Press cerrado | Tríceps | Tríceps braquial (Tríceps cabeza lateral / medial) | Barra | bench | tres cuartos desde arriba |
| 43 | Extensión con cuerda | Tríceps | Tríceps braquial (Tríceps cabeza lateral) | Polea | pushdown | lateral tres cuartos |
| 44 | Extensión con barra en polea | Tríceps | Tríceps braquial (Tríceps cabeza lateral) | Polea | pushdown | lateral tres cuartos |
| 45 | Patada de tríceps | Tríceps | Tríceps braquial (Tríceps cabeza lateral) | Mancuernas | pushdown | lateral tres cuartos |
| 46 | Extensión unilateral en polea | Tríceps | Tríceps braquial (Tríceps cabeza lateral) | Polea | pushdown | lateral tres cuartos |
| 47 | Extensión de tríceps en máquina | Tríceps | Tríceps braquial (Tríceps cabeza lateral / medial) | Máquina | pushdown | lateral tres cuartos |
| 48 | Sentadilla frontal | Cuádriceps | Cuádriceps (Recto femoral / vasto medial) | Barra | squat | lateral tres cuartos |
| 49 | Sentadilla Hack | Cuádriceps | Cuádriceps (Vasto lateral) | Máquina | squat | lateral tres cuartos |
| 50 | Sentadilla búlgara | Cuádriceps | Cuádriceps (Vasto medial / glúteo) | Mancuernas | lunge | lateral tres cuartos |
| 51 | Zancadas | Cuádriceps | Cuádriceps (Vasto lateral / glúteo) | Mancuernas | lunge | lateral tres cuartos |
| 52 | Extensión de cuádriceps | Cuádriceps | Cuádriceps (Recto femoral) | Máquina | legext | lateral tres cuartos |
| 53 | Sentadilla en Smith | Cuádriceps | Cuádriceps (Vasto lateral) | Smith | squat | lateral tres cuartos |
| 54 | Sentadilla goblet | Cuádriceps | Cuádriceps (Vasto medial) | Mancuernas | squat | lateral tres cuartos |
| 55 | Prensa de piernas unilateral | Cuádriceps | Cuádriceps (Vasto lateral) | Máquina | legpress | lateral tres cuartos |
| 56 | Sentadilla en máquina | Cuádriceps | Cuádriceps (Vasto lateral) | Máquina | squat | lateral tres cuartos |
| 57 | Sissy squat | Cuádriceps | Cuádriceps (Recto femoral) | Peso corporal | squat | lateral tres cuartos |
| 58 | Subida al cajón | Cuádriceps | Cuádriceps (Vasto medial / glúteo) | Mancuernas | lunge | lateral tres cuartos |
| 59 | Peso muerto rumano | Isquiosurales | Isquiosurales (Bíceps femoral / semitendinoso) | Barra | hinge | lateral tres cuartos |
| 60 | Peso muerto rumano con mancuernas | Isquiosurales | Isquiosurales (Bíceps femoral / semitendinoso) | Mancuernas | hinge | lateral tres cuartos |
| 61 | Curl femoral tumbado | Isquiosurales | Isquiosurales (Bíceps femoral) | Máquina | legcurl | lateral tres cuartos |
| 62 | Curl femoral sentado | Isquiosurales | Isquiosurales (Semitendinoso / semimembranoso) | Máquina | legcurl | lateral tres cuartos |
| 63 | Curl femoral de pie | Isquiosurales | Isquiosurales (Bíceps femoral) | Máquina | legcurl | lateral tres cuartos |
| 64 | Buenos días | Isquiosurales | Isquiosurales (Bíceps femoral / erectores) | Barra | hinge | lateral tres cuartos |
| 65 | Curl nórdico | Isquiosurales | Isquiosurales (Bíceps femoral) | Peso corporal | legcurl | lateral tres cuartos |
| 66 | Peso muerto a una pierna | Isquiosurales | Isquiosurales (Semitendinoso / glúteo medio) | Mancuernas | hinge | lateral tres cuartos |
| 67 | Hiperextensión de cadera | Isquiosurales | Isquiosurales (Bíceps femoral / glúteo) | Peso corporal | hinge | lateral tres cuartos |
| 68 | Hip thrust en máquina | Glúteos | Glúteo mayor (Glúteo mayor) | Máquina | thrust | lateral tres cuartos |
| 69 | Puente de glúteo | Glúteos | Glúteo mayor (Glúteo mayor) | Peso corporal | bridge | lateral tres cuartos |
| 70 | Patada de glúteo en polea | Glúteos | Glúteo mayor (Glúteo mayor) | Polea | bridge | lateral tres cuartos |
| 71 | Abducción de cadera en máquina | Glúteos | Glúteo mayor (Glúteo medio) | Máquina | bridge | lateral tres cuartos |
| 72 | Sentadilla sumo | Glúteos | Glúteo mayor (Glúteo mayor / aductores) | Mancuernas | squat | lateral tres cuartos |
| 73 | Hip thrust a una pierna | Glúteos | Glúteo mayor (Glúteo mayor) | Peso corporal | thrust | lateral tres cuartos |
| 74 | Patada de glúteo en cuadrupedia | Glúteos | Glúteo mayor (Glúteo mayor) | Peso corporal | bridge | lateral tres cuartos |
| 75 | Gemelos de pie en máquina | Gemelos | Gastrocnemio / sóleo (Gastrocnemio) | Máquina | calf | lateral tres cuartos |
| 76 | Gemelos sentado | Gemelos | Gastrocnemio / sóleo (Sóleo) | Máquina | calf | lateral tres cuartos |
| 77 | Gemelos en prensa | Gemelos | Gastrocnemio / sóleo (Gastrocnemio) | Máquina | legpress | lateral tres cuartos |
| 78 | Gemelos a una pierna con mancuerna | Gemelos | Gastrocnemio / sóleo (Gastrocnemio) | Mancuernas | calf | lateral tres cuartos |
| 79 | Gemelos en Smith | Gemelos | Gastrocnemio / sóleo (Gastrocnemio) | Smith | calf | lateral tres cuartos |
| 80 | Crunch en polea | Core | Recto abdominal / oblicuos (Recto abdominal superior) | Polea | crunch | lateral tres cuartos |
| 81 | Elevación de piernas colgado | Core | Recto abdominal / oblicuos (Recto abdominal inferior) | Peso corporal | legraise | lateral tres cuartos |
| 82 | Rueda abdominal | Core | Recto abdominal / oblicuos (Recto abdominal) | Peso corporal | crunch | lateral tres cuartos |
| 83 | Crunch abdominal | Core | Recto abdominal / oblicuos (Recto abdominal superior) | Peso corporal | crunch | lateral tres cuartos |
| 84 | Plancha lateral | Core | Recto abdominal / oblicuos (Oblicuos) | Peso corporal | plank | lateral tres cuartos |
| 85 | Russian twist | Core | Recto abdominal / oblicuos (Oblicuos) | Mancuernas | twist | lateral tres cuartos |
| 86 | Pallof press | Core | Recto abdominal / oblicuos (Oblicuos / transverso) | Polea | twist | lateral tres cuartos |
| 87 | Dead bug | Core | Recto abdominal / oblicuos (Transverso) | Peso corporal | plank | lateral tres cuartos |
| 88 | Bicicleta abdominal | Core | Recto abdominal / oblicuos (Oblicuos) | Peso corporal | crunch | lateral tres cuartos |
| 89 | Crunch en máquina | Core | Recto abdominal / oblicuos (Recto abdominal superior) | Máquina | crunch | lateral tres cuartos |
| 90 | Leñador en polea | Core | Recto abdominal / oblicuos (Oblicuos) | Polea | twist | lateral tres cuartos |
| 91 | Encogimientos con mancuernas | Trapecio | Trapecio (Trapecio superior) | Mancuernas | shrug | lateral tres cuartos |
| 92 | Encogimientos con barra | Trapecio | Trapecio (Trapecio superior) | Barra | shrug | lateral tres cuartos |
| 93 | Encogimientos en Smith | Trapecio | Trapecio (Trapecio superior) | Smith | shrug | lateral tres cuartos |
| 94 | Encogimientos con pecho apoyado | Trapecio | Trapecio (Trapecio superior y medio) | Mancuernas | shrug | lateral tres cuartos |
| 95 | Paseo de granjero | Trapecio | Trapecio (Trapecio superior y medio) | Mancuernas | carry | lateral tres cuartos |
| 96 | Curl de muñeca con barra | Antebrazo | Antebrazo (Flexores de la muñeca) | Barra | wrist | lateral tres cuartos |
| 97 | Curl de muñeca con mancuerna | Antebrazo | Antebrazo (Flexores de la muñeca) | Mancuernas | wrist | lateral tres cuartos |
| 98 | Extensión de muñeca con barra | Antebrazo | Antebrazo (Extensores de la muñeca) | Barra | wrist | lateral tres cuartos |
| 99 | Colgarse de la barra | Antebrazo | Antebrazo (Flexores de los dedos (agarre)) | Barra de dominadas | legraise | lateral tres cuartos |
| 100 | Press landmine | Hombros | Deltoides (Deltoides anterior) | Barra | bench | tres cuartos desde arriba |
| 101 | Pull-apart con banda | Hombros | Deltoides posterior (Deltoides posterior) | Bandas | reardelt | lateral tres cuartos |
| 102 | Curl con banda | Bíceps | Bíceps braquial (Bíceps braquial) | Bandas | curl | lateral tres cuartos |
| 103 | Extensión de tríceps con banda | Tríceps | Tríceps braquial (Tríceps braquial) | Bandas | pushdown | lateral tres cuartos |
| 104 | Press JM | Tríceps | Tríceps braquial (Tríceps braquial) | Barra | skull | lateral tres cuartos |
| 105 | Flexiones diamante | Tríceps | Tríceps braquial (Tríceps braquial) | Peso corporal | pushup | lateral tres cuartos |
| 106 | Balanceo con kettlebell | Glúteos | Glúteo mayor (Glúteo mayor) | Kettlebell | swing | lateral tres cuartos |
| 107 | Puente de glúteo a una pierna | Glúteos | Glúteo mayor (Glúteo mayor) | Peso corporal | bridge | lateral tres cuartos |
| 108 | Elevación de talones con peso corporal | Gemelos | Gastrocnemio (Gastrocnemio) | Peso corporal | calf | lateral tres cuartos |
| 109 | Elevación de rodillas colgado | Core | Recto abdominal (Recto abdominal inferior) | Barra de dominadas | legraise | lateral tres cuartos |
| 110 | Press de suelo con mancuernas | Pecho | Pectoral mayor (Pectoral esternal) | Mancuernas | bench | tres cuartos desde arriba |
| 111 | Flexiones inclinadas | Pecho | Pectoral mayor (Pectoral inferior) | Peso corporal | pushup | lateral tres cuartos |
| 112 | Svend press | Pecho | Pectoral mayor (Pectoral esternal) | Mancuernas | bench | tres cuartos desde arriba |
| 113 | Remo Meadows | Espalda | Dorsal ancho (Dorsal medio / romboides) | Barra | row | lateral tres cuartos |
| 114 | Rack pull | Espalda | Dorsal ancho (Erectores / dorsal) | Barra | hinge | lateral tres cuartos |
| 115 | Remo Seal | Espalda | Dorsal ancho (Dorsal medio / romboides) | Barra | row | lateral tres cuartos |
| 116 | Dominadas asistidas en máquina | Espalda | Dorsal ancho (Dorsal (fibras verticales)) | Máquina | pullup | lateral tres cuartos |
| 117 | Superman | Espalda | Dorsal ancho (Erectores / dorsal) | Peso corporal | hinge | lateral tres cuartos |
| 118 | Press Z | Hombros | Deltoides (Deltoides anterior) | Barra | ohp | lateral tres cuartos |
| 119 | Elevaciones en Y | Hombros | Deltoides (Deltoides lateral / trapecio) | Mancuernas | lateral | lateral tres cuartos |
| 120 | Press Bradford | Hombros | Deltoides (Deltoides anterior / lateral) | Barra | ohp | lateral tres cuartos |
| 121 | Rotación externa en polea | Hombros | Deltoides (Deltoides posterior) | Polea | lateral | lateral tres cuartos |
| 122 | Curl Bayesian | Bíceps | Bíceps braquial (Bíceps cabeza larga) | Polea | curl | lateral tres cuartos |
| 123 | Curl 21 | Bíceps | Bíceps braquial (Bíceps cabeza larga / corta) | Barra | curl | lateral tres cuartos |
| 124 | Curl Zottman | Bíceps | Bíceps braquial (Braquial / braquiorradial) | Mancuernas | curl | lateral tres cuartos |
| 125 | Extensión Tate | Tríceps | Tríceps braquial (Tríceps cabeza lateral / medial) | Mancuernas | skull | lateral tres cuartos |
| 126 | Fondos en máquina | Tríceps | Tríceps braquial (Tríceps braquial) | Máquina | dip | lateral tres cuartos |
| 127 | Sentadilla con pausa | Cuádriceps | Cuádriceps (Recto femoral / vasto medial) | Barra | squat | lateral tres cuartos |
| 128 | Zancada inversa | Cuádriceps | Cuádriceps (Vasto medial / glúteo) | Mancuernas | lunge | lateral tres cuartos |
| 129 | Sentadilla con salto | Cuádriceps | Cuádriceps (Vasto lateral / glúteo) | Peso corporal | jump | lateral tres cuartos |
| 130 | Sentadilla isométrica en pared | Cuádriceps | Cuádriceps (Recto femoral) | Peso corporal | squat | lateral tres cuartos |
| 131 | Peso muerto con kettlebell | Isquiosurales | Isquiosurales (Bíceps femoral / glúteo) | Kettlebell | hinge | lateral tres cuartos |
| 132 | Curl femoral deslizante | Isquiosurales | Isquiosurales (Semitendinoso / semimembranoso) | Peso corporal | legcurl | lateral tres cuartos |
| 133 | Frog pump | Glúteos | Glúteo mayor (Glúteo mayor) | Peso corporal | bridge | lateral tres cuartos |
| 134 | Step-up lateral | Glúteos | Glúteo mayor (Glúteo medio) | Mancuernas | lunge | lateral tres cuartos |
| 135 | Abducción con banda | Glúteos | Glúteo mayor (Glúteo medio) | Bandas | bridge | lateral tres cuartos |
| 136 | Hollow hold | Core | Recto abdominal (Recto abdominal) | Peso corporal | plank | lateral tres cuartos |
| 137 | Mountain climbers | Core | Recto abdominal (Recto abdominal inferior) | Peso corporal | plank | lateral tres cuartos |
| 138 | Bird dog | Core | Recto abdominal (Transverso) | Peso corporal | plank | lateral tres cuartos |
| 139 | Plancha con toque de hombro | Core | Recto abdominal (Oblicuos / transverso) | Peso corporal | plank | lateral tres cuartos |
| 140 | Saltos a la comba | Gemelos | Gastrocnemio (Gastrocnemio) | Peso corporal | jump | lateral tres cuartos |
| 141 | Rodillo de muñeca | Antebrazo | Antebrazo (Flexores de la muñeca) | Barra | wrist | lateral tres cuartos |
| 142 | Encogimientos en máquina | Trapecio | Trapecio (Trapecio superior) | Máquina | shrug | lateral tres cuartos |
| 143 | Press de banca con pausa | Pecho | Pectoral mayor (Pectoral esternal) | Barra | bench | tres cuartos desde arriba |
| 144 | Press inclinado con agarre neutro | Pecho | Pectoral mayor (Pectoral clavicular) | Mancuernas | incline | tres cuartos desde arriba |
| 145 | Aperturas en banco declinado | Pecho | Pectoral mayor (Pectoral inferior) | Mancuernas | fly | tres cuartos desde arriba |
| 146 | Flexiones con pies elevados | Pecho | Pectoral mayor (Pectoral clavicular) | Peso corporal | pushup | lateral tres cuartos |
| 147 | Flexiones arqueras | Pecho | Pectoral mayor (Pectoral esternal) | Peso corporal | pushup | lateral tres cuartos |
| 148 | Remo con mancuerna en banco inclinado | Espalda | Dorsal ancho (Dorsal medio / romboides) | Mancuernas | row | lateral tres cuartos |
| 149 | Remo Kroc | Espalda | Dorsal ancho (Dorsal ancho) | Mancuernas | row | lateral tres cuartos |
| 150 | Jalón con brazos rectos | Espalda | Dorsal ancho (Dorsal ancho) | Polea | pushdown | lateral tres cuartos |
| 151 | Dominadas lastradas | Espalda | Dorsal ancho (Dorsal (fibras verticales)) | Barra de dominadas | pullup | lateral tres cuartos |
| 152 | Remo gorila | Espalda | Dorsal ancho (Dorsal medio / romboides) | Kettlebell | row | lateral tres cuartos |
| 153 | Peso muerto sumo | Isquiosurales | Isquiosurales (Bíceps femoral / glúteo) | Barra | hinge | lateral tres cuartos |
| 154 | Peso muerto con barra hexagonal | Isquiosurales | Isquiosurales (Bíceps femoral / glúteo) | Barra | hinge | lateral tres cuartos |
| 155 | Press militar sentado | Hombros | Deltoides (Deltoides anterior) | Mancuernas | ohp | lateral tres cuartos |
| 156 | Elevaciones laterales inclinado | Hombros | Deltoides (Deltoides lateral) | Mancuernas | lateral | lateral tres cuartos |
| 157 | Remo al mentón con polea | Hombros | Deltoides (Deltoides lateral / trapecio) | Polea | reardelt | lateral tres cuartos |
| 158 | Press cubano | Hombros | Deltoides (Deltoides posterior) | Mancuernas | ohp | lateral tres cuartos |
| 159 | Curl de arrastre | Bíceps | Bíceps braquial (Bíceps cabeza larga) | Barra | curl | lateral tres cuartos |
| 160 | Curl martillo cruzado | Bíceps | Bíceps braquial (Braquial / braquiorradial) | Mancuernas | curl | lateral tres cuartos |
| 161 | Curl en banco Scott con mancuerna | Bíceps | Bíceps braquial (Bíceps cabeza corta) | Mancuernas | curl | lateral tres cuartos |
| 162 | Curl de concentración en polea | Bíceps | Bíceps braquial (Bíceps cabeza corta) | Polea | curl | lateral tres cuartos |
| 163 | Extensión de tríceps en polea por encima de la cabeza | Tríceps | Tríceps braquial (Tríceps cabeza larga) | Polea | overhead | lateral tres cuartos |
| 164 | Press de banca agarre cerrado en Smith | Tríceps | Tríceps braquial (Tríceps braquial) | Smith | bench | tres cuartos desde arriba |
| 165 | Flexiones en banco para tríceps | Tríceps | Tríceps braquial (Tríceps cabeza lateral / medial) | Peso corporal | pushup | lateral tres cuartos |
| 166 | Sentadilla con barra a la espalda baja | Cuádriceps | Cuádriceps (Recto femoral / vasto medial) | Barra | squat | lateral tres cuartos |
| 167 | Sentadilla Zercher | Cuádriceps | Cuádriceps (Vasto medial / glúteo) | Barra | squat | lateral tres cuartos |
| 168 | Sentadilla pistol asistida | Cuádriceps | Cuádriceps (Vasto lateral / glúteo) | Peso corporal | squat | lateral tres cuartos |
| 169 | Zancadas caminando | Cuádriceps | Cuádriceps (Vasto medial / glúteo) | Mancuernas | lunge | lateral tres cuartos |
| 170 | Prensa con pies altos | Glúteos | Glúteo mayor (Glúteo mayor) | Máquina | legpress | lateral tres cuartos |
| 171 | Hip thrust con banda | Glúteos | Glúteo mayor (Glúteo medio) | Bandas | thrust | lateral tres cuartos |
| 172 | Patada de glúteo en máquina | Glúteos | Glúteo mayor (Glúteo mayor) | Máquina | bridge | lateral tres cuartos |
| 173 | Peso muerto rumano a una pierna con mancuerna | Isquiosurales | Isquiosurales (Bíceps femoral / glúteo) | Mancuernas | hinge | lateral tres cuartos |
| 174 | Curl femoral con fitball | Isquiosurales | Isquiosurales (Semitendinoso / semimembranoso) | Peso corporal | legcurl | lateral tres cuartos |
| 175 | Gemelos en máquina de prensa a una pierna | Gemelos | Gastrocnemio (Gastrocnemio) | Máquina | legpress | lateral tres cuartos |
| 176 | Gemelos tibial anterior | Gemelos | Gastrocnemio (Sóleo) | Peso corporal | calf | lateral tres cuartos |
| 177 | Crunch inverso | Core | Recto abdominal (Recto abdominal inferior) | Peso corporal | crunch | lateral tres cuartos |
| 178 | V-ups | Core | Recto abdominal (Recto abdominal) | Peso corporal | crunch | lateral tres cuartos |
| 179 | Plancha con rodilla al codo | Core | Recto abdominal (Oblicuos) | Peso corporal | crunch | lateral tres cuartos |
| 180 | Elevación de piernas tumbado | Core | Recto abdominal (Recto abdominal inferior) | Peso corporal | crunch | lateral tres cuartos |
| 181 | Encogimientos en polea | Trapecio | Trapecio (Trapecio superior) | Polea | shrug | lateral tres cuartos |
| 182 | Curl inverso con barra Z | Antebrazo | Antebrazo (Extensores de la muñeca) | Barra | curl | lateral tres cuartos |
