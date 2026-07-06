import { escaparHtml, formatearValorCelda } from "./utils.js";

function obtenerUltimaFilaUtilizada(categorias) {
	let ultimaFila = -1;

	for (const categoria of categorias) {
		const gastos = Array.isArray(categoria.gastos) ? categoria.gastos : [];
		for (let i = gastos.length - 1; i >= 0; i -= 1) {
			const valor = gastos[i];
			if (valor !== null && valor !== undefined && valor !== "") {
				ultimaFila = Math.max(ultimaFila, i);
				break;
			}
		}
	}

	return ultimaFila;
}

export function obtenerCantidadFilas(categorias, filasMinimas) {
	const ultimaFila = obtenerUltimaFilaUtilizada(categorias);
	const filasNecesarias = ultimaFila + 2;
	return Math.max(filasMinimas, filasNecesarias);
}

function crearEncabezados(categorias) {
	const encabezadosCategorias = categorias
		.map((categoria) => {
			const nombreSeguro = escaparHtml(categoria.nombre);
			const colorSeguro = escaparHtml(categoria.color);

			return `
				<th class="encabezado-categoria" scope="col" style="background:${colorSeguro}">
					<button
						class="boton-encabezado"
						type="button"
						data-accion="abrir-categoria"
						data-categoria-id="${categoria.id}"
						title="Editar categoria"
						aria-label="Editar categoria ${nombreSeguro}"
					>
						<span class="texto-encabezado">${nombreSeguro}</span>
					</button>
				</th>
			`;
		})
		.join("");

	const encabezadoAgregar = `
		<th class="encabezado-agregar" scope="col" aria-label="Agregar categoria" style="background:#dceee2">
			<button
				class="boton-agregar-categoria"
				type="button"
				data-accion="agregar-categoria"
				title="Agregar categoria"
				aria-label="Agregar categoria"
			>+</button>
		</th>
	`;

	return `${encabezadosCategorias}${encabezadoAgregar}`;
}

function crearCeldasFila(categorias, fila) {
	const celdasCategorias = categorias
		.map((categoria) => {
			const valor = formatearValorCelda(categoria.gastos?.[fila]);
			const valorSeguro = escaparHtml(valor);

			return `
				<td>
					<input
						class="celda-valor"
						type="text"
						inputmode="decimal"
						autocomplete="off"
						data-accion="editar-celda"
						data-categoria-id="${categoria.id}"
						data-fila="${fila}"
						value="${valorSeguro}"
						aria-label="Valor fila ${fila + 1} categoria ${escaparHtml(categoria.nombre)}"
					>
				</td>
			`;
		})
		.join("");

	const celdaVaciaFinal = "<td></td>";
	return `${celdasCategorias}${celdaVaciaFinal}`;
}

export function crearMarcadoHoja(categorias, cantidadFilas) {
	const filasMarcado = Array.from({ length: cantidadFilas }, (_, fila) => {
		return `<tr>${crearCeldasFila(categorias, fila)}</tr>`;
	}).join("");

	return `
		<table class="tabla-gastos" aria-label="Tabla de gastos por categoria">
			<thead>
				<tr>
					${crearEncabezados(categorias)}
				</tr>
			</thead>
			<tbody>
				${filasMarcado}
			</tbody>
		</table>
	`;
}
