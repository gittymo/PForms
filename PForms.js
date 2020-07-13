/*	PForms.js
		Funky HTML forms library.
		(C)2020 Morgan Evans */

class FontDimensions {
	constructor(element) {
		this.width = this.height = -1;
		if (element instanceof HTMLElement) {
			var computedStyle = window.getComputedStyle(element);
			var measureBox = document.createElement("div");
			document.body.appendChild(measureBox);
			measureBox.style.padding = "0px";
			measureBox.style.border = "0px";
			measureBox.style.display = "inline-block";
			measureBox.style.fontFamily = computedStyle.fontFamily;
			measureBox.style.fontSize = computedStyle.fontSize;
			measureBox.style.fontWeight = computedStyle.fontWeight;
			measureBox.innerHTML = "MMMMM";
			this.width = measureBox.clientWidth / measureBox.innerHTML.length;
			this.height = measureBox.clientHeight;
			document.body.removeChild(measureBox);
		}
	}
}

class PFormContainer {
	constructor(element) {
		this.element = element;
		if (element != undefined && element != null && element instanceof HTMLDivElement && 
			!this.HasAttribute("initialised")) {
			this.fieldDefinitions = [];
			this.element.formsController = this;
			this.maxColumns = this.GetAttributeAsInt("columns") > 0 ? this.GetAttributeAsInt("columns") : 1;
			this.element.classList.add("ContainerBorder");
			if (this.HasAttribute("type", "lineitems")) this.InitialiseAsLineItemsContainer();
			this.InitialiseFields();
			this.Refresh();
			this.SetAttribute("initialised", "true");
		}
	}

	HasAttribute(attributeName, value = null) {
		const attributeValue = this.GetAttribute(attributeName);
		return (value == null) ? (attributeValue != null) : (attributeValue != null && 
			attributeValue.toUpperCase() == value.toUpperCase());
	}

	GetAttribute(attributeName) {
		return this.element.hasAttribute(attributeName) ? this.element.getAttribute(attributeName) : null;
	}

	GetAttributeAsInt(attributeName) {
		const attributeValue = this.GetAttribute(attributeName);
		return (attributeValue != null && !isNaN(attributeValue)) ? parseInt(attributeValue) : 0;
	}

	GetAttributeAsFloat(attributeName) {
		const attributeValue = this.GetAttribute(attributeName);
		return (attributeValue != null && !isNaN(attributeValue)) ? parseFloat(attributeValue) : 0.0;
	}

	SetAttribute(attributeName, value) {
		this.element.setAttribute(attributeName, value);
	}

	InitialiseAsLineItemsContainer() {
		// Set up properties so that we can handle line creation according to form configuration.
		this.minLines = Math.max(1, this.GetAttributeAsInt("minlines"));
		this.maxLines = Math.min(25, this.GetAttributeAsInt("maxlines"));
		if (this.maxLines < 0) this.maxLines = 25;
		this.lines = 0;

		// Add the PFormLineItemsContainer class to the element's stylesheet.
		this.element.classList.add("PFormLineItemsContainer");

		/* Set up the container header, which consists of master checkbox (allows users to (de)select all line items 
			 and an area to hold the headings for each field within the container. */
		var containerHeader = document.createElement("div");
		containerHeader.classList.add("PFormLineItemsContainerElement", "ContainedBorder");
		this.masterCheckBox = this.CreateCheckBox();
		containerHeader.appendChild(this.masterCheckBox);
		this.headingsContainer = document.createElement("div");
		this.headingsContainer.classList.add("PFormLineItem");
		containerHeader.appendChild(this.headingsContainer);
		this.element.appendChild(containerHeader);

		/* The line items section is a special area which allows for a scrollable list of line items, whilst 
				keeping the header and footer sections visible. */
		this.lineItemsContainer = document.createElement("div");
		this.lineItemsContainer.classList.add("PFormLineItemsContainerElement", "NoBorder"),
			this.element.appendChild(this.lineItemsContainer);

		/*	Finally the footer section provides a single row area which offers various line-level fucntionality, 
				such as adding new lines and removing selected lines. */
		var containerFooter = document.createElement("div");
		containerFooter.classList.add("PFormLineItemsContainerElement", "NoBorder");
		var deleteButton = this.CreateButton("Delete");
		deleteButton.onclick = function (event) {
			var checks = event.target.formsController.masterCheckBox;
			if (checks.listeners != null) event.target.formsController.DeleteLineItems();
		}
		containerFooter.appendChild(deleteButton);
		var addButton = this.CreateButton("Add");
		addButton.onclick = function (event) {
			if (event.target.formsController.lines < event.target.formsController.maxLines) {
				event.target.formsController.CreateLineItem();
				event.target.formsController.lines++;
				event.target.formsController.Refresh();
			}
		}
		containerFooter.appendChild(addButton);
		this.element.appendChild(containerFooter);
		this.islineItemsContainer = true;
	}

