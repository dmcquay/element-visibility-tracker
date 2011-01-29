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

EyeFocus.STATUS_UNKNOWN			= 1 << 0;
EyeFocus.STATUS_VISIBLE			= 1 << 1;
EyeFocus.STATUS_NOT_VISIBLE		= 1 << 2;
EyeFocus.STATUS_TOP_VISIBLE		= 1 << 3;
EyeFocus.STATUS_BOTTOM_VISIBLE	= 1 << 4;

EyeFocus.prototype.initElementStatuses = function() {
	this.elementStatuses = {};
	for (var i = 0; i < this.elements.length; i++) {
		this.elementStatuses[i] = EyeFocus.STATUS_UNKNOWN;
	}
};

EyeFocus.prototype.detectElementStatuses = function() {
	this.prevElementStatuses = this.elementStatuses;
	this.elementStatuses = {};
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

			//this is used to determine a more efficient start index
			if (this.firstVisibleElementIdx == null) {
				this.firstVisibleElementIdx = i;
				this.elementStatuses[i] |= EyeFocus.STATUS_TOP_VISIBLE;
			}
		} else {
			this.elementStatuses[i] = EyeFocus.STATUS_NOT_VISIBLE;
			//this.jQuery(this.elements).trigger('not-visible');
			if (this.visibleElements.length > 0) {
				this.elementStatuses[i-1] |= EyeFocus.STATUS_BOTTOM_VISIBLE;
				break;
			}
		}
	}
	
	//anything that doesn't have a status, set status to NOT_VISIBLE.
	//also, trigger events for any changes.
	var cnt = 0;
	for (var i = 0; i < this.elements.length; i++) {
		if (typeof(this.elementStatuses[i]) === 'undefined') {
			this.elementStatuses[i] = EyeFocus.STATUS_NOT_VISIBLE;
			cnt++;
		}
		if (this.elementStatuses[i] !== this.prevElementStatuses[i]) {
			this.jQuery(this.elements[i]).trigger('visibility-status-change', [this.elementStatuses[i]]);
		}
	}
};

EyeFocus.prototype.isElementVisible = function(elem) {
	this.isElementVisibleCallCount++;
	var elemTop = this.jQuery(elem).offset().top;
	var docViewTop = this.jQuery(window).scrollTop();
	var docViewBottom = docViewTop + this.jQuery(window).height();
	
	if (docViewBottom < elemTop) {
		return false;
	}
	
	var elemBottom = elemTop + this.jQuery(elem).height();

	return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom)
		&& (elemBottom <= docViewBottom) &&  (elemTop >= docViewTop));
};
