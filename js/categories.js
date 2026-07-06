import {
	CATEGORIAS_INICIALES,
	COLOR_CATEGORIA_DEFECTO,
	NOMBRE_CATEGORIA_DEFECTO
} from "./config.js";
import { crearIdUnico, limpiarFinalVacio, limpiarNombreCategoria } from "./utils.js";

export function crearCategoria(datos = {}) {
	const nombre = limpiarNombreCategoria(datos.nombre, NOMBRE_CATEGORIA_DEFECTO);
	const color = String(datos.color || COLOR_CATEGORIA_DEFECTO);
	const gastos = Array.isArray(datos.gastos) ? [...datos.gastos] : [];

	return {
		id: datos.id || crearIdUnico("categoria"),
		nombre,
		color,
		gastos
	};
}

export function crearCategoriasIniciales() {
	return CATEGORIAS_INICIALES.map((categoria) => crearCategoria(categoria));
}

export function agregarCategoria(categorias, datos = {}) {
	const categoriaNueva = crearCategoria(datos);
	categorias.push(categoriaNueva);
	return categoriaNueva;
}

export function buscarCategoriaPorId(categorias, idCategoria) {
	return categorias.find((categoria) => categoria.id === idCategoria) || null;
}

export function actualizarCategoria(categorias, idCategoria, cambios = {}) {
	const categoria = buscarCategoriaPorId(categorias, idCategoria);
	if (!categoria) {
		return false;
	}

	if (Object.hasOwn(cambios, "nombre")) {
		categoria.nombre = limpiarNombreCategoria(cambios.nombre, NOMBRE_CATEGORIA_DEFECTO);
	}

	if (Object.hasOwn(cambios, "color")) {
		categoria.color = String(cambios.color || COLOR_CATEGORIA_DEFECTO);
	}

	return true;
}

export function eliminarCategoria(categorias, idCategoria) {
	const indice = categorias.findIndex((categoria) => categoria.id === idCategoria);
	if (indice < 0) {
		return false;
	}

	categorias.splice(indice, 1);
	return true;
}

export function actualizarGasto(categorias, idCategoria, fila, valor) {
	const categoria = buscarCategoriaPorId(categorias, idCategoria);
	if (!categoria) {
		return false;
	}

	const indiceFila = Number(fila);
	if (!Number.isInteger(indiceFila) || indiceFila < 0) {
		return false;
	}

	categoria.gastos[indiceFila] = valor;
	categoria.gastos = limpiarFinalVacio(categoria.gastos);
	return true;
}

export function normalizarCategorias(categorias = []) {
	return categorias
		.filter((categoria) => categoria && typeof categoria === "object")
		.map((categoria) => crearCategoria(categoria));
}