	InitialiseFields() {
		var childElements = [];
		for (var i = 0; i < this.element.childNodes.length; i++) {
			if (this.element.childNodes[i].nodeType == 1) childElements.push(this.element.childNodes[i]);
		}
		if (childElements.length > 0) {
			for (var i = 0; i < childElements.length; i++) {
				if (!childElements[i].hasAttribute("initialised")) {
					if (childElements[i] instanceof HTMLDivElement && childElements[i].classList.contains("PFormContainer")) {
						new PFormContainer(childElements[i]);
					} else {
						if (childElements[i].classList.contains("PFormField")) {
							// Register the element as a field.
							this.fieldDefinitions.push(childElements[i]);
							// Record the minimum width of the field
							const fieldFontWidth = new FontDimensions(childElements[i]).width;
							if (childElements[i].hasAttribute("minwidth") && !isNaN(childElements[i].getAttribute("minwidth")))
								childElements[i].minimumWidth = parseInt(childElements[i].getAttribute("minwidth")) * fieldFontWidth;
							else if (childElements[i].hasAttribute("width") && !isNaN(childElements[i].getAttribute("width")))
								childElements[i].minimumWidth = parseInt(childElements[i].getAttribute("width")) * fieldFontWidth;
							else if (this.islineItemsContainer) {
								if (childElements[i].hasAttribute("fieldlabel") && 
									childElements[i].getAttribute("fieldlabel").trim().length > 0) {
									childElements[i].minimumWidth = 
										Math.floor(childElements[i].getAttribute("fieldlabel").length * fieldFontWidth * 0.75);
								}
							}
							else childElements[i].minimumWidth = 0;

							if (this.islineItemsContainer) {
								// If this is is a line items container, we can create and add the heading elements.
								var heading = document.createElement("div");
								heading.classList.add("heading");
								if (childElements[i].hasAttribute("fieldlabel"))
									heading.innerHTML = childElements[i].getAttribute("fieldlabel");
								this.headingsContainer.appendChild(heading);
								this.element.removeChild(childElements[i]);
							} else {
								// Otherwise, treat it like a regular, non line-item, form field (this one has a nice box and label).
								var pformField = document.createElement("div");
								pformField.classList.add("PFormField", "ContainedBorder");
								if (childElements[i].hasAttribute("fieldlabel")) {
									var pformFieldLabel = document.createElement("label");
									pformFieldLabel.innerHTML = childElements[i].getAttribute("fieldlabel");
									pformField.appendChild(pformFieldLabel);
								}
								pformField.appendChild(childElements[i]);
								pformField.setAttribute("initialised", "true");
								// Associate a PFormField object with the element.
								childElements[i].fieldController = new PFormField(childElements[i]);
								childElements[i].formsController = this;
								this.element.appendChild(pformField);
							}
						}
					}
				}
			}
		}
	}

