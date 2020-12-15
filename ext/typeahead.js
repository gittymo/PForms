var activeElement = null;
var cursorPosition = 0;
const PFORMS_TYPEAHEAD = "12122020.2158";

function TypeAheadOption(text = "", value = null) {
	this.text = text;
	this.value = (value != null) ? value : text;
	this.element = document.createElement("div");
	this.element.className = "TypeAheadOption";
	this.element.innerHTML = this.text;
	this.element.typeAheadOptionObject = this;

	this.element.addEventListener("click", function (event) {
		var eventElement = event.target;
		var taob = eventElement.typeAheadOptionObject.typeAheadOptionsBox;
		taob.SelectOption(eventElement.typeAheadOptionObject);
	});

	this.element.addEventListener("mouseenter", function (event) {
		var taoElement = event.target;
		var taob = taoElement.typeAheadOptionObject.typeAheadOptionsBox;
		taob.SetHighlightedOption(taoElement.typeAheadOptionObject);
	});

	this.ShowIfContainsText = function (requiredText) {
		var show = this.text.toUpperCase().indexOf(requiredText.toUpperCase()) >= 0;
		this.element.style.display = show ? "block" : "none";
		return show;
	}

	this.GetText = function () { return this.text; }

	this.GetValue = function () { return this.value; }

	this.Clicked = function () { return (activeElement == this.element); }

	this.IsVisible = function () { return this.element.style.display == "block"; }

}

function TypeAheadOptionsBox(typeAheadFieldObject) {
	this.typeAheadFieldObject = typeAheadFieldObject;
	this.optionObjects = [];
	this.selectedOption = this.highlightedOption = null;

	this.element = document.createElement("div");
	this.element.className = "TypeAheadOptions";

	this.Show = function () {
		if (this.HasOptions()) this.SetHighlightedOption(this.optionObjects[0]);
		this.element.style.display = "block";
		this.UpdateWidth();
	}

	this.UpdateWidth = function() {
		this.element.style.width = (this.typeAheadFieldObject.inputElement.clientWidth - 10) + "px";
	}

	this.Hide = function () {
		this.element.style.display = "none";
		this.highlightedOption = null;
	}

	this.IsVisible = function () { return this.element.style.display == "block"; }

	this.Clicked = function () {
		if (activeElement != this.element) {
			if (this.HasOptions()) for (var i = 0; i < this.optionObjects.length; i++) if (this.optionObjects[i].Clicked()) return true;
			return false;
		} else return true;
	}

	this.AddOption = function (optionObject) {
		if (this.optionObjects.indexOf(optionObject) < 0) {
			optionObject.typeAheadOptionsBox = this;
			this.optionObjects.push(optionObject);
			this.element.appendChild(optionObject.element);
		}
	}

	this.HasOptions = function () { return this.optionObjects.length > 0; }

	this.SelectOption = function (option) {
		this.selectedOption = option;
		if (option != null) {
			this.typeAheadFieldObject.SetText(option.GetText());
			for (var i = 0; i < this.optionObjects.length; i++) {
				if (this.optionObjects[i] == this.selectedOption) {
					if (!this.optionObjects[i].element.classList.contains("TypeAheadOptionSelected")) this.optionObjects[i].element.classList.add("TypeAheadOptionSelected");
				} else {
					if (this.optionObjects[i].element.classList.contains("TypeAheadOptionSelected")) this.optionObjects[i].element.classList.remove("TypeAheadOptionSelected");
				}
			}
			typeAheadFieldObject.HideOptions();
			typeAheadFieldObject.NotifyDependents();
		}
	}

	this.SetHighlightedOption = function (option) {
		this.highlightedOption = option;
		if (option != null) {
			for (var i = 0; i < this.optionObjects.length; i++) {
				if (this.optionObjects[i] == this.highlightedOption) {
					if (!this.optionObjects[i].element.classList.contains("TypeAheadOptionHighlighted")) this.optionObjects[i].element.classList.add("TypeAheadOptionHighlighted");
				} else {
					if (this.optionObjects[i].element.classList.contains("TypeAheadOptionHighlighted")) this.optionObjects[i].element.classList.remove("TypeAheadOptionHighlighted");
				}
			}
		}
	}

	this.SelectHighlightedOption = function () { this.SelectOption(this.highlightedOption); }

	this.HighlightNextOption = function () {
		if (this.highlightedOption != null) {
			var noob = this.optionObjects.indexOf(this.highlightedOption) + 1;
			while (noob < this.optionObjects.length) {
				if (this.optionObjects[noob].IsVisible()) {
					this.SetHighlightedOption(this.optionObjects[noob]);
					break;
				}
				noob++;
			}
		}
	}

	this.HighlightPreviousOption = function () {
		if (this.highlightedOption != null) {
			var poob = this.optionObjects.indexOf(this.highlightedOption) - 1;
			while (poob >= 0) {
				if (this.optionObjects[poob].IsVisible()) {
					this.SetHighlightedOption(this.optionObjects[poob]);
					break;
				}
				poob--;
			}
		}
	}

	this.ShowOnlyOptionsContaining = function (requiredText) {
		var noneToShow = true;
		this.highlightedOption = null;
		for (var i = 0; i < this.optionObjects.length; i++) {
			var show = this.optionObjects[i].ShowIfContainsText(requiredText);
			if (show) {
				if (noneToShow) noneToShow = false;
				if (this.highlightedOption == null) this.SetHighlightedOption(this.optionObjects[i]);
			}
		}
		if (noneToShow) this.Hide();
	}
}

