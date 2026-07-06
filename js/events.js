import { ANCHO_COLUMNA_MINIMO } from "./config.js";
import { formatearNumeroEditable, normalizarEntradaMonetaria } from "./utils.js";

function obtenerPosicionX(evento) {
	if (typeof evento.clientX === "number") {
		return evento.clientX;
	}

	if (evento.touches?.length) {
		return evento.touches[0].clientX;
	}

	if (evento.changedTouches?.length) {
		return evento.changedTouches[0].clientX;
	}

	return 0;
}

function manejarClickEnHoja(evento, acciones) {
	const botonAgregar = evento.target.closest('[data-accion="agregar-categoria"]');
	if (botonAgregar) {
		acciones.alAgregarCategoria();
		return;
	}

	const botonCategoria = evento.target.closest('[data-accion="abrir-categoria"]');
	if (botonCategoria) {
		const idCategoria = botonCategoria.dataset.categoriaId;
		acciones.alAbrirCategoria(idCategoria);
	}
}

function manejarEntradaEnCelda(evento) {
	const campo = evento.target.closest('[data-accion="editar-celda"]');
	if (!campo) {
		return null;
	}

	const { texto, numero } = normalizarEntradaMonetaria(campo.value);
	if (campo.value !== texto) {
		campo.value = texto;
	}
	campo.dataset.valorReal = texto;

	return {
		categoriaId: campo.dataset.categoriaId,
		fila: Number(campo.dataset.fila),
		numero
	};
}

function manejarSalidaDeCelda(evento, acciones) {
	const campo = evento.target.closest('[data-accion="editar-celda"]');
	if (!campo) {
		return;
	}

	if (campo.dataset.omitirBlur === "1") {
		delete campo.dataset.omitirBlur;
		return;
	}

	const { numero } = normalizarEntradaMonetaria(campo.value);
	const categoriaId = campo.dataset.categoriaId;
	const fila = Number(campo.dataset.fila);
	acciones.alEditarCelda(categoriaId, fila, numero);
}

function manejarFocoCelda(evento) {
	const campo = evento.target.closest('[data-accion="editar-celda"]');
	if (!campo) {
		return;
	}

	const valorReal = campo.dataset.valorReal;
	if (!valorReal) {
		campo.value = "";
		return;
	}

	const numero = Number(String(valorReal).replace(",", "."));
	if (Number.isFinite(numero)) {
		campo.value = formatearNumeroEditable(numero);
	}
}

function iniciarRedimension(evento, contenedorHoja, acciones, estadoRedimension) {
	const control = evento.target.closest('[data-accion="iniciar-redimension"]');
	if (!control) {
		return false;
	}

	if (typeof evento.button === "number" && evento.button !== 0) {
		return true;
	}

	evento.preventDefault();
	evento.stopPropagation();

	const idCategoria = control.dataset.categoriaId;
	if (!idCategoria) {
		return true;
	}

	const columna = contenedorHoja.querySelector(`col[data-columna-id="${idCategoria}"]`);
	if (!columna) {
		return true;
	}

	const anchoBase = Number(columna.dataset.anchoBase || 0);
	const anchoInicialBase = Math.max(ANCHO_COLUMNA_MINIMO, Math.round(Number.isFinite(anchoBase) ? anchoBase : columna.getBoundingClientRect().width));
	const posicionInicialX = obtenerPosicionX(evento);
	const escalaActual = acciones.alObtenerEscalaZoom();

	estadoRedimension.activo = true;
	estadoRedimension.idCategoria = idCategoria;
	estadoRedimension.columna = columna;
	estadoRedimension.posicionInicialX = posicionInicialX;
	estadoRedimension.anchoInicialBase = anchoInicialBase;
	estadoRedimension.escala = escalaActual;
	estadoRedimension.pointerId = typeof evento.pointerId === "number" ? evento.pointerId : null;

	if (control.setPointerCapture && typeof evento.pointerId === "number") {
		try {
			control.setPointerCapture(evento.pointerId);
		} catch {
			// Algunos navegadores o simulaciones tactiles no exponen puntero activo capturable.
		}
	}

	document.body.classList.add("redimensionando");
	return true;
}

