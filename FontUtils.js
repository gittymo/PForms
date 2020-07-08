/*	FontUtils.js
		Various utility classes and methods for working with elements that use fonts.
		(C)2020 Morgan Evans */

export class FontDimensions {
	constructor(element) {
		this.width = this.height = -1;
		if (element != undefined && element != null && element instanceof HTMLElement) {
			var measureBox = document.createElement("div");
			document.body.appendChild(measureBox);
			measureBox.style.padding = "0px";
			measureBox.style.border = "0px";
			measureBox.style.display = "inline-block";
			measureBox.style.fontFamily = window.getComputedStyle(element).fontFamily;
			measureBox.style.fontSize = window.getComputedStyle(element).fontSize;
			measureBox.style.fontWeight = window.getComputedStyle(element).fontWeight;
			const boxString =
				"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'\"@.,-+*()£$?!";
			var sets = 0;
			for (var i = 0; i < boxString.length; i += 5) {
				const lastChar = i + 5 < boxString.length ? i + 5 : boxString.length;
				measureBox.innerHTML = boxString.substring(i, lastChar);
				this.width += measureBox.clientWidth / (lastChar - i);
				this.height += measureBox.clientHeight;
				sets += 1;
			}
			this.width = this.width / sets;
			this.height = this.height / sets;
			document.body.removeChild(measureBox);
		}
	}
}