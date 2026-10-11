# Sistema de progreso de Volta: Voltios ⚡

## El problema

Había 6 contadores distintos y cada uno contaba a su manera:

- racha;
- Favor del Oráculo (Peregrino, con su propio nivel);
- rango Mortal → Kratos;
- Arena (puntos por semana);
- 12 Trabajos de Hércules;
- 112 logros.

Además, la misma escala de nombres (Mortal, Espartano…) se usaba para dos cosas distintas: el rango por XP y la fuerza
por ejercicio. Por eso algunos números no cuadraban: con 12 entrenos en el historial, el Oráculo decía 0.

## Lo que aprendimos de otras apps

- **Duolingo**: rachas, ligas semanales con ascensos y descensos, y rachas con amigos. Es el mejor ejemplo de retención.
  También vio que quien hace mucho de golpe abandona antes, así que conviene premiar la constancia, no el volumen.
- **Habitica**: un juego de rol que abruma con el tiempo y premia hacer cosas, no mejorar.
- **Liftoff**: los rangos de fuerza gustan, pero los suyos son incoherentes y todo está detrás de un muro de pago.
- **Strava**: el resumen anual y los kudos son lo que más se comparte.
- **En fitness hay que descansar**: una racha diaria pura castiga el descanso. Hace falta un objetivo semanal.

## El sistema

Hay **una sola moneda**, los **Voltios ⚡** (de «voltio», el nombre de la app). De ella salen tres cosas, y cada una
responde a una pregunta:

| Pieza | Responde a | Cómo se calcula | ¿Se puede perder? |
|---|---|---|---|
| **Rango** (Mortal I → Kratos V) | «¿Cuánto camino llevo?» | Voltios totales | Nunca |
| **Liga semanal** (Hermes → Zeus) | «¿Cómo voy esta semana?» | Voltios de entreno y misiones de esta semana frente a tu grupo (logros y Trabajos no cuentan aquí) | Sí, se puede bajar de liga |
| **Racha** (diaria y semanal) | «¿Estoy siendo constante?» | Días activos y semanas que cumples tu objetivo | Sí, con congeladores |

La **fuerza** va aparte y no da Voltios. Es un rango por ejercicio con nombres de metales (Hierro, Bronce, Plata, Oro,
Platino, Diamante, Olímpico) para no confundirla con el Rango.

### Cómo se ganan los Voltios

Todo se calcula a partir de los datos del usuario, así que los números siempre cuadran.

| Acción | Voltios | Límites |
|---|---|---|
| Entreno (3 series efectivas o más ese día) | +60 | Una vez al día |
| Cada serie efectiva | +3 | Máximo 30 series al día (+90) |
| Récord personal (1RM estimado nuevo en un ejercicio) | +20 | Máximo 3 al día |
| **Multiplicador por racha semanal** (sobre las tres filas anteriores) | ×1,1 con 1 semana; ×1,2 con 2–3; ×1,3 con 4–7; ×1,4 con 8–11; ×1,5 con 12 o más | Cuenta las semanas seguidas que cumples tu objetivo |
| Cumplir el objetivo de la semana (tus días del cuestionario) | +150 | Una vez por semana |
| Misión principal cumplida (entrenar, 2 comidas, 2 L de agua) | +15 cada una | — |
| Día perfecto (las 3 principales) | +30 | — |
| Misión del día cumplida | +20 cada una | — |
| Logro conseguido | +25 × nivel del logro | Máximo +250 por logro |
| Trabajo de Hércules | +500 | — |

**Juego limpio:**

- Las series imposibles no cuentan: más de 100 repeticiones, o un peso por encima de 5 veces el peso corporal (mínimo
  400 kg).
- Volver a registrar el mismo día no multiplica la base de entreno.

### Rango

Hay 7 rangos con 5 niveles cada uno (I a V): **Mortal, Espartano, Hércules, Apolo, Titán, Zeus y Kratos**. Mantienen sus
emblemas.

| Rango | Voltios para entrar |
|---|---|
| Mortal | 0 |
| Espartano | 1.000 |
| Hércules | 4.000 |
| Apolo | 10.000 |
| Titán | 22.000 |
| Zeus | 45.000 |
| Kratos | 85.000 |

Kratos V se alcanza con unos 150.000 Voltios: unos 3 años entrenando 4 días por semana. Al subir de nivel hay una
ceremonia con el rayo de Zeus.

### Liga semanal

- Hay 6 ligas: Hermes, Artemisa, Ares, Atenea, Poseidón y Zeus.
- Grupos de 30. Al terminar la semana suben los 7 primeros y bajan los 5 últimos.
- **Sin servidor**, el grupo es una «liga de práctica» con rivales simulados. Se indica en la pantalla, para no engañar
  a nadie.
- Cuando haya servidor, el grupo será de personas reales con la misma fórmula, calculada en el servidor.
- Cada lunes se muestra el resultado de la semana: subes, te mantienes o bajas.

### Qué pasa con lo que ya había

- **Oráculo**: deja de ser un sistema propio. Su tarjeta muestra el Rango, los Voltios de hoy y de la semana y el
  objetivo semanal. Más adelante la presentará Zeus.
- **Arena**: pasa a ser la Liga semanal.
- **Logros y Trabajos**: siguen siendo colecciones, y ahora dan Voltios.
- **Racha diaria**: sigue igual, con congeladores. Se suma el objetivo semanal, que es el que da el multiplicador.
