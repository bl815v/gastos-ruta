function aNumeroSeguro(valor) {
	const numero = Number(valor);
	return Number.isFinite(numero) ? numero : 0;
}

export function calcularTotalCategoria(categoria) {
	const gastos = Array.isArray(categoria?.gastos) ? categoria.gastos : [];
	return gastos.reduce((acumulado, valor) => acumulado + aNumeroSeguro(valor), 0);
}

export function calcularResumenCategorias(categorias) {
	return categorias.map((categoria) => ({
		id: categoria.id,
		nombre: categoria.nombre,
		color: categoria.color,
		total: calcularTotalCategoria(categoria)
	}));
}

export function calcularTotalGeneral(categorias) {
	return categorias.reduce((acumulado, categoria) => acumulado + calcularTotalCategoria(categoria), 0);
}
