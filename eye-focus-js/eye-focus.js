/**
 * Provides the EyeFocus object. This object tracks the visibility of a provided set of
 * elements. When an element becomes visible, the "visible" event is triggered on that
 * element. Here are the events triggered:
 *
 *	visible:		when the element is visible
 *	not-visible:	when the element is not visible
 *	top-visible:	the visible element that is highest on the page
 *	bottom-visible:	the visible element that is lowest on the page
 *
 * All events are triggered at the time of the document's scroll event. Currently, events
 * are called every time, not just deltas (e.g. if an element is already visible, the visible
 * event will be called on it again on the next scroll).
 *
 * Author: Dustin McQuay
 * License: MIT
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
	this.jQuery = jQuery;
	this.elements = elements;
	this.initVisibilityStatuses();
	this.detectElementStatuses();
	this.jQuery(window).scroll(function() {
		self.detectElementStatuses();
	});
};

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
