// === Referencias a elementos del DOM ===
const clockEl = document.getElementById('clock');
const nivelTexto = document.getElementById('nivelTexto');
const nivelBarra = document.getElementById('nivelBarra');
const caudalTexto = document.getElementById('caudalTexto');
const estadoAgua = document.getElementById('estadoAgua');
const calidadAgua = document.getElementById('calidadAgua');
const nivelepH = document.getElementById('nivelepH');
const consumible = document.getElementById('consumible');
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
  
  // Calidad del agua - simulación
  const pH = parseFloat((6.5 + Math.random() * 1.5).toFixed(1));
  const calidadStates = ['Excelente', 'Buena', 'Normal', 'Deficiente'];
  const calidadIndex = Math.floor(Math.random() * 4);
  const calidad = calidadStates[calidadIndex];
  const esConsumible = calidadIndex <= 2; // Excelente, Buena y Normal son consumibles

  const lectura = {
    fecha: new Date(),
    nivel,
    caudal,
    pH,
    calidad,
    consumible: esConsumible
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
  const { nivel, caudal, fecha, pH, calidad, consumible } = lectura;

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

  // Calidad del agua
  calidadAgua.textContent = calidad;
  nivelepH.textContent = `${pH}`;
  
  let colorCalidad = 'var(--ok)';
  if (calidad === 'Excelente') colorCalidad = 'var(--ok-light)';
  else if (calidad === 'Buena') colorCalidad = 'var(--ok)';
  else if (calidad === 'Normal') colorCalidad = 'var(--warning)';
  else colorCalidad = 'var(--danger)';
  
  calidadAgua.style.color = colorCalidad;
  const consumibleEl = document.getElementById('consumible');
  consumibleEl.textContent = consumible ? '✓ Sí' : '✗ No';
  consumibleEl.style.color = consumible ? 'var(--ok)' : 'var(--danger)';

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

// === Referencias a elementos de exportación ===
const btnExportPDF = document.getElementById('btnExportPDF');

// Función para descargar archivo
function descargarArchivo(contenido, nombre, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Exportar como PDF
btnExportPDF.addEventListener('click', () => {
  if (estado.lecturas.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }
  
  // Crear HTML profesional para convertir a PDF
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Agua</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; background: white; }
        .container { max-width: 900px; margin: 0 auto; padding: 30px; }
        .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
        .header h1 { color: #3b82f6; font-size: 26px; margin-bottom: 5px; }
        .header p { color: #666; font-size: 13px; }
        .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; }
        .info-box p { margin: 5px 0; font-size: 12px; }
        .section { margin-bottom: 25px; page-break-inside: avoid; }
        .section h2 { color: #1f2937; font-size: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; }
        .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .data-item { border: 1px solid #e5e7eb; padding: 12px; border-radius: 6px; background: #fafafa; }
        .data-label { font-weight: bold; color: #3b82f6; font-size: 11px; }
        .data-value { font-size: 13px; color: #1f2937; margin-top: 5px; }
        .status-good { color: #10b981; font-weight: bold; }
        .status-warning { color: #f59e0b; font-weight: bold; }
        .status-danger { color: #ef4444; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
        th { background: #3b82f6; color: white; padding: 10px; text-align: left; font-weight: bold; }
        td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { margin-top: 40px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #666; font-size: 10px; }
        @media print {
          body { padding: 0; }
          .container { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SISTEMA DE MONITOREO DE AGUA</h1>
          <p>Reporte de Datos Historicos • Universidad Don Bosco</p>
        </div>
        
        <div class="info-box">
          <p><strong>Fecha de generacion:</strong> ${new Date().toLocaleString('es-SV')}</p>
          <p><strong>Total de lecturas:</strong> ${estado.lecturas.length}</p>
          <p><strong>Periodo:</strong> ${estado.lecturas[0].fecha.toLocaleString('es-SV')} - ${estado.lecturas[estado.lecturas.length-1].fecha.toLocaleString('es-SV')}</p>
        </div>
        
        <div class="section">
          <h2>📊 Resumen de Indicadores</h2>
          <div class="data-grid">
            <div class="data-item">
              <div class="data-label">Consumo Estimado Hoy</div>
              <div class="data-value">${estado.consumoHoy.toFixed(2)} m³</div>
            </div>
            <div class="data-item">
              <div class="data-label">Consumo Estimado Mes</div>
              <div class="data-value">${estado.consumoMes.toFixed(2)} m³</div>
            </div>
            <div class="data-item">
              <div class="data-label">Nivel Promedio Tanque</div>
              <div class="data-value">${(estado.lecturas.reduce((s, l) => s + l.nivel, 0) / estado.lecturas.length).toFixed(1)}%</div>
            </div>
            <div class="data-item">
              <div class="data-label">Caudal Promedio</div>
              <div class="data-value">${(estado.lecturas.reduce((s, l) => s + l.caudal, 0) / estado.lecturas.length).toFixed(2)} m³/h</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>💧 Historico Detallado de Lecturas</h2>
          <table>
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Nivel (%)</th>
                <th>Caudal (m³/h)</th>
                <th>pH</th>
                <th>Calidad</th>
                <th>Consumible</th>
              </tr>
            </thead>
            <tbody>
              ${estado.lecturas.map(l => `
                <tr>
                  <td>${l.fecha.toLocaleString('es-SV')}</td>
                  <td><strong>${l.nivel}%</strong></td>
                  <td>${l.caudal.toFixed(2)}</td>
                  <td>${l.pH}</td>
                  <td><span class="${l.calidad === 'Excelente' ? 'status-good' : l.calidad === 'Normal' ? 'status-warning' : l.calidad === 'Buena' ? 'status-good' : 'status-danger'}">${l.calidad}</span></td>
                  <td>${l.consumible ? '<span class="status-good">✓ Si</span>' : '<span class="status-danger">✗ No</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Este reporte fue generado automaticamente por el Sistema de Monitoreo de Agua.</p>
          <p>Para informacion adicional, contacte al departamento tecnico de la Universidad Don Bosco.</p>
        </div>
      </div>
      <script>
        window.addEventListener('load', function() {
          window.print();
        });
      </script>
    </body>
    </html>
  `;
  
  // Abrir en nueva ventana y permitir imprimir a PDF
  const ventana = window.open('', '', 'width=800,height=600');
  ventana.document.write(html);
  ventana.document.close();
  
  // Para Chrome y navegadores modernos, esperar a que cargue y luego imprimir
  setTimeout(() => {
    ventana.print();
  }, 500);
});
