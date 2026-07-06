import {
	ANCHO_COLUMNA_AGREGAR,
	ANCHO_COLUMNA_DEFECTO,
	ANCHO_COLUMNA_MINIMO
} from "./config.js";
import { escaparHtml, formatearNumeroEditable, formatearValorCelda } from "./utils.js";

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

function obtenerAnchoColumna(anchosColumnas, idCategoria) {
	const ancho = Number(anchosColumnas?.[idCategoria]);
	if (!Number.isFinite(ancho)) {
		return ANCHO_COLUMNA_DEFECTO;
	}

	return Math.max(ANCHO_COLUMNA_MINIMO, Math.round(ancho));
}

function crearColGroup(categorias, anchosColumnas) {
	const columnasCategorias = categorias
		.map((categoria) => {
			const ancho = obtenerAnchoColumna(anchosColumnas, categoria.id);
			return `<col data-columna-id="${categoria.id}" data-ancho-base="${ancho}" style="width:${ancho}px">`;
		})
		.join("");

	return `
		<colgroup>
			${columnasCategorias}
			<col data-columna-agregar="1" data-ancho-base="${ANCHO_COLUMNA_AGREGAR}" style="width:${ANCHO_COLUMNA_AGREGAR}px">
		</colgroup>
	`;
}

function crearEncabezados(categorias, anchosColumnas) {
	const encabezadosCategorias = categorias
		.map((categoria) => {
			const nombreSeguro = escaparHtml(categoria.nombre);
			const colorSeguro = escaparHtml(categoria.color);
			const ancho = obtenerAnchoColumna(anchosColumnas, categoria.id);

			return `
				<th class="encabezado-categoria" scope="col" style="background:${colorSeguro};width:${ancho}px;min-width:${ANCHO_COLUMNA_MINIMO}px" data-ancho-base="${ancho}">
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
					<div
						class="control-redimension"
						data-accion="iniciar-redimension"
						data-categoria-id="${categoria.id}"
						role="presentation"
					></div>
				</th>
			`;
		})
		.join("");

	const encabezadoAgregar = `
		<th class="encabezado-agregar" scope="col" aria-label="Agregar categoria" style="background:#dceee2;width:${ANCHO_COLUMNA_AGREGAR}px" data-ancho-base="${ANCHO_COLUMNA_AGREGAR}">
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
			const valorReal = categoria.gastos?.[fila];
			const valor = formatearValorCelda(categoria.gastos?.[fila]);
			const valorSeguro = escaparHtml(valor);
			const valorRealEditable = escaparHtml(formatearNumeroEditable(valorReal));

			return `
				<td>
					<input
						class="celda-valor"
						type="text"
						inputmode="decimal"
						enterkeyhint="next"
						autocomplete="off"
						data-accion="editar-celda"
						data-categoria-id="${categoria.id}"
						data-fila="${fila}"
						data-valor-real="${valorRealEditable}"
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

export function crearMarcadoHoja(categorias, cantidadFilas, anchosColumnas) {
	const filasMarcado = Array.from({ length: cantidadFilas }, (_, fila) => {
		return `<tr>${crearCeldasFila(categorias, fila)}</tr>`;
	}).join("");

	return `
		<table class="tabla-gastos" aria-label="Tabla de gastos por categoria">
			${crearColGroup(categorias, anchosColumnas)}
			<thead>
				<tr>
					${crearEncabezados(categorias, anchosColumnas)}
				</tr>
			</thead>
			<tbody>
				${filasMarcado}
			</tbody>
		</table>
	`;
}
