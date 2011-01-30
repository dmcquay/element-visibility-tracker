/**
 * Provides the EyeFocus object. This object tracks the visibility of a provided set of
 * elements. Visibility is tracked very specifically (visible, partially visible, first
 * visible, etc. When the visibility of an element changes, the 'visibility-status-change'
 * event is fired and an instance of EyeFocus.VisibilityStatus (see below) is passed to
 * the handler. See documentation for EyeFocus.VisibilityStatus for what visibility
 * information is available.
 *
 * Author: Dustin McQuay
 * License: MIT
 * Version: 0.0.1
 */

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
	if (typeof(jQuery) === 'undefined') {
		throw "This library depends on jQuery. Please load jQuery first.";
	}
	if (typeof(window) === 'undefined') {
		throw "This library only works in a browser. This doesn't look like a browser because 'window' is undefined.";
	}
	this.jQuery = jQuery;
	this.elements = elements;
	this.initVisibilityStatuses();
	this.detectElementStatuses();
	this.jQuery(window).scroll(function() {
		self.detectElementStatuses();
	});
};

EyeFocus.VERSION = '0.0.1';

EyeFocus.prototype.initVisibilityStatuses = function() {
	this.prevVisibilityStatuses = this.visibilityStatuses;
	this.visibilityStatuses = {};
	for (var i = 0; i < this.elements.length; i++) {
		this.visibilityStatuses[i] = new EyeFocus.VisibilityStatus();
	}
};

EyeFocus.prototype.calcDocViewOffsets = function() {
	this.docViewTop = this.jQuery(window).scrollTop();
	this.docViewBottom = this.docViewTop + this.jQuery(window).height();
};

EyeFocus.prototype.determineStartIndex = function() {
	this.startIdx = 0;
	if (typeof(this.prevVisibilityStatuses) === 'undefined' || this.prevVisibilityStatuses == null || this.prevVisibilityStatuses.length == 0) {		
		return;
	}
	for (var i = 0; i < this.elements.length; i++) {
		if (this.prevVisibilityStatuses[i].isVisible() || this.prevVisibilityStatuses[i].isPartiallyVisible()) {
			this.startIdx = i;
			break;
		}
	}
	//TODO: populating these visibility statuses seems like a "side effect" not communicated well by the func name
	while (true) {
		this.setInitialVisibilityStatus(this.elements[this.startIdx], this.visibilityStatuses[this.startIdx]);
		if (this.visibilityStatuses[this.startIdx].isPartiallyVisible() && this.startIdx > 0) {
			this.startIdx--;
		} else {
			break;
		}
	}
};

EyeFocus.prototype.searchForVisibleElements = function() {
	this.visibleElementsFound = false;
	var foundSomethingAtLeastPartiallyVisible = false;
	for (var i = this.startIdx; i < this.elements.length; i++) {
		this.setInitialVisibilityStatus(this.elements[i], this.visibilityStatuses[i]);
		if (this.visibilityStatuses[i].isPartiallyVisible() || this.visibilityStatuses[i].isVisible()) {
			foundSomethingAtLeastPartiallyVisible = true;
			if (this.visibilityStatuses[i].isVisible()) {
				this.visibleElementsFound = true;
			}
		} else if (foundSomethingAtLeastPartiallyVisible) {
			break;
		}
	}
};

EyeFocus.prototype.searchForFirstElements = function() {
	var firstVisibleFound = false;
	var firstPartiallyVisibleFound = false;
	for (var i = this.startIdx; i < this.elements.length; i++) {
		if (!firstVisibleFound && this.visibilityStatuses[i].isVisible()) {
			this.visibilityStatuses[i].isFirstVisible(true);
			firstVisibleFound = true;
		}
		if (!firstPartiallyVisibleFound && this.visibilityStatuses[i].isPartiallyVisible()) {
			this.visibilityStatuses[i].isFirstPartiallyVisible(true);
			firstPartiallyVisibleFound = true;
		}
		if (firstVisibleFound && firstPartiallyVisibleFound) {
			break;
		}
	}
};

EyeFocus.prototype.searchForLastElements = function() {
	var lastVisibleFound = false;
	var lastPartiallyVisibleFound = false;
	for (var i = this.elements.length - 1; i >= 0; i--) {
		if (!lastVisibleFound && this.visibilityStatuses[i].isVisible()) {
			this.visibilityStatuses[i].isLastVisible(true);
			lastVisibleFound = true;
		}
		if (!lastPartiallyVisibleFound && this.visibilityStatuses[i].isPartiallyVisible()) {
			this.visibilityStatuses[i].isLastPartiallyVisible(true);
			lastPartiallyVisibleFound = true;
		}
		if (lastVisibleFound && lastPartiallyVisibleFound) {
			break;
		}
	}
};

