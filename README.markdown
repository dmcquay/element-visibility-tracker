#VisibilityTracker

Fires an event as elements scroll through the viewport (viewable area of the browser window).
Read the [VisibilityTracker documentation](http://www.synchrosinteractive.com/element-visibility-tracker/docs/index.html)
for more inforamtion.

#Synopsis

    jQuery(document).ready(function(){
        var pEls = document.getElementsByTagName('p');
        jQuery(pEls).bind('visibility-status-change', function(evt, visibilityStatus) {
            if (visibilityStatus.isLastVisible()) {
                jQuery(evt.target).addClass('lastVisible');
            } else {
                jQuery(evt.target).removeClass('lastVisible');
            }
        });
        new VisibilityTracker(pEls);
    });
