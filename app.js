// === Referencias a elementos del DOM ===
const clockEl = document.getElementById('clock');
const nivelTexto = document.getElementById('nivelTexto');
const nivelBarra = document.getElementById('nivelBarra');
const caudalTexto = document.getElementById('caudalTexto');
const estadoAgua = document.getElementById('estadoAgua');
const ultimoEnvio = document.getElementById('ultimoEnvio');
const paquetesEnviados = document.getElementById('paquetesEnviados');
const dotEstado = document.getElementById('dotEstado');

const consumoHoyEl = document.getElementById('consumoHoy');
const consumoMesEl = document.getElementById('consumoMes');
const lecturasTotalesEl = document.getElementById('lecturasTotales');
const historialEl = document.getElementById('historial');

const listaAlertas = document.getElementById('listaAlertas');
const noAlertas = document.getElementById('noAlertas');

const btnSimular = document.getElementById('btnSimular');
const btnLimpiarHistorial = document.getElementById('btnLimpiarHistorial');
const btnAlertaManual = document.getElementById('btnAlertaManual');

// === Estado general del sistema ===
const estado = {
  lecturas: [],
  paquetes: 0,
  consumoHoy: 0,
  consumoMes: 0
};

// Reloj en header
setInterval(() => {
  const now = new Date();
  clockEl.textContent = now.toLocaleString('es-SV');
}, 1000);

// Utilidad para fecha/hora corta
function fechaCorta () {
  const d = new Date();
  return d.toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Simulación de una lectura de sensores
function simularLectura () {
  // Nivel del tanque entre 10 % y 100 %
  const nivel = Math.round(10 + Math.random() * 90);
  // Caudal entre 0 y 3 m³/h, a veces 0 para simular ausencia de flujo
  let caudal = (Math.random() < 0.15) ? 0 : (0.4 + Math.random() * 2.6);
  caudal = parseFloat(caudal.toFixed(2));

  const lectura = {
    fecha: new Date(),
    nivel,
    caudal
  };

  estado.lecturas.push(lectura);
  if (estado.lecturas.length > 12) {
    estado.lecturas.shift(); // limitar el histórico para la gráfica
  }

  estado.paquetes++;

  // Consumo estimado: integración simplificada del caudal
  estado.consumoHoy += caudal * (5 / 60); // lectura cada 5 min
  estado.consumoMes = estado.consumoHoy * 20; // estimación grosera

  actualizarUI(lectura);
  evaluarAlertas(lectura);
}

// Actualiza todos los componentes visuales
function actualizarUI (lectura) {
  const { nivel, caudal, fecha } = lectura;

  // Nivel
  nivelTexto.textContent = `${nivel} %`;
  nivelBarra.style.width = `${nivel}%`;

  if (nivel < 25) {
    nivelBarra.style.background = 'linear-gradient(90deg,var(--danger),#ef4444)';
  } else if (nivel < 50) {
    nivelBarra.style.background = 'linear-gradient(90deg,var(--warning),#f59e0b)';
  } else {
    nivelBarra.style.background = 'linear-gradient(90deg,var(--accent),var(--ok))';
  }

  // Caudal
  caudalTexto.textContent = `${caudal.toFixed(2)} m³/h`;

  // Estado general del agua
  let estadoTexto = 'Operación normal';
  let color = 'var(--ok)';
  if (nivel < 25) {
    estadoTexto = 'Nivel crítico del tanque';
    color = 'var(--danger)';
  } else if (caudal === 0) {
    estadoTexto = 'Sin flujo: revisar bomba/válvulas';
    color = 'var(--warning)';
  }
  estadoAgua.textContent = estadoTexto;
  estadoAgua.style.color = color;

  // Transmisión
  ultimoEnvio.textContent = fecha.toLocaleTimeString('es-SV');
  paquetesEnviados.textContent = estado.paquetes.toString();
  dotEstado.style.background = 'var(--ok)';

  // Indicadores agregados
  lecturasTotalesEl.textContent = estado.lecturas.length.toString();
  consumoHoyEl.textContent = `${estado.consumoHoy.toFixed(2)} m³`;
  consumoMesEl.textContent = `${estado.consumoMes.toFixed(1)} m³`;

  renderHistorial();
}

// Dibuja las barras del histórico de nivel
function renderHistorial () {
  historialEl.innerHTML = '';
  estado.lecturas.forEach((l, idx) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${l.nivel}%`;
    bar.title = `Lectura ${idx + 1} · Nivel ${l.nivel}%`;
    bar.setAttribute('data-label', `${l.nivel}%`);
    historialEl.appendChild(bar);
  });
}

// Reglas de alerta basadas en el diseño
function evaluarAlertas (lectura) {
  const { nivel, caudal } = lectura;
  let mensaje = null;

  if (nivel < 25) {
    mensaje = 'Bajo nivel de tanque (por debajo de 25 %). Riesgo de desabastecimiento.';
  } else if (caudal === 0 && nivel > 40) {
    mensaje = 'Ausencia de caudal con tanque medio/alto. Posible falla de bomba o válvula cerrada.';
  }

  if (mensaje) {
    registrarAlerta('Automática', mensaje);
  }
}

function registrarAlerta (origen, mensaje) {
  if (noAlertas) {
    noAlertas.remove();
  }
  const li = document.createElement('li');
  li.className = 'alert-item';
  li.innerHTML = `
    <strong>${origen}</strong>
    ${mensaje}
    <div class="alert-meta">${fechaCorta()} · Notificación enviada a los responsables (simulación).</div>
  `;
  listaAlertas.prepend(li);
}

// === Eventos de botones ===
btnSimular.addEventListener('click', simularLectura);

btnLimpiarHistorial.addEventListener('click', () => {
  estado.lecturas = [];
  lecturasTotalesEl.textContent = '0';
  historialEl.innerHTML = '';
});

btnAlertaManual.addEventListener('click', () => {
  const texto = prompt('Describe la alerta que deseas registrar:');
  if (texto && texto.trim().length > 0) {
    registrarAlerta('Manual', texto.trim());
  }
});

// Simulación periódica de transmisión (cada 5 s)
setInterval(simularLectura, 5000);

// Primera lectura al cargar
simularLectura();
