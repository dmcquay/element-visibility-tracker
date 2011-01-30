=EyeFocus

Provides the EyeFocus object. This object tracks the visibility of a provided set of
elements. Visibility is tracked very specifically (visible, partially visible, first
visible, etc. When the visibility of an element changes, the 'visibility-status-change'
event is fired and an instance of EyeFocus.VisibilityStatus (see below) is passed to
the handler. See documentation for EyeFocus.VisibilityStatus for what visibility
information is available.

=EyeFocus.VisibilityStatus

EyeFocus.VisibilityStatus is a simple object that tracks the visibility of a given element.
Here are the possible statuses with descriptions:
 
*visible - 100% of the element is visible
*firstVisible - The highest visible element on the page
*lastVisible - The lowest visible element on the page
*partiallyVisible - Some part of this element is visible, but not all
*firstPartiallyVisible - The highest partially visible element on the page
*lastPartiallyVisible - The lowest partially visible element on the page
*partiallyVisibleWithNoVisibleSiblings - This element is partially visible and no elements are 100% visible

To check a visibility status, prepend the status with "is" and call it as a function
(e.g. instance.isFirstPartiallyVisible()).

=Example

jQuery(document).ready(function(){
	var pEls = document.getElementsByTagName('p');
	jQuery(pEls).bind('visibility-status-change', function(evt, visibilityStatus) {
		if (visibilityStatus.isLastVisible()) {
			jQuery(evt.target).addClass('lastVisible');
		} else {
			jQuery(evt.target).removeClass('lastVisible');
		}
	});
	new EyeFocus(pEls);
});
