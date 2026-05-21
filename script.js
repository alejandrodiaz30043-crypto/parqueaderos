let totalNeto = 0;
let almacenes = { pequenos: [], grandes: [] };

fetch('almacenes.json')
    .then(r => r.json())
    .then(data => {
        almacenes = data;
        const dl = document.getElementById('listaAlmacenes');
        [...data.pequenos, ...data.grandes].forEach(a => {
            let o = document.createElement('option');
            o.value = a;
            dl.appendChild(o);
        });
    });

function liquidar() {
    const t = document.getElementById('tipoVehiculo').value;
    const p = document.getElementById('placa').value.trim().toUpperCase();
    const m = parseInt(document.getElementById('minutos').value);
    const pp = document.getElementById('picoPlaca').checked;
    const loc = document.getElementById('almacen').value.trim();
    const v = parseFloat(document.getElementById('valorCompra').value) || 0;

    // --- VALIDACIÓN DE PLACA ---
    // Auto: 3 letras y 3 números | Moto: 2-3 letras, 2 números, A-I final opcional
    const regexAuto = /^[A-Z]{3}[0-9]{3}$/;
    const regexMoto = /^([A-Z]{2,3}[0-9]{2}[A-I]{1}|[A-Z]{2,3}[0-9]{2})$/;

    if (t === "Automóvil" && !regexAuto.test(p)) {
        alert("Placa inválida para Automóvil. Debe ser: 3 letras y 3 números.");
        return;
    }
    if (t === "Moto" && !regexMoto.test(p)) {
        alert("Placa de Moto inválida. Formato: 2-3 letras + 2 números (opcional: A-I al final).");
        return;
    }

    if (isNaN(m) || m < 1) {
        alert("Por favor, ingrese un número de minutos válido (mínimo 1).");
        return;
    }

    const regexLetras = /^[A-Za-z\s]+$/;
    if (loc !== "" && !regexLetras.test(loc)) {
        alert("El nombre del almacén solo debe contener letras.");
        return;
    }

    let tarifa = (t === "Automóvil") ? 110 : 80;
    let sub = m * tarifa;
    let descTotal = 0;
    let detalleDesc = "Sin descuentos";

    // 1. Descuento Pico y Placa (Solo Automóvil) - Ajustado a 10%
    if (t === "Automóvil" && pp) {
        descTotal += 0.10;
        detalleDesc = "Pico y Placa (10%)";
    }

    // 2. Lógica de Descuentos Escalonados (Reducidos)
    let dComp = 0;
    if (v >= 50000) {
        if (v >= 200000) dComp = 0.20;      // 20%
        else if (v >= 150000) dComp = 0.12; // 12%
        else if (v >= 100000) dComp = 0.08; // 8%
        else if (v >= 50000) dComp = 0.03;  // 3%
    }

    // Bonos adicionales
    if (almacenes.grandes.includes(loc) && dComp > 0) dComp += 0.05; // Extra 5%
    if (t === "Moto" && dComp > 0) dComp += 0.02;                    // Extra 2%

    // Aplicar descuento de compras
    if (dComp > 0) {
        descTotal += dComp;
        detalleDesc = (detalleDesc === "Sin descuentos") ? `Convenio ${loc} (${(dComp * 100).toFixed(0)}%)` : `Pico y Placa + Convenio (${(descTotal * 100).toFixed(0)}%)`;
    }

    let final = sub * (1 - descTotal);
    totalNeto = Math.ceil(final / 50) * 50;

    // INYECCIÓN SEMÁNTICA
    document.getElementById('contenedor-resultado').classList.remove('oculto');
    document.getElementById('detalle-factura').innerHTML = `
        <ul>
            <li><span>Placa:</span> <strong>${p}</strong></li>
            <li><span>Último Dígito:</span> <strong>${p.slice(-1)}</strong></li>
            <li><span>Tarifa:</span> <span>$${tarifa}/min</span></li>
            <li><span>Subtotal:</span> <span>$${sub}</span></li>
            <li><span>Descuento aplicado:</span> <strong>${detalleDesc}</strong></li>
            <li><span>Total Descuento:</span> <span>${(descTotal * 100).toFixed(0)}%</span></li>
            <li><span><strong>TOTAL A PAGAR:</strong></span> <strong>$${totalNeto}</strong></li>
        </ul>
    `;
}

function calcularCambio() {
    let pagoInput = document.getElementById('montoCliente');
    let pago = parseInt(pagoInput.value);

    if (isNaN(pago) || pago < totalNeto) {
        alert("Monto insuficiente o inválido.");
        return;
    }

    let devuelta = pago - totalNeto;
    const dens = [50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50];
    let resHTML = `<p><strong>Cambio: $${devuelta}</strong></p><ul>`;

    dens.forEach(d => {
        if (devuelta >= d) {
            let cant = Math.floor(devuelta / d);
            devuelta %= d;
            resHTML += `<li>${cant} x $${d}</li>`;
        }
    });
    resHTML += "</ul>";
    document.getElementById('area-cambio').innerHTML = resHTML;
}