import { FILAS_MINIMAS } from "./config.js";
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
	anchosColumnas: {}
};

const elementos = {
	contenedorHoja: null,
	botonResumen: null,
	capaModal: null
};

function persistirEstado() {
	guardarDatos(estado.categorias, estado.anchosColumnas);
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

	if (estado.categorias.length === 0) {
		estado.categorias = crearCategoriasIniciales();
		persistirEstado();
	}
}

function inicializarElementos() {
	elementos.contenedorHoja = document.querySelector("#contenedor-hoja");
	elementos.botonResumen = document.querySelector("#boton-resumen");
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
			persistirEstado();
		},
		alAbrirResumen: () => {
			abrirModalResumen(estado.categorias, () => {
				reiniciarAplicacion();
			});
		}
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
