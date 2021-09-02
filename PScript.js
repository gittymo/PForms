/*	PScript.js
		A small interpreted language used to manipulate field values.
		(C)2020 Morgan Evans */

class PScriptPartData {
	constructor(element) {

	}
}

class PScriptPart {
	constructor(partString, partType) {
		this.partString = partString;
		this.partType = partType;
	}

	GetElements() {
		var elements = [];
		if (this.partType == PScriptPart.ScriptText) {
			var nextElementIndex = indexOf('$');
			while (nextElementIndex >= 0) {
				
			}
		}
	}

	static PlainText = 1;
	static ScriptText = 2;
}

class PScriptParser {
	constructor(scriptString) {
		this.scriptString = (scriptString != null && (typeof scriptString === "string" || scriptString instanceof String) &&
			scriptString.trim().length > 0) ? "" + scriptString.trim() : null;
		this.offset = 0;
	}

	GetPart() {
		var part = null;
		if (this.offset >= 0 && this.offset < this.scriptString.length) {
			if (this.scriptString.charAt(this.offset) == '{') {
				var openBrackets = 0;
				var i = this.offset;
				do {
					if (this.scriptString.charAt(i) == '{') openBrackets++;
					else if (this.scriptString.charAt(i) == '}') openBrackets--;
					i++;
				} while (i < this.scriptString.length && openBrackets > 0);
				part = new PScriptPart(this.scriptString.substring(this.offset + 1, i - 1), PScriptPart.ScriptText);
				this.offset = i;
			} else {
				var partEnd = this.scriptString.indexOf('{', this.offset);
				if (partEnd == -1) partEnd = this.scriptString.length;
				part = new PScriptPart(this.scriptString.substring(this.offset, partEnd), PScriptPart.PlainText);
				this.offset = partEnd;
			}
		}
		return part;
	}

	HasPart() {
		return (this.offset < this.scriptString.length);
	}
}

class PScriptField {
	constructor(element) {
		if (element != undefined && element != null && element instanceof HTMLElement && element.classList.contains("PFormField")) {
			this.element = element;
			this.buildDependencies();
		}
	}

	BuildDependencies() {
		if (this.element.hasAttribute("valuescript")) {
			const valueScript = this.element.getAttribute("valuescript");
			const valueScriptParser = new PScriptParser(valueScript);

		}
	}
}