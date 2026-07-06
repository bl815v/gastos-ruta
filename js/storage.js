import { CLAVE_LOCAL_STORAGE, HORAS_VIGENCIA } from "./config.js";

const MILISEGUNDOS_POR_HORA = 60 * 60 * 1000;

function esVigente(ultimaModificacion) {
	const marca = Number(ultimaModificacion);
	if (!Number.isFinite(marca)) {
		return false;
	}

	const diferencia = Date.now() - marca;
	return diferencia <= HORAS_VIGENCIA * MILISEGUNDOS_POR_HORA;
}

export function guardarDatos(categorias, anchosColumnas = {}, zoom = 100) {
	const paquete = {
		categorias,
		anchosColumnas,
		zoom,
		ultimaModificacion: Date.now()
	};

	localStorage.setItem(CLAVE_LOCAL_STORAGE, JSON.stringify(paquete));
}

export function limpiarDatos() {
	localStorage.removeItem(CLAVE_LOCAL_STORAGE);
}

export function cargarDatos() {
	const texto = localStorage.getItem(CLAVE_LOCAL_STORAGE);
	if (!texto) {
		return null;
	}

	try {
		const datos = JSON.parse(texto);
		if (!datos || !Array.isArray(datos.categorias)) {
			limpiarDatos();
			return null;
		}

		if (datos.anchosColumnas && typeof datos.anchosColumnas !== "object") {
			datos.anchosColumnas = {};
		}

		if (!Number.isFinite(Number(datos.zoom))) {
			datos.zoom = 100;
		}

		if (!esVigente(datos.ultimaModificacion)) {
			limpiarDatos();
			return null;
		}

		return datos;
	} catch {
		limpiarDatos();
		return null;
	}
}
