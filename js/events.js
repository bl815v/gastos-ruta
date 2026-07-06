import { normalizarEntradaNumerica } from "./utils.js";

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

	const { texto, numero } = normalizarEntradaNumerica(campo.value);
	if (campo.value !== texto) {
		campo.value = texto;
	}

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

	const { numero } = normalizarEntradaNumerica(campo.value);
	const categoriaId = campo.dataset.categoriaId;
	const fila = Number(campo.dataset.fila);
	acciones.alEditarCelda(categoriaId, fila, numero);
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
	alAbrirResumen
}) {
	const acciones = {
		alAgregarCategoria,
		alAbrirCategoria,
		alEditarCelda
	};

	contenedorHoja.addEventListener("click", (evento) => {
		manejarClickEnHoja(evento, acciones);
	});

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
