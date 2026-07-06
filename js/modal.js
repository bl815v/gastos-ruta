import { crearMarcadoResumen } from "./summary.js";
import { escaparHtml, limpiarNombreCategoria } from "./utils.js";

let capaModal = null;
let controladorTecladoRegistrado = false;

function cerrarSiEsc(evento) {
	if (evento.key === "Escape") {
		cerrarModal();
	}
}

function crearEstructuraPanel(titulo, cuerpoHtml) {
	const panel = document.createElement("section");
	panel.className = "panel-modal";
	panel.setAttribute("role", "dialog");
	panel.setAttribute("aria-modal", "true");
	panel.innerHTML = `
		<header class="encabezado-modal">
			<h2>${titulo}</h2>
		</header>
		<div class="cuerpo-modal">${cuerpoHtml}</div>
		<div class="acciones-modal"></div>
	`;
	return panel;
}

function agregarBoton(acciones, clase, texto, onClick) {
	const boton = document.createElement("button");
	boton.type = "button";
	boton.className = clase;
	boton.textContent = texto;
	boton.addEventListener("click", onClick);
	acciones.appendChild(boton);
}

export function inicializarModal(elementoCapaModal) {
	capaModal = elementoCapaModal;

	capaModal.addEventListener("click", (evento) => {
		if (evento.target === capaModal) {
			cerrarModal();
		}
	});

	if (!controladorTecladoRegistrado) {
		document.addEventListener("keydown", cerrarSiEsc);
		controladorTecladoRegistrado = true;
	}
}

export function cerrarModal() {
	if (!capaModal) {
		return;
	}

	capaModal.classList.add("oculta");
	capaModal.setAttribute("aria-hidden", "true");
	capaModal.innerHTML = "";
}

export function abrirModalCategoria({ categoria, onGuardar, onEliminar }) {
	if (!capaModal || !categoria) {
		return;
	}

	const panel = crearEstructuraPanel(
		"Categoria",
		`
			<div class="grupo-campo">
				<label for="campo-nombre-categoria">Nombre</label>
				<input id="campo-nombre-categoria" type="text" maxlength="40" value="${escaparHtml(categoria.nombre)}">
			</div>
			<div class="grupo-campo">
				<label for="campo-color-categoria">Color</label>
				<input id="campo-color-categoria" type="color" value="${escaparHtml(categoria.color)}">
			</div>
		`
	);

	const acciones = panel.querySelector(".acciones-modal");
	const campoNombre = panel.querySelector("#campo-nombre-categoria");
	const campoColor = panel.querySelector("#campo-color-categoria");

	agregarBoton(acciones, "boton-primario", "Guardar", () => {
		const nombre = limpiarNombreCategoria(campoNombre.value, "Nueva categoria");
		const color = String(campoColor.value || "#3f7458");
		onGuardar?.({ nombre, color });
		cerrarModal();
	});

	agregarBoton(acciones, "boton-secundario", "Cerrar", () => {
		cerrarModal();
	});

	agregarBoton(acciones, "boton-peligro", "Eliminar categoria", () => {
		const confirmar = window.confirm("Esta accion eliminara la categoria. Deseas continuar?");
		if (!confirmar) {
			return;
		}

		onEliminar?.();
		cerrarModal();
	});

	capaModal.innerHTML = "";
	capaModal.appendChild(panel);
	capaModal.classList.remove("oculta");
	capaModal.setAttribute("aria-hidden", "false");
	campoNombre.focus();
}

export function abrirModalResumen(categorias) {
	if (!capaModal) {
		return;
	}

	const panel = crearEstructuraPanel("Resumen", crearMarcadoResumen(categorias));
	const acciones = panel.querySelector(".acciones-modal");
	agregarBoton(acciones, "boton-primario", "Cerrar", () => {
		cerrarModal();
	});

	capaModal.innerHTML = "";
	capaModal.appendChild(panel);
	capaModal.classList.remove("oculta");
	capaModal.setAttribute("aria-hidden", "false");
}
