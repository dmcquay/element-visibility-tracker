EyeFocus = function(elements) {
	var self = this;
	if(! elements instanceof Array) {
		throw "elements must be an Array";
	}
	for (var i = 0; i < elements.length; i++) {
		if (elements[i] === undefined) {
			throw "undefined element in the array at index " + i;
		}
	}
	this.jQuery = jQuery;
	this.elements = elements;
	this.visibleElements = [];
	this.detectVisibleElements();
	this.jQuery(document).scroll(function() {
		self.detectVisibleElements();
	});
};

EyeFocus.prototype.detectVisibleElements = function() {
	this.visibleElements = [];
	for (var i = 0; i < this.elements.length; i++) {
		if (this.isElementVisible(this.elements[i])) {
			this.visibleElements.push(this.elements[i]);
		} else {
			this.jQuery(this.elements).trigger('not-visible');
		}
	}
	if (this.visibleElements.length > 0) {
		for (var i = 0; i < this.visibleElements.length; i++) {
			this.jQuery(this.visibleElements[i]).trigger('visible');
		}
		this.jQuery(this.visibleElements[0]).trigger('top-visible');
		this.jQuery(this.visibleElements[this.visibleElements.length-1]).trigger('bottom-visible');
	}
};

EyeFocus.prototype.isElementVisible = function(elem) {
	var elemTop = this.jQuery(elem).offset().top;
    var elemBottom = elemTop + this.jQuery(elem).height();
    
    var docViewTop = this.jQuery(window).scrollTop();
    var docViewBottom = docViewTop + this.jQuery(window).height();

    return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom)
      && (elemBottom <= docViewBottom) &&  (elemTop >= docViewTop) );
};
