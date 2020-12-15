/*	PScript.js
		Provides inter-component scripting functionality.
		(C)2020 Morgan Evans */
const PFORMS_PSCRIPT = "15122020.1005";

/*	PScript examples:
		{ponumber} returns the value of an element with the id ponumber that can be found in the same container as the dependent element.
		{header.ponumber} returns the value of an element with the id ponumber which is contained in a container with the id header.
		{lineitems[]} returns a two-dimension array of element values contained within the div element with the id lineitems.  The primary 
			index relates to any div elements that are immediate children of the identified element, the secondary index relates each individual
			element within a particular child div.
		{lineitems.poline[]} returns an array of all element values with the id poline contained within the div identified as lineitems. */

function GetElementValue(element) {
	var value = undefined;
	if (element != undefined && element != null && element instanceof HTMLElement) {
		if (element instanceof HTMLInputElement) value = element.value;
		else if (element instanceof HTMLDivElement) {
			if (PFORMS_TYPEAHEAD && element.classList.contains("TypeAheadContainer")) {
				value = element.typeAheadFieldObject.GetValue();
			} else value = element.innerHTML;
		}
	}
	if (value != undefined && 
		(/\s/.test(value) || (element.hasAttribute("fieldtype") && element.getAttribute("fieldtype").toUpperCase() == "STRING"))) {
		value = "'" + value.replace('\'', '\\\'') + "'";
	}
	return value;
}

function GetLowLevelElementValue(element, scriptString) {
	var evaluateThis = "";
	if (element.id != null && element.id.toUpperCase() == scriptString.toUpperCase()) {
		evaluateThis = GetElementValue(element);
	} else if (element instanceof HTMLDivElement && element.classList.contains("PFormField")) {
		const subChildElements = element.childNodes;
		for (var l = 0; l < subChildElements.length; l++) {
			if (subChildElements[l].hasAttribute("fieldname") && subChildElements[l].getAttribute("fieldname").toUpperCase() ==
				scriptString.toUpperCase()) {
					evaluateThis = GetElementValue(subChildElements[l]);
			}
		}
	}
	return evaluateThis;
}

function Interpret(element, pscript) {
	var evaluateThis = "";
	if (pscript != undefined && pscript != null && typeof pscript === 'string' && pscript.length > 0) {
		var i = 0;
		var container = null;
		do {
			i = pscript.indexOf('{', i);
			var j = pscript.indexOf('}', i);
			if (j < i) j = pscript.length;
			var scriptString = pscript.substring(i + 1, j).replace(/\s+/g, '');
			const periodPos = scriptString.indexOf('.');
			if (periodPos > 0) {
				var containerId = scriptString.substring(0, periodPos);
				container = document.getElementById(containerId);
				scriptString = scriptString.substring(periodPos + 1, scriptString.length);
			}
			if (container == null) {
				if (scriptString.endsWith('[]')) {
					scriptString = scriptString.substring(0, scriptString.indexOf('[]'));
					container = document.getElementById(scriptString);
					if (container instanceof HTMLDivElement) {
						const lineItems = container.childNodes;
						var array = '[';
						for (var k = 0; k < lineItems.length; k++) {
							if (lineItems[k] instanceof HTMLDivElement) {
								array += '[';
								const lineItemElements = lineItems[k].childNodes;
								for (var l = 0; l < lineItemElements.length; l++) {
									array += GetElementValue(lineItemElements[l]);
									if (l < lineItemElements - 1) array += ',';
								}
								array += ']';
							}
						}
						array += "]";
					} else evaluateThis += GetElementValue(container);
				} else {
					container = element.parentElement;
					const childElements = container.childNodes;
					for (var k = 0; k < childElements.length; k++) {
						evaluateThis += GetLowLevelElementValue(childElements[k], scriptString);
					}
				}
			} else {
				const childElements = container.childNodes;
				for (var k = 0; k < childElements.length; k++) {
					evaluateThis += GetLowLevelElementValue(childElements[k], scriptString);
				}
			}
			i = j + 1;
		} while (i < pscript.length);
	}
	return evaluateThis;
}