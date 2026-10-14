/* VOLTA · App de móvil (Capacitor). Solo actúa dentro de la app nativa; en el navegador no hace nada.
   · Botón «atrás» de Android: vuelve a la pantalla anterior; en una pestaña vuelve a Inicio; en Inicio sale de la app.
   · Tocar una notificación abre Inicio.
   · Barra de estado oscura, del color del fondo de Volta. */
(function () {
  'use strict';
  const C = window.Capacitor;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) return;
  const P = C.Plugins || {};
  document.documentElement.classList.add('vx-native', 'vx-' + (C.getPlatform ? C.getPlatform() : 'app'));
  try {
    if (P.App) P.App.addListener('backButton', () => {
      const shut = document.querySelector('.vx-modal-x, [data-vx-close]');
      if (shut) { shut.click(); return; }
      if (S.stack && S.stack.length) { back(); return; }
      if (S.tab !== 'home') { tab('home'); return; }
      P.App.exitApp();
    });
  } catch (e) { /* sin botón atrás */ }
  try {
    if (P.LocalNotifications) P.LocalNotifications.addListener('localNotificationActionPerformed', () => { S.stack = []; tab('home'); });
  } catch (e) { /* sin avisos */ }
  try {
    if (P.StatusBar) { P.StatusBar.setStyle({ style: 'DARK' }).catch(() => {}); if (C.getPlatform && C.getPlatform() === 'android') P.StatusBar.setBackgroundColor({ color: '#0b0c0e' }).catch(() => {}); }
  } catch (e) { /* barra por defecto */ }
})();
