/*	PScript.js
		A small interpreted language used to manipulate field values.
		(C)2020 Morgan Evans */

class PScriptPart {
	constructor(partString, partType) {
		this.partString = partString;
		this.partType = partType;
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

class PScriptField {
	constructor(fieldPath = null) {
		this.elements = null;
		if (fieldPath != null && (fieldPath instanceof String || typeof fieldPath === "string") && fieldPath.trim().length > 0) {
			fieldPath = fieldPath.trim().replace('$','');
			if (fieldPath.indexOf('[') > 0) fieldPath = fieldPath.substring(0, fieldPath.indexOf('['));
			// Break the field path string down into parts, where each part is delimeted using a period (.)
			const fieldPathParts = fieldPath.split('.');
			const requiredFieldName = fieldPathParts[fieldPathParts.length - 1].toUpperCase();
			if (fieldPathParts.length > 1) {
				var parentContainer = document.getElementById(fieldPathParts[fieldPathParts.length - 2]);
				if (parentContainer != null && parentContainer instanceof HTMLDivElement && parentContainer.classList.contains("PFormContainer")) {
					if (!parentContainer.classList.contains("PFormLineItemsContainer")) GetNonLineElements(parentContainer);
					else this.GetLineItemElements(parentContainer);
				}
			}
		}
	}

	GetNonLineElements(parentContainer) {
		const childNodes = parentContainer.childNodes;
		for (var i = 0; i < childNodes.length; i++) {
			if (childNodes[i].nodeType == 1) {
				const fieldElements = childNodes[i].getElementsByClassName("PFormField");
				if (fieldElements[0].hasAttribute("fieldname") && fieldElements[0].getAttribute("fieldname").toUpperCase() === requiredFieldName) {
					this.elements = [ fieldElements[0] ];
					break;
				}
			}
		}
	}

	GetLineItemElements(parentContainer) {
		this.elements = [];
		const lineItemContainers = parentContainer.getElementsByClassName("PFormLineItemsContainerElement");
		for (var i = 0; i < lineItemContainers.length; i++) {
			const lineItems = lineItemContainers[i].getElementsByClassName("PFormLineItem");
			for (var j = 0; j < lineItems.length; j++) {
				const lineItemFields = lineItems[j].getElementsByClassName("PFormField");
				for (var k = 0; k < lineItemFields.length; k++) {
					if (lineItemFields[k].hasAttribute("fieldname") && lineItemFields[k].getAttribute("fieldname").toUpperCase() === requiredFieldName) {
						this.elements.push(lineItemsFields[k]);
					}
				}
			}
		}
	}

	GetValueScript() {
		var valueScript = null;
		if (this.elements.length > 0) {
		for (var i = 0; valueScript == null && i < this.elements.length; i++) {
			if (this.elements[i].hasAttribute("valuescript")) valueScript = this.elements[i].getAttribute("valuescript");
		}
		return valueScript;
	}

	UpdateValues() {
		
	}
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