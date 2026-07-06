import { calcularResumenCategorias, calcularTotalGeneral } from "./calculations.js";
import { escaparHtml, formatearMoneda } from "./utils.js";

export function crearMarcadoResumen(categorias) {
	const resumen = calcularResumenCategorias(categorias);
	const totalGeneral = calcularTotalGeneral(categorias);

	if (resumen.length === 0) {
		return `
			<p>No hay categorias registradas.</p>
			<div class="fila-resumen total-general">
				<span class="etiqueta-total">Total general</span>
				<strong class="valor-total">${formatearMoneda(0)}</strong>
			</div>
		`;
	}

	const filas = resumen
		.map((item) => {
			return `
				<div class="fila-resumen">
					<span class="etiqueta-total">Total ${escaparHtml(item.nombre)}</span>
					<strong class="valor-total">${formatearMoneda(item.total)}</strong>
				</div>
			`;
		})
		.join("");

	return `
		${filas}
		<div class="fila-resumen total-general">
			<span class="etiqueta-total">Total</span>
			<strong class="valor-total">${formatearMoneda(totalGeneral)}</strong>
		</div>
	`;
}