function moverRedimension(evento, acciones, estadoRedimension) {
	if (!estadoRedimension.activo) {
		return;
	}

	if (
		typeof estadoRedimension.pointerId === "number" &&
		typeof evento.pointerId === "number" &&
		evento.pointerId !== estadoRedimension.pointerId
	) {
		return;
	}

	if (evento.cancelable) {
		evento.preventDefault();
	}

	const delta = obtenerPosicionX(evento) - estadoRedimension.posicionInicialX;
	const nuevoAnchoBase = Math.max(
		ANCHO_COLUMNA_MINIMO,
		Math.round(estadoRedimension.anchoInicialBase + delta / estadoRedimension.escala)
	);
	const nuevoAnchoVisual = Math.round(nuevoAnchoBase * estadoRedimension.escala);

	estadoRedimension.columna.style.width = `${nuevoAnchoVisual}px`;
	estadoRedimension.columna.dataset.anchoBase = String(nuevoAnchoBase);
	acciones.alCambiarAnchoColumnaEnVivo(estadoRedimension.idCategoria, nuevoAnchoBase);
}

function finalizarRedimension(evento, acciones, estadoRedimension) {
	if (!estadoRedimension.activo) {
		return;
	}

	if (
		typeof estadoRedimension.pointerId === "number" &&
		typeof evento.pointerId === "number" &&
		evento.pointerId !== estadoRedimension.pointerId
	) {
		return;
	}

	const delta = obtenerPosicionX(evento) - estadoRedimension.posicionInicialX;
	const nuevoAnchoBase = Math.max(
		ANCHO_COLUMNA_MINIMO,
		Math.round(estadoRedimension.anchoInicialBase + delta / estadoRedimension.escala)
	);
	acciones.alConfirmarAnchoColumna(estadoRedimension.idCategoria, nuevoAnchoBase);

	estadoRedimension.activo = false;
	estadoRedimension.idCategoria = null;
	estadoRedimension.columna = null;
	document.body.classList.remove("redimensionando");
}

function manejarTeclaCelda(evento, acciones) {
	const campo = evento.target.closest('[data-accion="editar-celda"]');
	if (!campo) {
		return;
	}

	if (evento.key === "Enter") {
		evento.preventDefault();
		const { numero } = normalizarEntradaMonetaria(campo.value);
		campo.dataset.omitirBlur = "1";
		acciones.alConfirmarCeldaYAvanzar(
			campo.dataset.categoriaId,
			Number(campo.dataset.fila),
			numero
		);
	}
}

export function registrarEventosInterfaz({
	contenedorHoja,
	botonResumen,
	alAgregarCategoria,
	alAbrirCategoria,
	alEditarCelda,
	alEditarCeldaEnVivo,
	alCambiarAnchoColumnaEnVivo,
	alConfirmarAnchoColumna,
	alConfirmarCeldaYAvanzar,
	alObtenerEscalaZoom,
	alAbrirResumen
}) {
	const estadoRedimension = {
		activo: false,
		idCategoria: null,
		columna: null,
		posicionInicialX: 0,
		anchoInicialBase: 0,
		escala: 1,
		pointerId: null
	};

	const acciones = {
		alAgregarCategoria,
		alAbrirCategoria,
		alEditarCelda,
		alCambiarAnchoColumnaEnVivo,
		alConfirmarAnchoColumna,
		alConfirmarCeldaYAvanzar,
		alObtenerEscalaZoom
	};

	contenedorHoja.addEventListener("pointerdown", (evento) => {
		iniciarRedimension(evento, contenedorHoja, acciones, estadoRedimension);
	});

	window.addEventListener(
		"pointermove",
		(evento) => {
			moverRedimension(evento, acciones, estadoRedimension);
		},
		{ passive: false }
	);

	window.addEventListener("pointerup", (evento) => {
		finalizarRedimension(evento, acciones, estadoRedimension);
	});

	window.addEventListener("pointercancel", (evento) => {
		finalizarRedimension(evento, acciones, estadoRedimension);
	});

	contenedorHoja.addEventListener("click", (evento) => {
		manejarClickEnHoja(evento, acciones);
	});

	contenedorHoja.addEventListener("focusin", manejarFocoCelda);

	contenedorHoja.addEventListener("input", (evento) => {
		const datos = manejarEntradaEnCelda(evento);
		if (!datos) {
			return;
		}

		alEditarCeldaEnVivo(datos.categoriaId, datos.fila, datos.numero);
	});

	contenedorHoja.addEventListener(
		"blur",
		(evento) => {
			manejarSalidaDeCelda(evento, acciones);
		},
		true
	);

	contenedorHoja.addEventListener("keydown", (evento) => {
		manejarTeclaCelda(evento, acciones);
	});

	botonResumen.addEventListener("click", () => {
		alAbrirResumen();
	});
}
