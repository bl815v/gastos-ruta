const REGEX_SOLO_NUMEROS = /^\d*(\.\d*)?$/;

export function crearIdUnico(prefijo = "id") {
	const aleatorio = Math.random().toString(36).slice(2, 9);
	return `${prefijo}_${Date.now()}_${aleatorio}`;
}

export function escaparHtml(texto) {
	return String(texto)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export function limpiarNombreCategoria(nombre, valorDefecto = "Categoria") {
	const limpio = String(nombre ?? "").trim();
	return limpio || valorDefecto;
}

export function normalizarEntradaNumerica(textoOriginal) {
	const textoBase = String(textoOriginal ?? "").replace(/,/g, ".");

	let textoFiltrado = "";
	let yaTienePunto = false;

	for (const caracter of textoBase) {
		if (caracter >= "0" && caracter <= "9") {
			textoFiltrado += caracter;
			continue;
		}

		if (caracter === "." && !yaTienePunto) {
			textoFiltrado += caracter;
			yaTienePunto = true;
		}
	}

	const esValido = REGEX_SOLO_NUMEROS.test(textoFiltrado);

	if (!esValido || textoFiltrado === "" || textoFiltrado === ".") {
		return {
			texto: textoFiltrado,
			numero: null
		};
	}

	const numero = Number(textoFiltrado);
	return {
		texto: textoFiltrado,
		numero: Number.isFinite(numero) ? numero : null
	};
}

export function limpiarFinalVacio(arreglo) {
	const copia = [...arreglo];

	while (copia.length > 0) {
		const ultimo = copia[copia.length - 1];
		if (ultimo === null || ultimo === undefined || ultimo === "") {
			copia.pop();
			continue;
		}
		break;
	}

	return copia;
}

export function formatearMoneda(valor) {
	return Number(valor || 0).toLocaleString("es-CO", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}

export function formatearValorCelda(valor) {
	if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
		return "";
	}

	const numero = Number(valor);
	if (Number.isInteger(numero)) {
		return String(numero);
	}

	return String(numero);
}