EyeFocus.prototype.setSiblingStatusForPartiallyVisibleElements = function() {
	if (!this.visibleElementsFound) {
		for (var i = this.startIdx; i < this.elements.length; i++) {
			if (this.visibilityStatuses[i].isPartiallyVisible()) {
				this.visibilityStatuses[i].isPartiallyVisibleWithNoVisibleSiblings(true);
			}
		}
	}
};

EyeFocus.prototype.triggerStatusChangeEvents = function() {
	for (var i = 0; i < this.elements.length; i++) {
		if (!this.visibilityStatuses[i].equals(this.prevVisibilityStatuses[i])) {
			this.jQuery(this.elements[i]).trigger('visibility-status-change', [this.visibilityStatuses[i]]);
		}
	}
};

EyeFocus.prototype.detectElementStatuses = function() {
	this.initVisibilityStatuses();
	this.calcDocViewOffsets();
	this.determineStartIndex();
	this.searchForVisibleElements();
	this.searchForFirstElements();
	this.searchForLastElements();
	this.setSiblingStatusForPartiallyVisibleElements();
	this.triggerStatusChangeEvents();
};

EyeFocus.prototype.setInitialVisibilityStatus = function(elem, visibilityStatus) {
	var elemTop = this.jQuery(elem).offset().top;
	var elemBottom = elemTop + this.jQuery(elem).height();
	
	var isVisible = ((elemBottom >= this.docViewTop) && (elemTop <= this.docViewBottom)
		&& (elemBottom <= this.docViewBottom) &&  (elemTop >= this.docViewTop));
	if (isVisible) visibilityStatus.isVisible(true);
	
	var isPartiallyVisible = elemBottom >= this.docViewTop && elemTop <= this.docViewBottom;
	if (isPartiallyVisible) visibilityStatus.isPartiallyVisible(true);
};




/**
 * EyeFocus.VisibilityStatus is a simple object that tracks the visibility of a given element.
 * Here are the possible statuses with descriptions:
 * 
 * visible - 100% of the element is visible
 * firstVisible - The highest visible element on the page
 * lastVisible - The lowest visible element on the page
 * partiallyVisible - Some part of this element is visible, but not all
 * firstPartiallyVisible - The highest partially visible element on the page
 * lastPartiallyVisible - The lowest partially visible element on the page
 * partiallyVisibleWithNoVisibleSiblings - This element is partially visible and no elements are 100% visible
 *
 * To check a visibility status, prepend the status with "is" and call it as a function
 * (e.g. instance.isFirstPartiallyVisible()).
 */
EyeFocus.VisibilityStatus = function() {};

EyeFocus.VisibilityStatus.STATUS_VISIBLE									= 1 << 1;
EyeFocus.VisibilityStatus.STATUS_FIRST_VISIBLE								= 1 << 2;
EyeFocus.VisibilityStatus.STATUS_LAST_VISIBLE								= 1 << 3;
EyeFocus.VisibilityStatus.STATUS_PARTIALLY_VISIBLE							= 1 << 4;
EyeFocus.VisibilityStatus.STATUS_FIRST_PARTIALLY_VISIBLE					= 1 << 5;
EyeFocus.VisibilityStatus.STATUS_LAST_PARTIALLY_VISIBLE						= 1 << 6;
EyeFocus.VisibilityStatus.STATUS_PARTIALLY_VISIBLE_WITH_NO_VISIBLE_SIBLINGS	= 1 << 7;

EyeFocus.VisibilityStatus.prototype.isVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isFirstVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_FIRST_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isLastVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_LAST_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isPartiallyVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_PARTIALLY_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isFirstPartiallyVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_FIRST_PARTIALLY_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isLastPartiallyVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_LAST_PARTIALLY_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isPartiallyVisibleWithNoVisibleSiblings = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_PARTIALLY_VISIBLE_WITH_NO_VISIBLE_SIBLINGS);
};

EyeFocus.VisibilityStatus.prototype.checkOrSetStatus = function(value, status) {
	if (typeof(value) !== 'undefined') {
		if (value) { this._statusCode |= status; }
		else { this._statusCode ^= status; }
	}
	return Boolean(this._statusCode & status);
};

EyeFocus.VisibilityStatus.prototype.equals = function(otherStatus) {
	return this._statusCode === otherStatus._statusCode;
};
