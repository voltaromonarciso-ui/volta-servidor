/* VOLTA · Pantalla de Volta Pro (vista previa, aún sin cobro).
   - Precios decididos: 6,99 €/mes o 49,99 €/año, 7 días de prueba gratis. Plan familiar o de amigos (propuesta: 79,99 €/año, hasta 5).
   - Se ofrece una vez al terminar la bienvenida (y la guía) y siempre desde Perfil. Se cierra y se sigue gratis.
   - El cobro llegará con las tiendas (Google Play y App Store); por ahora los botones lo explican.
   Lo gratis no se recorta nunca. */
(function () {
  'use strict';
  if (typeof R !== 'function' || typeof S === 'undefined' || typeof V === 'undefined') return;
  const LI = { es: 0, en: 1, fr: 2, pt: 3, de: 1, it: 1, ru: 1, ar: 1, tr: 1, ja: 1, ko: 1, zh: 1, hi: 1 };
  const T = {
    title: ['Volta Pro', 'Volta Pro', 'Volta Pro', 'Volta Pro'],
    sub: ['Entrena con Zeus sin límites y llega más lejos.', 'Train with Zeus without limits and go further.', 'Entraîne-toi avec Zeus sans limites et va plus loin.', 'Treina com o Zeus sem limites e vai mais longe.'],
    trial: ['7 días gratis · cancela cuando quieras', '7 days free · cancel anytime', '7 jours gratuits · annule quand tu veux', '7 dias grátis · cancela quando quiseres'],
    b1: ['Zeus sin límite, que adapta tu entreno cada día', 'Unlimited Zeus that adapts your workout every day', 'Zeus illimité qui adapte ton entraînement chaque jour', 'Zeus ilimitado que adapta o teu treino todos os dias'],
    b2: ['Foto de tu comida → calorías y macros', 'Photo of your meal → calories and macros', 'Photo de ton repas → calories et macros', 'Foto da tua refeição → calorias e macros'],
    b3: ['Programas avanzados (fuerza, hipertrofia, calistenia)', 'Advanced programs (strength, hypertrophy, calisthenics)', 'Programmes avancés (force, hypertrophie, callisthénie)', 'Programas avançados (força, hipertrofia, calistenia)'],
    b4: ['Estadísticas completas y comparativas', 'Full stats and comparisons', 'Statistiques complètes et comparaisons', 'Estatísticas completas e comparações'],
    b5: ['Personaliza tu atleta 3D', 'Customize your 3D athlete', 'Personnalise ton athlète 3D', 'Personaliza o teu atleta 3D'],
    b6: ['Sin anuncios', 'No ads', 'Sans publicité', 'Sem anúncios'],
    year: ['Anual', 'Yearly', 'Annuel', 'Anual'],
    month: ['Mensual', 'Monthly', 'Mensuel', 'Mensal'],
    family: ['Familia o amigos', 'Family or friends', 'Famille ou amis', 'Família ou amigos'],
    perYear: ['/año', '/year', '/an', '/ano'],
    perMonth: ['/mes', '/month', '/mois', '/mês'],
    eqMonth: ['solo {0} al mes', 'just {0} a month', 'seulement {0} par mois', 'só {0} por mês'],
    save: ['Ahorra {0} %', 'Save {0}%', 'Économise {0} %', 'Poupa {0}%'],
    best: ['El más elegido', 'Most popular', 'Le plus choisi', 'O mais escolhido'],
    famNote: ['Hasta 5 personas · cada una con su cuenta', 'Up to 5 people · each with their own account', 'Jusqu’à 5 personnes · chacune avec son compte', 'Até 5 pessoas · cada uma com a sua conta'],
    cta: ['Empezar 7 días gratis', 'Start 7 days free', 'Commencer 7 jours gratuits', 'Começar 7 dias grátis'],
    after: ['Después {0}. Te avisamos antes de que acabe la prueba.', 'Then {0}. We’ll remind you before the trial ends.', 'Ensuite {0}. On te prévient avant la fin de l’essai.', 'Depois {0}. Avisamos-te antes de a experiência acabar.'],
    free: ['Seguir con el plan gratis', 'Continue with the free plan', 'Continuer avec le plan gratuit', 'Continuar com o plano grátis'],
    cmp: ['Gratis vs Pro', 'Free vs Pro', 'Gratuit vs Pro', 'Grátis vs Pro'],
    cFree: ['Gratis', 'Free', 'Gratuit', 'Grátis'],
    r1: ['Entrenos, rutinas y técnica 3D', 'Workouts, routines and 3D technique', 'Séances, routines et technique 3D', 'Treinos, rotinas e técnica 3D'],
    r2: ['Racha, ligas, Voltios y amigos', 'Streak, leagues, Volts and friends', 'Série, ligues, Voltios et amis', 'Sequência, ligas, Voltios e amigos'],
    r3: ['Mensajes de Zeus con IA', 'Zeus AI messages', 'Messages de Zeus avec IA', 'Mensagens do Zeus com IA'],
    r3f: ['1 al día', '1 a day', '1 par jour', '1 por dia'],
    r3p: ['Sin límite', 'Unlimited', 'Illimité', 'Ilimitado'],
    r4: ['Entreno adaptado (sueño, tiempo, dolor)', 'Adapted workout (sleep, time, pain)', 'Séance adaptée (sommeil, temps, douleur)', 'Treino adaptado (sono, tempo, dor)'],
    r4f: ['Básico', 'Basic', 'Basique', 'Básico'],
    r4p: ['Con IA', 'With AI', 'Avec IA', 'Com IA'],
    r5: ['Foto de comida', 'Food photo', 'Photo de repas', 'Foto de comida'],
    r6: ['Programas avanzados', 'Advanced programs', 'Programmes avancés', 'Programas avançados'],
    r7: ['Estadísticas completas', 'Full stats', 'Statistiques complètes', 'Estatísticas completas'],
    r8: ['Anuncios', 'Ads', 'Publicité', 'Anúncios'],
    r8f: ['Banner discreto', 'Discreet banner', 'Bannière discrète', 'Banner discreto'],
    r8p: ['Ninguno', 'None', 'Aucune', 'Nenhum'],
    keep: ['Lo gratis es gratis para siempre: nunca lo recortamos.', 'Free stays free forever: we never cut it back.', 'Le gratuit reste gratuit pour toujours : on ne le réduit jamais.', 'O grátis é grátis para sempre: nunca o cortamos.'],
    soon: ['Vista previa: el pago llegará con la app en Google Play y App Store.', 'Preview: payment will arrive with the app on Google Play and the App Store.', 'Aperçu : le paiement arrivera avec l’app sur Google Play et l’App Store.', 'Pré-visualização: o pagamento chega com a app na Google Play e na App Store.'],
    legal: ['La suscripción se renueva sola. Puedes cancelarla en cualquier momento desde tu tienda.', 'The subscription renews automatically. You can cancel anytime from your store.', 'L’abonnement se renouvelle automatiquement. Tu peux l’annuler à tout moment depuis ta boutique.', 'A subscrição renova-se automaticamente. Podes cancelá-la a qualquer momento na tua loja.'],
    banner: ['Prueba Volta Pro 7 días gratis', 'Try Volta Pro free for 7 days', 'Essaie Volta Pro 7 jours gratuits', 'Experimenta o Volta Pro 7 dias grátis'],
    bannerSub: ['Zeus sin límite, foto de comida y más', 'Unlimited Zeus, food photo and more', 'Zeus illimité, photo de repas et plus', 'Zeus ilimitado, foto de comida e mais'],
    close: ['Cerrar', 'Close', 'Fermer', 'Fechar']
  };
  const t = (k) => T[k][LI[S.lang] != null ? LI[S.lang] : 1];
  const fill = (s, v) => s.replace('{0}', v);
  // precios (en euros por ahora; las tiendas pondrán el precio local de cada país)
  const P = { month: 6.99, year: 49.99, family: 79.99 };
  const money = (n) => { try { return new Intl.NumberFormat(S.lang || 'es', { style: 'currency', currency: 'EUR' }).format(n); } catch (e) { return n.toFixed(2).replace('.', ',') + ' €'; } };
  const saving = Math.round((1 - P.year / (P.month * 12)) * 100);
  let plan = 'year';

  function priceText(k) { return k === 'month' ? money(P.month) + t('perMonth') : money(P[k]) + t('perYear'); }
  function card(k) {
    const on = plan === k;
    const top = k === 'year' ? `<span class="vx-pro-tag">${t('best')}</span>` : '';
    const sub = k === 'year' ? `${fill(t('eqMonth'), money(P.year / 12))} · <b>${fill(t('save'), saving)}</b>` : k === 'family' ? t('famNote') : '&nbsp;';
    return `<button class="vx-pro-plan${on ? ' on' : ''}" role="radio" aria-checked="${on}" onclick="vxProPlan('${k}')">${top}<span class="vx-pro-dot" aria-hidden="true"></span>` +
      `<span class="g"><b>${t(k)}</b><span class="mu vx-pro-sub">${sub}</span></span><b class="vx-pro-price">${priceText(k)}</b></button>`;
  }
  V['vx:pro'] = function () {
    const zeus = window.vxZeus ? window.vxZeus('guino', 112) : '⚡';
    const B = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'], IC = ['⚡', '📸', '🏋️', '📊', '🧍', '🚫'];
    const rows = [['r1', '✓', '✓'], ['r2', '✓', '✓'], ['r3', t('r3f'), t('r3p')], ['r4', t('r4f'), t('r4p')], ['r5', '—', '✓'], ['r6', '—', '✓'], ['r7', '—', '✓'], ['r8', t('r8f'), t('r8p')]];
    let h = `<div class="vx-pro">`;
    h += `<div class="row" style="justify-content:flex-end"><button class="back vx-pro-x" onclick="vxProClose()" aria-label="${t('close')}">×</button></div>`;
    h += `<div class="vx-pro-hero">${zeus}<h1>⚡ ${t('title')}</h1><p>${t('sub')}</p><span class="vx-pro-trial">🎁 ${t('trial')}</span></div>`;
    h += `<div class="card vx-pro-ben">${B.map((k, i) => `<div class="row"><span class="vx-pro-ic" aria-hidden="true">${IC[i]}</span><span class="g">${t(k)}</span></div>`).join('')}</div>`;
    h += `<div class="vx-pro-plans" role="radiogroup">${card('year')}${card('month')}${card('family')}</div>`;
    h += `<button class="btn vx-pro-cta" onclick="vxProBuy()">${t('cta')}</button>`;
    h += `<div class="mu vx-pro-after">${fill(t('after'), priceText(plan))}</div>`;
    h += `<button class="btn o vx-pro-free" onclick="vxProClose()">${t('free')}</button>`;
    h += `<h2>${t('cmp')}</h2><div class="card vx-pro-cmp"><div class="row vx-pro-cr vx-pro-ch"><span class="g"></span><b>${t('cFree')}</b><b class="ac">Pro</b></div>` +
      rows.map((r) => `<div class="row vx-pro-cr"><span class="g">${t(r[0])}</span><span>${r[1]}</span><b class="ac">${r[2]}</b></div>`).join('') + '</div>';
    h += `<p class="mu vx-pro-keep">💚 ${t('keep')}</p><p class="mu vx-pro-legal">${t('soon')}<br>${t('legal')}</p></div>`;
    return h;
  };
  const vx = () => (S.vx = S.vx && typeof S.vx === 'object' ? S.vx : {});
  Object.assign(window, {
    vxProOpen() { go('vx:pro'); },
    vxProPlan(k) { plan = k; R(); },
    vxProBuy() { try { toast('⚡ ' + t('soon')); } catch (e) { /* sin aviso */ } },
    vxProClose() { vx().proSeen = 1; sv(); back(); }
  });

  // Perfil: banner de Pro arriba
  const _prof = V.prof;
  V.prof = function () {
    let h = _prof.apply(this, arguments);
    if (S.pro) return h;
    try {
      const ban = `<div class="card row vx-pro-banner" onclick="vxProOpen()" role="button" tabindex="0"><span class="vx-pro-bic" aria-hidden="true">⚡</span><div class="g"><b>${t('banner')}</b><div class="mu">${t('bannerSub')}</div></div><span class="arr">›</span></div>`;
      const i = h.indexOf('<div class="card');
      h = i >= 0 ? h.slice(0, i) + ban + h.slice(i) : h + ban;
    } catch (e) { /* Perfil original */ }
    return h;
  };

  // Pantalla completa: sin la barra de abajo
  const _R0 = R;
  R = function () { _R0.apply(this, arguments); const top = S.stack && S.stack.length ? S.stack[S.stack.length - 1] : ''; document.body.classList.toggle('vx-pro-on', top === 'vx:pro'); };

  // Una vez, justo cuando termina la bienvenida y su guía (S.hasSeenOnboarding pasa a true en esta sesión)
  let seen = !!S.hasSeenOnboarding;
  const _R = R;
  R = function () {
    _R.apply(this, arguments);
    try {
      const now = !!S.hasSeenOnboarding, just = now && !seen; seen = now;
      if (!just || S.pro || vx().proSeen || !S.onboarded) return;
      vx().proSeen = 1; sv();
      setTimeout(() => go('vx:pro'), 400);
    } catch (e) { /* sin pantalla de Pro */ }
  };
})();