	Refresh() {
		// Make sure line item containers have the minimum amount of lines.
		if (this.islineItemsContainer && this.lines < this.minLines) {
			for (var i = this.lines; i < this.minLines; i++) {
				this.CreateLineItem();
				this.lines++;
			}
		}

		/*	We need to make the fields distribute across the display in a sensible manner.  This is done by determining how 
				many columns at minimum width can be fit into the container's available space.  We then determine how each 
				column should scale into that space. */
		// First, determine the scale for field items (both normal and line items)
		var clientWidth = this.element.parentNode.clientWidth;
		clientWidth = clientWidth - (8 * (this.fieldDefinitions.length + 1)); // Available container space.
		var usedWidth = 0, columns = 0;
		for (var i = 0; columns < this.maxColumns && i < this.fieldDefinitions.length; i++) {
			if (usedWidth + this.fieldDefinitions[i].minimumWidth > clientWidth - 192) break;
			usedWidth += this.fieldDefinitions[i].minimumWidth;
			columns++;
		}
		const scale = clientWidth / usedWidth;
		// Determine the grid template columns configuration for the field items.
		var gridTemplateColumns = "";
		for (var i = 0; i < columns && i < this.fieldDefinitions.length; i++) {
			const fieldWidth = this.fieldDefinitions[i].minimumWidth;
			if (fieldWidth > 0) {
				const minFieldWidth = fieldWidth;
				const scaledFieldWidth = Math.max(fieldWidth, Math.floor(fieldWidth * scale));
				gridTemplateColumns += 
					(i < columns - 1) ? "minmax(" + minFieldWidth + "px," + scaledFieldWidth + "px) " : "auto ";
			} else gridTemplateColumns += this.islineItemsContainer ? "auto " : "1fr ";
		}

		// Make the line items container fit it's container.
		if (this.islineItemsContainer) 
			this.headingsContainer.parentElement.style.gridTemplateColumns = "48px minmax(" + usedWidth + ", auto)";

		// Set the grid template configuration for the field/line items.
		if (this.islineItemsContainer) {
			const lineItems = this.lineItemsContainer.getElementsByClassName("PFormLineItem");
			for (var i = 0; i < lineItems.length; i++) {
				if (lineItems[i].parentNode == this.lineItemsContainer)
					lineItems[i].style.gridTemplateColumns = gridTemplateColumns;
			}
		} else this.element.style.gridTemplateColumns = gridTemplateColumns;

		/* Finally, in the case of line item containers we need to configure the header columns so that they exactly match 
			the line item columns. */
		if (this.islineItemsContainer) {
			const lineItems = this.lineItemsContainer.getElementsByClassName("PFormLineItem");
			var headingsGridTemplateColumns = "";
			for (var i = 0; i < columns && i < this.fieldDefinitions.length; i++) {
				headingsGridTemplateColumns += "minmax(64px, " + (lineItems[0].childNodes[i].clientWidth) + "px) ";
			}
			this.headingsContainer.style.gridTemplateColumns = headingsGridTemplateColumns; //gridTemplateColumns;
		}

		// Make sure any sub containers are also refreshed.
		const subFormContainers = this.element.getElementsByClassName("PFormContainer");
		for (var i = 0; i < subFormContainers.length; i++) {
			if (subFormContainers[i].parentNode == this.element) subFormContainers[i].formsController.Refresh();
		}
	}

	CreateLineItem() {
		if (this.islineItemsContainer && this.lines < this.maxLines) {
			// Create a holder the individual field components of the line.
			var lineItemContainer = document.createElement("div");
			lineItemContainer.classList.add("PFormLineItem");
			for (var i = 0; i < this.fieldDefinitions.length; i++) {
				var nodeClone = this.fieldDefinitions[i].cloneNode();
				nodeClone.fieldController = new PFormField(nodeClone);
				nodeClone.formsController = this;
				nodeClone.lineItemContainer = lineItemContainer;
				nodeClone.classList.add("ContainedBorder");
				lineItemContainer.appendChild(nodeClone);
			}

			// Create a selection checkbox for the line item.
			var checkBox = this.CreateCheckBox(lineItemContainer, this.masterCheckBox);

			// Add the checkbox and fields holder to the line item.
			this.lineItemsContainer.appendChild(checkBox);
			this.lineItemsContainer.appendChild(lineItemContainer);
		}
	}