function TypeAheadField(inputElement) {
	var parentElement = inputElement.parentElement;
	var nextSibling = inputElement.nextSibling;
	this.container = document.createElement("div");
	this.container.className = "TypeAheadContainer";
	this.container.typeAheadFieldObject = this;
	this.inputElement = inputElement;
	this.inputElement.typeAheadFieldObject = this;
	this.optionsBox = new TypeAheadOptionsBox(this);

	this.inputElement.addEventListener("blur", function (evt) {
		var eventTarget = evt.target;
		var tafo = eventTarget.typeAheadFieldObject;
		if (!tafo.OptionClicked()) {
			if (tafo.optionsBox.selectedOption != null && eventTarget.value.length > 2) tafo.optionsBox.SelectOption(tafo.optionsBox.selectedOption);
			tafo.HideOptions();
		}
	});

	this.inputElement.onkeyup = this.inputElement.onkeydown = this.inputElement.onkeypress = function (evt) {
		var eventTarget = evt.target;
		var tafo = eventTarget.typeAheadFieldObject;
		if (eventTarget.value.length > 2) {
			if (tafo.HasOptions()) {
				switch (evt.code) {
					case "ArrowUp": {
						tafo.optionsBox.HighlightPreviousOption();
						eventTarget.selectionStart = eventTarget.selectionEnd = cursorPosition;
					} break;
					case "ArrowDown": {
						tafo.optionsBox.HighlightNextOption();
						eventTarget.selectionStart = eventTarget.selectionEnd = cursorPosition;
					} break;
					case "Enter":
					case "Tab": {
						if (tafo.optionsBox.highlightedOption != tafo.optionsBox.selectedOption) {
							if (eventTarget.value.length > 2) tafo.optionsBox.SelectHighlightedOption();
							else tafo.HideOptions();
						}
						else tafo.optionsBox.SelectOption(tafo.optionsBox.selectedOption);
					} break;
					case "Escape": {
						if (tafo.optionsBox.selectedOption != null && eventTarget.value.length > 2) tafo.optionsBox.SelectOption(tafo.optionsBox.selectedOption);
						tafo.HideOptions();
					} break;
					default: cursorPosition = eventTarget.selectionStart;
				}
			}
		} else tafo.optionsBox.selectedOption = tafo.optionsBox.highlightedOption = null;
	};

	this.inputElement.addEventListener("input", function (evt) {
		var eventTarget = evt.target;
		var tafo = eventTarget.typeAheadFieldObject;
		if (eventTarget.value.length > 2) {
			if (!tafo.optionsBox.visible) tafo.ShowOptions();
			tafo.optionsBox.ShowOnlyOptionsContaining(tafo.inputElement.value);
		} else tafo.HideOptions();
	});

	this.container.appendChild(this.inputElement);
	this.container.appendChild(this.optionsBox.element);
	this.dependents = [];

	this.inputElement.setAttribute("cfgdone", "true");

	this.HasOptions = function () { return (this.optionsBox != null && this.optionsBox.HasOptions()); }

	this.ShowOptions = function () { this.optionsBox.Show(); }

	this.HideOptions = function () { this.optionsBox.Hide(); }

	this.OptionClicked = function () { return this.optionsBox.Clicked(); }

	this.GetSelectedOption = function () { return this.optionsBox.selectedOption; }

	this.SetValue = function (value = null) { this.inputElement.value = value; }

	this.SetText = function (text = null) { this.inputElement.value = text; }

	this.GetValue = function () { return (this.optionsBox.selectedOption != null) ? this.optionsBox.selectedOption.GetValue() : null; }

	this.GetText = function () { return this.inputElement.value; }

	this.AddOption = function (text = "", value = null) { this.optionsBox.AddOption(new TypeAheadOption(text, value)); }

	this.AddDependent = function (dependent) { if (this.dependents.indexOf(dependent) < 0) this.dependents.push(dependent); }

	this.NotifyDependents = function () {
		for (var i = 0; i < this.dependents.length; i++) this.dependents[i].ProviderValueChanged(this);
	}

	this.RemoveDependent = function (dependent) {
		var dependentIndex = this.dependents.indexOf(dependent);
		if (dependentIndex >= 0) this.dependents.splice(dependentIndex, 1);
	}
}

function InitLibTypeAhead() {
	document.body.addEventListener("mousemove", function (evt) {
		var eventTarget = evt.target;
		if (activeElement != eventTarget) activeElement = eventTarget;
	});
}