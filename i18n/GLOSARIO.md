# Glosario de traducción de Volta (idiomas nuevos)

Origen: `i18n/source-en.json` (inglés, idioma puente). Destino: `public/assets/i18n/<idioma>.json` con
`{"lang":"xx","strings":{"<inglés>":"<traducción>"},"patterns":{"<plantilla inglesa>":"<traducción>"}}`.
Comprobar con `node scripts/i18n-check.js <idioma>`.

## Reglas comunes
- Huecos exactos: `{0}`, `{1}`… son cifras; `{s1}`, `{s2}`… son texto variable. Se pueden reordenar.
- Se mantienen emojis, símbolos (⚡ › · → ✓ × ★), puntuación del principio y el final, y 1RM, RIR, RPE.
- Si el inglés está en MAYÚSCULAS, la traducción también (en escrituras con mayúsculas).
- Tono: entrenador amigo, motivador, trato informal. Nunca palabras ofensivas. Botones cortos.
- Nombres de ejercicios: los que se usan de verdad en el gimnasio en ese país. Comidas: nombres naturales.
- Nombres de personas (p. ej. «Julia N.», «Lucía») no se traducen. Volta/VOLTA no se traduce.

| Inglés | de | it | ru | ar | tr | ja | ko | zh | hi |
|---|---|---|---|---|---|---|---|---|---|
| Zeus | Zeus | Zeus | Зевс | زيوس | Zeus | ゼウス | 제우스 | 宙斯 | ज़ीउस |
| Volts (moneda ⚡) | Volt | Volt | Вольты | فولت | Volt | ボルト | 볼트 | 伏特 | वोल्ट |
| Mortal | Sterblicher | Mortale | Смертный | فانٍ | Ölümlü | 人間 | 인간 | 凡人 | मानव |
| Spartan | Spartaner | Spartano | Спартанец | إسبرطي | Spartalı | スパルタ戦士 | 스파르타 전사 | 斯巴达战士 | स्पार्टन |
| Hercules | Herkules | Ercole | Геракл | هرقل | Herkül | ヘラクレス | 헤라클레스 | 赫拉克勒斯 | हरक्यूलिस |
| Apollo | Apollon | Apollo | Аполлон | أبولو | Apollon | アポロン | 아폴론 | 阿波罗 | अपोलो |
| Titan | Titan | Titano | Титан | تيتان | Titan | タイタン | 타이탄 | 泰坦 | टाइटन |
| Kratos | Kratos | Kratos | Кратос | كراتوس | Kratos | クラトス | 크라토스 | 克拉托斯 | क्रेटोस |
| Hermes | Hermes | Ermes | Гермес | هيرميس | Hermes | ヘルメス | 헤르메스 | 赫尔墨斯 | हर्मीस |
| Artemis | Artemis | Artemide | Артемида | أرتميس | Artemis | アルテミス | 아르테미스 | 阿尔忒弥斯 | आर्टेमिस |
| Ares | Ares | Ares | Арес | آريس | Ares | アレス | 아레스 | 阿瑞斯 | एरीज़ |
| Athena | Athene | Atena | Афина | أثينا | Athena | アテナ | 아테나 | 雅典娜 | एथेना |
| Poseidon | Poseidon | Poseidone | Посейдон | بوسيدون | Poseidon | ポセイドン | 포세이돈 | 波塞冬 | पोसाइडन |
| Iron | Eisen | Ferro | Железо | حديد | Demir | アイアン | 아이언 | 黑铁 | आयरन |
| Bronze | Bronze | Bronzo | Бронза | برونز | Bronz | ブロンズ | 브론즈 | 青铜 | ब्रॉन्ज़ |
| Silver | Silber | Argento | Серебро | فضة | Gümüş | シルバー | 실버 | 白银 | सिल्वर |
| Gold | Gold | Oro | Золото | ذهب | Altın | ゴールド | 골드 | 黄金 | गोल्ड |
| Platinum | Platin | Platino | Платина | بلاتين | Platin | プラチナ | 플래티넘 | 铂金 | प्लैटिनम |
| Diamond | Diamant | Diamante | Алмаз | ألماس | Elmas | ダイヤモンド | 다이아몬드 | 钻石 | डायमंड |
| Olympian | Olympisch | Olimpico | Олимпиец | أولمبي | Olimpik | オリンピアン | 올림피안 | 奥林匹斯 | ओलंपियन |
| Labors | Arbeiten des Herkules | Fatiche di Ercole | Подвиги Геракла | أعمال هرقل | Herkül'ün Görevleri | ヘラクレスの12の功業 | 헤라클레스의 12과업 | 赫拉克勒斯的十二伟业 | हरक्यूलिस के 12 कारनामे |
| Streak | Serie | Serie | Серия | سلسلة | Seri | 連続記録 | 연속 기록 | 连续打卡 | स्ट्रीक |
| Olympus | Olymp | Olimpo | Олимп | الأولمب | Olimpos | オリンポス | 올림포스 | 奥林匹斯 | ओलंपस |

## Trato por idioma
- de: «du». it: «tu». ru: «ты» (unidades кг, г, ккал, мл, мин). ar: árabe estándar, neutro o masculino por defecto.
- tr: «sen»; no pegar sufijos a los huecos (mejor «Seri: {0}»). ja: です/ます suave, etiquetas cortas.
- ko: 해요체; evitar partículas pegadas a huecos. zh: chino simplificado, «你», kcal. hi: «तुम», hindi cotidiano
  (palabras de gimnasio en devanagari: वर्कआउट, सेट, रेप्स).