	DeleteLineItems() {
		if (this.masterCheckBox != null) {
			var selectedLineItems = this.masterCheckBox.GetCheckedLines();
			if (selectedLineItems.length > 0) {
				this.masterCheckBox.RemoveChecked();
				for (var i = 0; i < selectedLineItems.length; i++) {
					this.lineItemsContainer.removeChild(selectedLineItems[i].lineItem);
					this.lines--;
				}
				this.Refresh();
			}
		}
	}

	CreateButton(buttonText) {
		var button = document.createElement("button");
		button.textContent = buttonText;
		button.formsController = this;
		return button;
	}

	CreateCheckBox(lineItem = null, masterCheckBox = null, checked = false) {
		var checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.listeners = [];
		checkbox.masterCheckBox = masterCheckBox;
		checkbox.lineItem = (lineItem != null && lineItem.classList.contains("PFormLineItem")) ? lineItem : null;
		if (masterCheckBox != null) {
			masterCheckBox.AddChangeListener(checkbox);
			this.checked = checked;
			masterCheckBox.UpdateStatus();
		}

		checkbox.onchange = function (event) {
			if (this.masterCheckBox == null) {
				for (var i = 0; i < event.target.listeners.length; i++) {
					if (event.target.listeners[i] != null) event.target.listeners[i].checked = event.target.checked;
				}
			} else this.masterCheckBox.UpdateStatus();
		}

		checkbox.UpdateStatus = function () {
			if (this.listeners.length > 0) {
				this.checked = this.listeners[0].checked;
				for (var i = 1; i < this.listeners.length; i++)
					if (this.listeners[i] != null) this.checked = this.checked & this.listeners[i].checked;
			}
		}

		checkbox.AddChangeListener = function (element) {
			if (checkbox.listeners.indexOf(element) < 0) checkbox.listeners.push(element);
		}

		checkbox.RemoveChangeListener = function (element) {
			if (checkbox.listeners.indexOf(element) >= 0) checkbox.listeners.splice(checkbox.listeners.indexOf(element));
		}

		checkbox.GetCheckedLines = function () {
			var checkedLines = [];
			if (this.masterCheckBox == null) {
				for (var i = 0; i < this.listeners.length; i++) {
					if (this.listeners[i].checked) checkedLines.push(this.listeners[i]);
				}
			} else checkedLines.push(this.parentNode);
			return checkedLines;
		}

		checkbox.RemoveChecked = function () {
			if (this.masterCheckBox == null) {
				var newListeners = [];
				for (var i = 0; i < this.listeners.length; i++) {
					if (!this.listeners[i].checked) newListeners.push(this.listeners[i]);
					else this.listeners[i].parentNode.removeChild(this.listeners[i]);
				}
				this.listeners = newListeners;
			}
		}
		return checkbox;
	}
}

// PFormField class definition
class PFormField {
	constructor(element) {
		if (element != undefined && element != null && element instanceof HTMLElement && element.classList.contains("PFormField")) {
			this.element = element;
		}
	}

	GetValue() {
		if (this.element instanceof HTMLDivElement) return this.element.innerHTML;
		else if (this.element instanceof HTMLInputElement) return this.element.value;
		else return null;
	}

	SetValue(value) {
		if (!this.HasValueScript()) {
			if (this.element instanceof HTMLDivElement) this.element.innerHTML = value;
			else if (this.element instanceof HTMLInputElement) this.element.value = value;
		}
	}

	HasValueScript() {
		return this.element.hasAttribute("valuescript");
	}

	GetValueScript() {
		return this.HasValueScript() ? this.GetValueScript() : null;
	}

