/*	PScript.js
		A small interpreted language used to manipulate field values.
		(C)2020 Morgan Evans */

class PScriptPart {
	constructor(partString, partType) {
		this.partString = partString;
	}

	static PlainText = 1;
	static ScriptText = 2;
}

class PScriptParser {
	constructor(scriptString) {
		this.scriptString = (scriptString != null && (typeof scriptString === "string" || scriptString instanceof String) &&
			scriptString.length > 0) ? "" + scriptString : null;
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

function GetP2PField(fieldName) {
	var p2pField = null;
	if (fieldName != null &&
		(typeof fieldName === "string" || fieldName instanceof String) &&
		fieldName.length > 0) {
		var fieldElements = document.getElementsByClassName("P2PField");
		if (fieldElements.length > 0) {
			for (const fieldElement of fieldElements) {
				if (fieldElement.hasAttribute("fieldname") &&
					fieldElement.getAttribute("fieldname").toUpperCase() === fieldName.toUpperCase()) {
					p2pField = fieldElement;
					break;
				}
			}
		}
	}
	return p2pField;
}

function GetValueScript(fieldName) {
	var valueScript = null;
	var p2pField = GetP2PField(fieldName);
	if (p2pField != null && p2pField.hasAttribute("valuescript")) {
		valueScript = p2pField.getAttribute("valuescript");
	}
	return valueScript;
}

function GetFieldValue(fieldName) {
	var p2pField = GetP2PField(fieldName);
	var fieldValue = null;
	if (p2pField != null) {
		if (fieldElement.getAttribute("fieldname").toUpperCase() === fieldName.toUpperCase()) {
			if (fieldElement instanceof HTMLDivElement) fieldValue = "" + fieldElement.innerHTML;
			else if (fieldElement instanceof HTMLInputElement) {
				if (fieldElement.type.toUpperCase() === "TEXT") fieldValue = "" + fieldElement.value;
			}
		}
	}
	return fieldValue;
}