let baseDatos = [];

// Cargar la base de datos al iniciar
// Cargar la base de datos al iniciar
fetch("base_datos.csv")
    .then(response => response.text())
    .then(data => {
        const filas = data.split("\n").slice(1); // Omitir cabecera

        filas.forEach(fila => {
            if (!fila.trim()) return; // Saltar líneas vacías

            // Usar Regex para capturar todo lo que esté entre comillas "..."
            // Esto es más robusto que split(',') o split('","') si hay variaciones
            const matches = [...fila.matchAll(/"([^"]*)"/g)].map(m => m[1]);

            if (matches.length >= 3) {
                // Limpiar espacios extra por si acaso
                const codigoRaw = matches[0].trim();

                // Nombre viene como "CODIGO_Apellido Nombre.pdf", limpiamos
                let nombreRaw = matches[1].trim();
                // Intentar extraer el nombre real después del primer guion bajo
                let nombreLimpio = nombreRaw;
                if (nombreRaw.includes('_')) {
                    nombreLimpio = nombreRaw.split('_')[1];
                }
                // Quitar extensión .pdf si existe
                nombreLimpio = nombreLimpio.replace(/\.pdf$/i, "").trim();

                const urlPreview = matches[2].trim();

                // Convertir URL de preview a download
                // De: https://drive.google.com/file/d/ID/preview...
                // A: https://drive.google.com/uc?export=download&id=ID
                let urlDownload = urlPreview;
                const idMatch = urlPreview.match(/\/d\/(.*?)\//);
                if (idMatch && idMatch[1]) {
                    urlDownload = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
                }

                baseDatos.push({
                    codigo: codigoRaw,
                    dni: extraerDNI(codigoRaw),
                    nombre: nombreLimpio,
                    urlPreview: urlPreview,
                    urlDownload: urlDownload
                });
            }
        });
        console.log(`Base de datos cargada: ${baseDatos.length} registros.`);
    })
    .catch(error => console.error("Error al cargar la base de datos:", error));

function extraerDNI(codigo) {
    // El formato parece ser siempre "01" + DNI + "De" o similar.
    // Ejemplo: "0175174425De" -> DNI 75174425
    // Ejemplo: "0106672532De" -> DNI 06672532 -> 6672532 (como número)

    // Si empieza con 01, quitamos el prefijo para evitar que se interprete como parte del número (ej. 175...)
    let codigoLimpio = codigo;
    if (codigo.startsWith("01")) {
        codigoLimpio = codigo.substring(2);
    }

    const match = codigoLimpio.match(/\d+/);
    if (match) {
        return parseInt(match[0], 10).toString(); // Convertir a número y luego string para normalizar (sin ceros izq)
    }
    return codigo; // Fallback
}

function buscar() {
    const inputUsuario = document.getElementById("codigo").value.trim();
    const resultadoDiv = document.getElementById("resultado");
    const errorDiv = document.getElementById("mensaje-error");

    // Resetear estado
    resultadoDiv.classList.remove("active");
    resultadoDiv.innerHTML = "";
    errorDiv.textContent = "";
    errorDiv.classList.remove("visible");

    if (!inputUsuario) {
        errorDiv.textContent = "Por favor ingrese un número de documento válido.";
        errorDiv.classList.add("visible");
        return;
    }

    // Normalizar entrada del usuario (quitar ceros a la izquierda si es numérico)
    let dniBuscado = inputUsuario;
    if (/^\d+$/.test(inputUsuario)) {
        dniBuscado = parseInt(inputUsuario, 10).toString();
    }

    // Buscar coincidencia exacta del DNI normalizado y asegurarnos que existe el nombre
    const encontrado = baseDatos.find(item => item.dni === dniBuscado);

    if (encontrado) {
        resultadoDiv.innerHTML = `
            <h3 class="student-name">${encontrado.nombre}</h3>
            <button onclick="descargarPDF('${encontrado.urlDownload}')" class="download-btn">
                Descargar Constancia en PDF
            </button>
            <iframe src="${encontrado.urlPreview}"></iframe>
        `;
        resultadoDiv.classList.add("active");
    } else {
        errorDiv.textContent = "DNI no encontrado";
        errorDiv.classList.add("visible");
    }
}

function descargarPDF(url) {
    if (verificarLimiteDescargas()) {
        // Crear un enlace temporal para forzar la descarga
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank'; // Abrir en nueva pestaña por si acaso el navegador bloquea la descarga directa
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        registrarDescarga();
    } else {
        alert("Se ha llegado al limite maximo de descargas, espere unos minutos e intentelo más tarde");
    }
}

function verificarLimiteDescargas() {
    const LIMITE = 3;
    const POZO_TIEMPO_MS = 60000; // 1 minuto
    const ahora = Date.now();

    // Obtener historial de descargas del localStorage
    let historial = JSON.parse(localStorage.getItem('historialDescargas') || '[]');

    // Filtrar descargas que ocurrieron hace más de 1 minuto
    historial = historial.filter(timestamp => ahora - timestamp < POZO_TIEMPO_MS);

    // Guardar historial limpio
    localStorage.setItem('historialDescargas', JSON.stringify(historial));

    return historial.length < LIMITE;
}

function registrarDescarga() {
    const ahora = Date.now();
    let historial = JSON.parse(localStorage.getItem('historialDescargas') || '[]');
    historial.push(ahora);
    localStorage.setItem('historialDescargas', JSON.stringify(historial));
}

// Permitir buscar al presionar Enter
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("codigo");
    if (input) {
        input.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                buscar();
            }
        });
    }
});