	UpdateValue() {
		if (this.HasValueScript()) {

		}
	}

	static GetTargetField(element, fieldPath = null) {
		var targetField = null;
		if (fieldPath != null && (typeof fieldPath === "string" || fieldPath instanceof String)) {
			// Remove any unnecessary spaces either side of the field path.
			fieldPath = fieldPath.toUpperCase().trim();
			if (fieldPath.length > 1 && fieldPath.indexOf('$') == 0) {
				// Remove any $ characters
				fieldPath = fieldPath.replace('$','');
				// Determine if the fieldPath references an array.
				const arrayPartStart = fieldPath.indexOf('[');
				const arrayPartEnd = fieldPath.indexOf(']', arrayPartStart);
				var dataRange = arrayPartStart > 0 && arrayPartEnd > -1 ? new DataRange(arrayPartStart, arrayPartEnd + 1) : null;
				if (arrayPartStart > -1) fieldPath = fieldPath.substring(0, arrayPartStart);
				// Split the field path into parts.
				var fieldPathParts = fieldPath.split(".");
				if (fieldPathParts.length == 1) {
					// Assume the path points to a sibling element in the current container or line.
					if (element.formsController.islineItemsContainer) {
						// Deal with line items here.
						if (dataRange == null) {
							// No array reference was given in the field path, so assume references relate to the line item the element belongs to.
							const lineItemChildNodes = element.lineItemContainer.childNodes;
							for (var i = 0; i < lineItemChildNodes.length; i++) {
								if (lineItemChildNodes[i].nodeType == 1 && lineItemChildNodes[i].hasAttribute("fieldname")) {
									if (lineItemChildNodes[i].getAttribute("fieldname").toUpperCase === fieldPathParts[0]) targetField = lineItemChildNodes[i];
								}
							}
						} else {
							// We've been given an array reference, so return one or more results in an array.
							const lineItems = element.formsController.element.getElementsByClassName("PFormLineItem");
							targetField = [];
							if (dataRange.start < 0) dataRange.start = 0;
							if (dataRange.end < 0 || dataRange.end >= lineItems.length) dataRange.end = lineItems.length - 1;
							for (var i = 0; i < lineItems.length; i++) {
								if (i >= dataRange.start && i <= dataRange.end) {
									const lineFields = lineItems[i].getElementsByClassName("PFormField");
									for (var j = 0; j < lineFields.length; j++) {
										const fieldName = lineFields[j].hasAttribute("fieldname") ? 
											lineFields[j].getAttribute("fieldname").trim().toUpperCase() : null;
										if (fieldName === fieldPathParts[0]) targetField.push(lineFields[j]);
									}
								}
							}
						}
					} else {
						// Otherwise, we're looking for non-line item fields.
						const containerChildNodes = element.formsController.element.getElementsByClassName("PFormField");
						for (var i = 0; i < containerChildNodes.length; i++) {
							if (containerChildNodes[i].parentNode == element.formsController.element && 
									containerChildNodes[i] instanceof HTMLDivElement && containerChildNodes[i].classList.contains("PFormField")) {
								const fieldElement = containerChildNodes[i].getElementsByClassName("PFormField");
								if (fieldElement[0].hasAttribute("fieldname") && 
									fieldElement[0].getAttribute("fieldname").toUpperCase() === fieldPathParts[0]) return fieldElement[0];
							}
						}
					}
				} else {
					// We only ever use the last two parts of the path.  The penultimate part should point to a PFormsContainer with an id attribute.
					const container = document.getElementById(fieldPathParts[fieldPathParts.length - 2]);
					if (container != undefined && container instanceof HTMLDivElement && container.classList.contains("PFormContainer")) {
						if (container.islineItemsContainer) {
							const lineItems = container.getElementsByClassName("PFormLineItem");
							targetField = [];
							// Dealing with line items here.
							if (dataRange == null || (dataRange.start == dataRange.end && dataRange.start == -1)) {
								// We will return all entries if no array range has been provided.
								
								for (var i = 0; i < lineItems.length; i++) {
									const lineFields = lineItems[i].getElementsByClassName("PFormField");
									for (var j = 0; j < lineFields.length; j++) {
										if (lineFields[j].hasAttribute("fieldname") && 
											lineFields[j].getAttribute("fieldname").trim().toUpperCase() === fieldPathParts[fieldPathParts.length - 1]) {
											targetField.push(lineFields[j]);
										}
									}
								}
							} else {
								// We've been given an array reference, so return one or more results in an array.
								if (dataRange.start < 0) dataRange.start = 0;
								if (dataRange.end < 0 || dataRange.end >= lineItems.length) dataRange.end = lineItems.length - 1;
								for (var i = 0; i < lineItems.length; i++) {
									if (i >= dataRange.start && i <= dataRange.end) {
										const lineFields = lineItems[i].getElementsByClassName("PFormField");
										for (var j = 0; j < lineFields.length; j++) {
											const fieldName = lineFields[j].hasAttribute("fieldname") ? 
												lineFields[j].getAttribute("fieldname").trim().toUpperCase() : null;
											if (fieldName === fieldPathParts[fieldPathParts.length - 1]) targetField.push(lineFields[j]);
										}
									}
								}
							}
						} else {
							// Otherwise, we're looking for non-line item fields.
							const containerChildNodes = container.getElementsByClassName("PFormField");
							for (var i = 0; i < containerChildNodes.length; i++) {
								if (containerChildNodes[i].parentNode == container && containerChildNodes[i] instanceof HTMLDivElement && 
									containerChildNodes[i].classList.contains("PFormField")) {
									const fieldElement = containerChildNodes[i].getElementsByClassName("PFormField");
									if (fieldElement[0].hasAttribute("fieldname") && 
										fieldElement[0].getAttribute("fieldname").toUpperCase() === fieldPathParts[fieldPathParts.length - 1]) 
										return fieldElement[0];
								}
							}
						}
					}
				}
			}
		}
	}
}

