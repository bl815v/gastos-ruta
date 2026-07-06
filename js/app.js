import {
	FILAS_MINIMAS,
	ZOOM_DEFECTO,
	ZOOM_MAXIMO,
	ZOOM_MINIMO,
	ZOOM_PASO
} from "./config.js";
import {
	actualizarCategoria,
	actualizarGasto,
	agregarCategoria,
	buscarCategoriaPorId,
	crearCategoriasIniciales,
	eliminarCategoria,
	normalizarCategorias
} from "./categories.js";
import { cargarDatos, guardarDatos, limpiarDatos } from "./storage.js";
import { crearMarcadoHoja, obtenerCantidadFilas } from "./spreadsheet.js";
import { abrirModalCategoria, abrirModalResumen, inicializarModal } from "./modal.js";
import { registrarEventosInterfaz } from "./events.js";

const estado = {
	categorias: [],
	anchosColumnas: {},
	zoom: ZOOM_DEFECTO
};

const elementos = {
	contenedorHoja: null,
	botonResumen: null,
	botonZoomMas: null,
	botonZoomMenos: null,
	indicadorZoom: null,
	capaModal: null
};

function persistirEstado() {
	guardarDatos(estado.categorias, estado.anchosColumnas, estado.zoom);
}

function obtenerEscalaZoom() {
	return estado.zoom / 100;
}

function actualizarIndicadorZoom() {
	if (!elementos.indicadorZoom) {
		return;
	}

	elementos.indicadorZoom.textContent = `${estado.zoom} %`;
}

function aplicarZoomVisual() {
	if (!elementos.contenedorHoja) {
		return;
	}

	const escala = obtenerEscalaZoom();
	elementos.contenedorHoja.style.setProperty("--escala-hoja", String(escala));

	const columnas = elementos.contenedorHoja.querySelectorAll("col[data-ancho-base]");
	for (const columna of columnas) {
		const anchoBase = Number(columna.dataset.anchoBase || 0);
		if (!Number.isFinite(anchoBase)) {
			continue;
		}

		const anchoVisual = Math.round(anchoBase * escala);
		columna.style.width = `${anchoVisual}px`;
	}

	actualizarIndicadorZoom();
}

function definirZoom(nuevoZoom, debePersistir = true) {
	const zoomAjustado = Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, Math.round(nuevoZoom)));
	estado.zoom = zoomAjustado;
	aplicarZoomVisual();

	if (debePersistir) {
		persistirEstado();
	}
}

function enfocarCelda(categoriaId, fila) {
	const selector = `input[data-accion="editar-celda"][data-categoria-id="${categoriaId}"][data-fila="${fila}"]`;

	requestAnimationFrame(() => {
		const campo = elementos.contenedorHoja?.querySelector(selector);
		if (!campo) {
			return;
		}

		campo.focus({ preventScroll: true });
		campo.select();
		campo.scrollIntoView({ block: "nearest", inline: "nearest" });
	});
}

function actualizarCeldaSinRedibujar(idCategoria, fila, numero) {
	actualizarGasto(estado.categorias, idCategoria, fila, numero);
	persistirEstado();
}

function renderizarHoja() {
	if (!elementos.contenedorHoja) {
		return;
	}

	const filas = obtenerCantidadFilas(estado.categorias, FILAS_MINIMAS);
	elementos.contenedorHoja.innerHTML = crearMarcadoHoja(estado.categorias, filas, estado.anchosColumnas);
	aplicarZoomVisual();
}

function aplicarCambio(mutacion) {
	mutacion();
	persistirEstado();
	renderizarHoja();
}

function abrirEdicionCategoria(idCategoria) {
	const categoria = buscarCategoriaPorId(estado.categorias, idCategoria);
	if (!categoria) {
		return;
	}

	abrirModalCategoria({
		categoria,
		onGuardar: ({ nombre, color }) => {
			aplicarCambio(() => {
				actualizarCategoria(estado.categorias, idCategoria, { nombre, color });
			});
		},
		onEliminar: () => {
			aplicarCambio(() => {
				eliminarCategoria(estado.categorias, idCategoria);
				delete estado.anchosColumnas[idCategoria];
			});
		}
	});
}

