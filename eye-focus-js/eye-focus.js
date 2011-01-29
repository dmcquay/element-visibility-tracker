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
	this.visibleElements = [];
	this.elementStatuses = {};
	this.prevElementStatuses = {};
	this.detectElementStatuses();
	this.jQuery(document).scroll(function() {
		self.detectElementStatuses();
	});
};

EyeFocus.STATUS_VISIBLE			= 1 << 1;
EyeFocus.STATUS_TOP_VISIBLE		= 1 << 3;
EyeFocus.STATUS_BOTTOM_VISIBLE	= 1 << 4;

EyeFocus.prototype.initElementStatuses = function() {
	this.elementStatuses = {};
	this.newElementStatuses = {};
	for (var i = 0; i < this.elements.length; i++) {
		this.elementStatuses[i] = EyeFocus.STATUS_UNKNOWN;
		this.newElementStatuses[i] = new EyeFocus.VisibilityStatus();
	}
};

EyeFocus.prototype.detectElementStatuses = function() {
	this.prevElementStatuses = this.elementStatuses;
	this.newPrevElementStatuses = this.newElementStatuses;
	this.initElementStatuses();
	this.isElementVisibleCallCount = 0;
	this.visibleElements = [];
	
	//figure out starting index
	var startIdx = 0;
	if (this.firstVisibleElementIdx !== null && this.firstVisibleElementIdx > 0) {
		startIdx = this.firstVisibleElementIdx - 1;
	}
	this.firstVisibleElementIdx = null;
	
	//check for changed statuses
	var stopChecking = false;
	for (var i = startIdx; i < this.elements.length; i++) {
		if (!stopChecking && this.isElementVisible(this.elements[i])) {
			//this is used to determine top and bottom visible elements later
			//and also to track if any visible elements have been found
			this.visibleElements.push(this.elements[i]);
			this.elementStatuses[i] = EyeFocus.STATUS_VISIBLE;
			this.newElementStatuses[i].isVisible(true);

			//this is used to determine a more efficient start index
			if (this.firstVisibleElementIdx == null) {
				this.firstVisibleElementIdx = i;
				this.elementStatuses[i] |= EyeFocus.STATUS_TOP_VISIBLE;
				this.newElementStatuses[i].isHighestVisible(true);
			}
			
			//normally we catch the bottom visible element in the else
			//clause below, but if it is the very last element, then it
			//won't get caught there.
			if (i === this.elements.length - 1) {
				this.elementStatuses[i] |= EyeFocus.STATUS_BOTTOM_VISIBLE;
				this.newElementStatuses[i].isLowestVisible(true);
			}
		} else {
			if (this.visibleElements.length > 0) {
				this.elementStatuses[i-1] |= EyeFocus.STATUS_BOTTOM_VISIBLE;
				this.newElementStatuses[i-1].isLowestVisible(true);
				break;
			}
		}
	}
	
	//trigger events for any changes.
	var cnt = 0;
	for (var i = 0; i < this.elements.length; i++) {
		if (this.elementStatuses[i] !== this.prevElementStatuses[i]) {
			this.jQuery(this.elements[i]).trigger('visibility-status-change', [this.elementStatuses[i], this.newElementStatuses[i]]);
		}
	}
};

EyeFocus.prototype.isElementVisible = function(elem) {
	var elemTop = this.jQuery(elem).offset().top;
	var elemBottom = elemTop + this.jQuery(elem).height();
	var docViewTop = this.jQuery(window).scrollTop();
	var docViewBottom = docViewTop + this.jQuery(window).height();
	return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom)
		&& (elemBottom <= docViewBottom) &&  (elemTop >= docViewTop));
};





EyeFocus.VisibilityStatus = function() {};

EyeFocus.VisibilityStatus.STATUS_UNKNOWN									= 1 << 0;
EyeFocus.VisibilityStatus.STATUS_VISIBLE									= 1 << 1;
EyeFocus.VisibilityStatus.STATUS_HIGHEST_VISIBLE							= 1 << 2;
EyeFocus.VisibilityStatus.STATUS_LOWEST_VISIBLE								= 1 << 3;
EyeFocus.VisibilityStatus.STATUS_PARTIALLY_VISIBLE							= 1 << 4;
EyeFocus.VisibilityStatus.STATUS_HIGHEST_PARTIALLY_VISIBLE					= 1 << 5;
EyeFocus.VisibilityStatus.STATUS_HIGHEST_PARTIALLY_VISIBLE					= 1 << 6;
EyeFocus.VisibilityStatus.STATUS_PARTIALLY_VISIBLE_WITH_NO_VISIBLE_SIBLINGS	= 1 << 7;

EyeFocus.VisibilityStatus.prototype.isVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isHighestVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_HIGHEST_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isLowestVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_LOWEST_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isPartiallyVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_PARTIALLY_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isHighestPartiallyVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_HIGHEST_PARTIALLY_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isLowestPartiallyVisible = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_LOWEST_PARTIALLY_VISIBLE);
};

EyeFocus.VisibilityStatus.prototype.isPartiallyVisibleWithNoVisibleSiblings = function(value) {
	return this.checkOrSetStatus(value, EyeFocus.VisibilityStatus.STATUS_PARTIALLY_VISIBLE_WITH_NO_VISIBLE_SIBLINGS);
};

EyeFocus.VisibilityStatus.prototype.checkOrSetStatus = function(value, status) {
	if (typeof(value) !== 'undefined') {
		if (value) { this._statusCode |= status; }
		else { this._statusCode ^= status; }
	}
	return this._statusCode & status;
};
