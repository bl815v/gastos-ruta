const REGEX_MONEDA_EDITABLE = /^-?\d*(,\d*)?$/;
const FORMATEADOR_MONEDA = new Intl.NumberFormat("es-CO", {
	minimumFractionDigits: 0,
	maximumFractionDigits: 2
});

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

export function normalizarEntradaMonetaria(textoOriginal) {
	const textoBase = String(textoOriginal ?? "").replace(/\s+/g, "").replace(/\$/g, "");

	let textoFiltrado = "";
	let tieneComa = false;
	let tieneSigno = false;

	for (let indice = 0; indice < textoBase.length; indice += 1) {
		const caracter = textoBase[indice];

		if (caracter >= "0" && caracter <= "9") {
			textoFiltrado += caracter;
			continue;
		}

		if (caracter === "-" && !tieneSigno && textoFiltrado.length === 0) {
			textoFiltrado += "-";
			tieneSigno = true;
			continue;
		}

		if ((caracter === "," || caracter === ".") && !tieneComa) {
			textoFiltrado += ",";
			tieneComa = true;
		}
	}

	if (!REGEX_MONEDA_EDITABLE.test(textoFiltrado)) {
		return {
			texto: "",
			numero: null
		};
	}

	if (textoFiltrado === "" || textoFiltrado === "-" || textoFiltrado === "," || textoFiltrado === "-,") {
		return {
			texto: textoFiltrado,
			numero: null
		};
	}

	const textoParaNumero = textoFiltrado.replace(",", ".");
	const numero = Number(textoParaNumero);

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
	const numero = Number(valor || 0);
	const normalizado = Number.isFinite(numero) ? numero : 0;
	return `$ ${FORMATEADOR_MONEDA.format(normalizado)}`;
}

export function formatearNumeroEditable(valor) {
	if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
		return "";
	}

	const numero = Number(valor);
	if (!Number.isFinite(numero)) {
		return "";
	}

	let texto = String(numero);
	if (texto.includes("e") || texto.includes("E")) {
		texto = numero.toFixed(2);
	}

	if (texto.includes(".")) {
		texto = texto.replace(/0+$/, "").replace(/\.$/, "");
	}

	return texto.replace(".", ",");
}

export function formatearValorCelda(valor) {
	if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
		return "";
	}

	return formatearMoneda(valor);
}