function reiniciarAplicacion() {
	limpiarDatos();
	estado.categorias = crearCategoriasIniciales();
	estado.anchosColumnas = {};
	estado.zoom = ZOOM_DEFECTO;
	persistirEstado();
	renderizarHoja();
}

function inicializarEstado() {
	const datosGuardados = cargarDatos();

	if (!datosGuardados) {
		estado.categorias = crearCategoriasIniciales();
		persistirEstado();
		return;
	}

	estado.categorias = normalizarCategorias(datosGuardados.categorias);
	estado.anchosColumnas = { ...(datosGuardados.anchosColumnas || {}) };
	estado.zoom = Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, Number(datosGuardados.zoom || ZOOM_DEFECTO)));

	if (estado.categorias.length === 0) {
		estado.categorias = crearCategoriasIniciales();
		persistirEstado();
	}
}

function inicializarElementos() {
	elementos.contenedorHoja = document.querySelector("#contenedor-hoja");
	elementos.botonResumen = document.querySelector("#boton-resumen");
	elementos.botonZoomMas = document.querySelector("#boton-zoom-mas");
	elementos.botonZoomMenos = document.querySelector("#boton-zoom-menos");
	elementos.indicadorZoom = document.querySelector("#indicador-zoom");
	elementos.capaModal = document.querySelector("#capa-modal");
}

function conectarEventos() {
	registrarEventosInterfaz({
		contenedorHoja: elementos.contenedorHoja,
		botonResumen: elementos.botonResumen,
		alAgregarCategoria: () => {
			let nuevaCategoria = null;

			aplicarCambio(() => {
				nuevaCategoria = agregarCategoria(estado.categorias);
			});

			if (nuevaCategoria) {
				abrirEdicionCategoria(nuevaCategoria.id);
			}
		},
		alAbrirCategoria: (idCategoria) => {
			abrirEdicionCategoria(idCategoria);
		},
		alEditarCelda: (idCategoria, fila, numero) => {
			aplicarCambio(() => {
				actualizarGasto(estado.categorias, idCategoria, fila, numero);
			});
		},
		alEditarCeldaEnVivo: (idCategoria, fila, numero) => {
			const filasAntes = obtenerCantidadFilas(estado.categorias, FILAS_MINIMAS);
			actualizarCeldaSinRedibujar(idCategoria, fila, numero);
			const filasDespues = obtenerCantidadFilas(estado.categorias, FILAS_MINIMAS);

			if (filasDespues !== filasAntes) {
				renderizarHoja();
			}
		},
		alCambiarAnchoColumnaEnVivo: (idCategoria, ancho) => {
			estado.anchosColumnas[idCategoria] = ancho;
		},
		alConfirmarAnchoColumna: (idCategoria, ancho) => {
			estado.anchosColumnas[idCategoria] = ancho;
			const columna = elementos.contenedorHoja?.querySelector(`col[data-columna-id="${idCategoria}"]`);
			if (columna) {
				columna.dataset.anchoBase = String(ancho);
			}
			persistirEstado();
		},
		alConfirmarCeldaYAvanzar: (idCategoria, fila, numero) => {
			aplicarCambio(() => {
				actualizarGasto(estado.categorias, idCategoria, fila, numero);
			});
			enfocarCelda(idCategoria, fila + 1);
		},
		alObtenerEscalaZoom: () => {
			return obtenerEscalaZoom();
		},
		alAbrirResumen: () => {
			abrirModalResumen(estado.categorias, () => {
				reiniciarAplicacion();
			});
		}
	});

	elementos.botonZoomMas?.addEventListener("click", () => {
		definirZoom(estado.zoom + ZOOM_PASO);
	});

	elementos.botonZoomMenos?.addEventListener("click", () => {
		definirZoom(estado.zoom - ZOOM_PASO);
	});
}

function iniciarAplicacion() {
	inicializarElementos();
	inicializarModal(elementos.capaModal);
	inicializarEstado();
	conectarEventos();
	renderizarHoja();
}

document.addEventListener("DOMContentLoaded", iniciarAplicacion);
