// Vehículos que se compran y se conducen. Todos usan el mismo sistema de
// conducción (systems/riding.js): cambian sus números, su modelo y su postura.
// Preparado para añadir motos y coches con otra entrada (kind/seat/pose propios).
export const VEHICLES = {
  bici: {
    name: 'Bicicleta urbana', price: 180, kind: 'bike', color: '#c0392b',
    max: 8.6,        // m/s (correr a pie: 6,8)
    accel: 3.4, brake: 8, reverse: 1.2, turn: 2.0, radius: 0.45,
    desc: 'Algo más rápida que correr. No gasta nada.',
  },
  patinete: {
    name: 'Patinete eléctrico', price: 520, kind: 'scooter', color: '#2e86de',
    max: 12.5, accel: 5.2, brake: 9, reverse: 1, turn: 2.2, radius: 0.4,
    battery: 2600,   // metros con la batería llena
    chargeMin: 120,  // minutos de juego para cargarla entera en tu propiedad
    desc: 'Más rápido, pero gasta batería. Se carga aparcado en tu nave o tu casa.',
  },
};

// Aparcamiento de la tienda: donde aparecen al comprarlos y donde se recuperan.
export const PARKING = {
  bici: { x: 95.4, z: 41.2, yaw: 0 },
  patinete: { x: 95.4, z: 50.8, yaw: 0 },
};
export const RECOVER_PRICE = 15;
