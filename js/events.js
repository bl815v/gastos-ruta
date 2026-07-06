import { ANCHO_COLUMNA_MINIMO } from "./config.js";
import { formatearNumeroEditable, normalizarEntradaMonetaria } from "./utils.js";

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

function iniciarRedimension(evento, contenedorHoja, acciones) {
	const control = evento.target.closest('[data-accion="iniciar-redimension"]');
	if (!control) {
		return false;
	}

	if (evento.button !== 0) {
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

	const anchoInicial = Math.max(ANCHO_COLUMNA_MINIMO, Math.round(columna.getBoundingClientRect().width));
	const posicionInicialX = evento.clientX;

	const alMover = (eventoMover) => {
		const delta = eventoMover.clientX - posicionInicialX;
		const nuevoAncho = Math.max(ANCHO_COLUMNA_MINIMO, Math.round(anchoInicial + delta));
		columna.style.width = `${nuevoAncho}px`;
		acciones.alCambiarAnchoColumnaEnVivo(idCategoria, nuevoAncho);
	};

	const alSoltar = (eventoSoltar) => {
		const delta = eventoSoltar.clientX - posicionInicialX;
		const nuevoAncho = Math.max(ANCHO_COLUMNA_MINIMO, Math.round(anchoInicial + delta));
		acciones.alConfirmarAnchoColumna(idCategoria, nuevoAncho);
		document.removeEventListener("mousemove", alMover);
		document.removeEventListener("mouseup", alSoltar);
		document.body.classList.remove("redimensionando");
	};

	document.addEventListener("mousemove", alMover);
	document.addEventListener("mouseup", alSoltar);
	document.body.classList.add("redimensionando");
	return true;
}

function manejarTeclaCelda(evento) {
	const campo = evento.target.closest('[data-accion="editar-celda"]');
	if (!campo) {
		return;
	}

	if (evento.key === "Enter") {
		evento.preventDefault();
		campo.blur();
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
	alAbrirResumen
}) {
	const acciones = {
		alAgregarCategoria,
		alAbrirCategoria,
		alEditarCelda,
		alCambiarAnchoColumnaEnVivo,
		alConfirmarAnchoColumna
	};

	contenedorHoja.addEventListener("mousedown", (evento) => {
		iniciarRedimension(evento, contenedorHoja, acciones);
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

	contenedorHoja.addEventListener("keydown", manejarTeclaCelda);

	botonResumen.addEventListener("click", () => {
		alAbrirResumen();
	});
}