class DataRange {
	constructor(arrayRangeString = null) {
		if (arrayRangeString != null && (arrayRangeString instanceof String || typeof arrayRangeString === "string") {
			arrayRangeString = arrayRangeString.toString().replace('[','').replace(']','');
			arrayRangeParts = arrayRangeString.split(',');
			if (arrayRangeParts.length == 1) {
				this.start = this.end = !arrayRangeParts[0].trim().isNaN() ? parseInt(arrayRangeParts[0].trim()) : -1;
			} else if (arrayRangeParts.length > 1) {
				this.start = !arrayRangeParts[0].trim().isNaN() ? parseInt(arrayRangeParts[0].trim()) : -1;
				this.end = !arrayRangeParts[1].trim().isNaN() ? parseInt(arrayRangeParts[1].trim()) : -1;
			} else this.start = this.end = -1;
			if (this.end < this.start && this.end != -1) {
				var tempStart = this.start;
				this.start = this.end;
				this.end = tempStart;
			}
		}
	}
}

/*	These methods are called from the web page. */
function InitPForms() {
	var childNodes = document.body.childNodes;
	if (childNodes != null && childNodes.length > 0) {
		for (var i = 0; i < childNodes.length; i++) {
			if (childNodes[i] instanceof HTMLDivElement && childNodes[i].classList.contains("PFormContainer") &&
				childNodes[i].parentNode == document.body) {
				new PFormContainer(childNodes[i]);
			}
		}
	}
}

function UpdatePForms() {
	var childNodes = document.body.childNodes;
	if (childNodes != null && childNodes.length > 0) {
		for (var i = 0; i < childNodes.length; i++) {
			if (childNodes[i] instanceof HTMLDivElement && childNodes[i].classList.contains("PFormContainer") && 
			childNodes[i].formsController != undefined) {
				childNodes[i].formsController.Refresh();
			}
		}
	}
}
