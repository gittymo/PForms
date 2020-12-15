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
				if (nodeClone.classList.contains("TypeAhead")) {
					var typeAhead = new TypeAheadField(nodeClone);
					if (typeAhead.inputElement.hasAttribute("generator")) {
						window[typeAhead.inputElement.getAttribute("generator")](typeAhead);
					}
					nodeClone = typeAhead.container;
				}
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

	if (PFORMS_TYPEAHEAD) InitLibTypeAhead();

	window.onresize = UpdatePForms;
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

	if (PFORMS_TYPEAHEAD) {
		var typeaheads = document.getElementsByClassName("TypeAheadContainer");
		for (var i = 0; i < typeaheads.length; i++) {
			var tao = typeaheads[i].typeAheadFieldObject;
			tao.optionsBox.UpdateWidth();
		}
	}
}