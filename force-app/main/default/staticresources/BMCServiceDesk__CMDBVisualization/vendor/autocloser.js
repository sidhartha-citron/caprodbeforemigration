// This is for jslint:
/*global $, Event, Class, document, navigator, window, grouplist */


var Rect = {

    topX: function (obj) {
        var result = 0;
        do {
            result += obj.offsetLeft;
            obj = obj.offsetParent;
        } while (obj !== null);

        return result;
    },
    
    topY: function (obj) {
        var result = 0;
        do {
            result += obj.offsetTop;
            obj = obj.offsetParent;
        } while (obj !== null);

        return result;
    },
    
    downX: function (obj) {
        return this.topX(obj) + obj.offsetWidth;
    },
    
    downY: function (obj) {
        return this.topY(obj) + obj.offsetHeight;
    },

    getRect: function (obj) {
        /* A - top left,
           B - top right,
           C - bottom right,
           D - bottom left,
        */

         return {
             A: {x: this.topX(obj),  y: this.topY(obj) },
	         B: {x: this.downX(obj), y: this.topY(obj) },
	         C: {x: this.downX(obj), y: this.downY(obj)},
	         D: {x: this.topX(obj),  y: this.downY(obj)}
         };
    },

    vertexInRect: function (verteces, ourRect) {

        /*
         * checking each vertex of rectangle in ourRect
         * verteces - array of A.x,A.y,B.x,B.y etc.
         */

        var flag = false;
        var kk = null;
        
        for (kk in verteces) {
            if( (verteces[kk].x < ourRect.C.x) &&
                (verteces[kk].x > ourRect.A.x) &&
                (verteces[kk].y > ourRect.A.y) &&
                (verteces[kk].y < ourRect.C.y) ) {
                 flag = true;
                 break;
             }
        }
        return flag;
    },

    checkOverlap: function (menuEl, selectEl) {

        var menu = this.getRect(menuEl);
        var select = this.getRect(selectEl);

        return ((this.vertexInRect(menu,select))||(this.vertexInRect(select,menu)));
    }
};



var autocloser = {
    // variables
    activeElement: null,
    parentItem: null,

    // functions

    checkOpen: function(elementId) {
        /*
         * set up listening so that block autocloses if mouse is clicked outside
         */
        if ($(autocloser.activeElement) !== null) {
            // there's an activeElement waiting to be closed

            if (autocloser.activeElement !== elementId) {
                // the activeElement is not this element - close it and open this one.
                autocloser.close(autocloser.activeElement);
                autocloser.reallyOpen(elementId);
            
            } else if (autocloser.activeElement === elementId && $(autocloser.activeElement).visible()) {
                // activeElement is this element, which is open - close it
                autocloser.close(elementId);

            } else {
                // activeElement is this element, which has been badly closed.  clear old events and reopen.
                autocloser.cancelEventListening(autocloser.activeElement);       
                autocloser.reallyOpen(elementId);
            }
        } else {
            // no activeElement.  Open item as expected.
            autocloser.reallyOpen(elementId);
        }
    },


    cancelEventListening: function(elementId) {
        // remove autocloser event handling
        Event.stopObserving(document, 'click', autocloser.clickHandler);
        Event.stopObserving(document, 'keyup', autocloser.keyupHandler);
        Event.stopObserving(window, 'resize', autocloser.resizeHandler);
        autocloser.activeElement = null;
    },
  
    startEventListening: function(elementId) {
        // make an element close automatically when mouse is clicked outside of it.
        autocloser.activeElement = elementId;
        Event.observe(document, 'click', autocloser.clickHandler);
        Event.observe(document, 'keyup', autocloser.keyupHandler);
    },


    /*
     * clickHandler function acts as a forwarder to the handleClick function
     * This is so that exactly the same details can be attached to the Event.observe
     * and the Event.stopObserving.  If this isn't done, the stopObserving... won't.
     */
    clickHandler: function (event) { autocloser.handleClick(event); },
  
    handleClick: function (event) {

        // In IE click on <use href="xlink:"> is handled as a click on element
        // which xlink points to, so we need to manually change clicked element

        var clickedElement = (Prototype.Browser.IE && event.target.correspondingUseElement) ?
            $(Event.element(event)).correspondingUseElement : $(Event.element(event));

        while(clickedElement.descendantOf === undefined) {
            clickedElement = Element.up(clickedElement);
        }

        if (!(clickedElement === $(autocloser.activeElement) ||
              clickedElement.descendantOf(autocloser.activeElement))) {

            // mouse is out of active element, check what to do.

            if(!( (clickedElement === autocloser.parentItem) ||
                  (clickedElement.descendantOf(autocloser.parentItem)) )) {
                // checks if we've clicked to parent link
                autocloser.checkOpen(autocloser.activeElement);
            }
        }
    },


    /*
     * keyupHandler function acts as a forwarder to the handleKeyup function
     * This is so that exactly the same details can be attached to the Event.observe
     * and the Event.stopObserving.  If this isn't done, the stopObserving... won't.
     */
    keyupHandler: function (event) { autocloser.handleKeyup(event); },

    handleKeyup: function(event) {
        if (event.keyCode == '27') {
            if (autocloser.activeElement !== null) {
                autocloser.close(autocloser.activeElement, 'slide');
            }
        }
    },

    /*
     * resizeHandler function acts as a forwarder to the handleResize function
     * This is so that exactly the same details can be attached to the Event.observe
     * and the Event.stopObserving. If this isn't done, the stopObserving... won't.
     */
    resizeHandler: function() { autocloser.handleResize(); },

    handleResize: debounce(function() {
        var offset = autocloser.parentItem.positionedOffset().left -
                     ($(autocloser.activeElement).getWidth() -
                     autocloser.parentItem.getWidth());

        offset = offset > 0 ? offset + "px" : "auto";
        $(autocloser.activeElement).setStyle({
            left: offset
        });
    }, 50),

    
    reallyOpen: function (elementId) {
        $(elementId).show();
        $(elementId).removeAttribute("aria-hidden");
      
        autocloser.startEventListening(elementId);
        autocloser.hideSelects($(elementId));
        
    },

    
    close: function (elementId) {
        // Cancel listening and then hide the element
        
        // checking for opened sub menu in FBD 
        // this all should be rewrited properly
        var holders = $$('.funFilterHolder');
                for (var i = 0; i< holders.length; i++) {
                    $(holders[i]).style.display = 'none';
                    $(holders[i]).previous('a').addClassName('closed');
                    if ($(holders[i].parentNode).hasClassName('groupHighlight')) {
                        $(holders[i].parentNode).removeClassName('groupHighlight');
                    }
                }

        // end
 
        if ($('groupholder')) {
            if ($('groupActionDropdownLink')) {
                if (!($('groupActionDropdownLink').hasClassName('closed'))) {
                    grouplist.closeGroupList('groupActionDropdownLink');
                }
            }
        }
    
        autocloser.cancelEventListening(elementId);
  
        $(elementId).hide();
        $(elementId).setAttribute("aria-hidden", "true");
        autocloser.showSelects();
    
        // set className of parent link to 'closed'
        $(autocloser.parentItem).removeClassName('opened');
        $(autocloser.parentItem).addClassName('closed');
    },

    
    forceClose: function() {
        if (autocloser.activeElement !== null) {
            autocloser.close(autocloser.activeElement);
        }
    },


    hideSelects: function(element) {
        // hide all <select> elements in the content from IE6
        if(Prototype.Browser.IE6) {
           
            /* we need wait 200 ms before get coordinates
             * cause of Effect.SlideDown duration 200 ms 
             */

            var a = window.setTimeout(function () {
                var ii;
                
                var theSelects = $('content1').getElementsByTagName('select');
                for (ii = 0; ii < theSelects.length; ii++) {
                    if(Rect.checkOverlap(element, theSelects[ii])) {
                        theSelects[ii].style.visibility='hidden';
                    }
                }
                
                window.clearTimeout(a);
            }, 401);
        }
    },

    showSelects: function() {
        // unhide all <select> elements in the content for IE6
        if(Prototype.Browser.IE6) {
           
            var ii;
           
            var theSelects = $('content1').getElementsByTagName('select');
            for (ii = 0; ii < theSelects.length; ii++) {
                theSelects[ii].style.visibility='visible';
            }
        }
    },


    toggleHolder: function (parent_id, holder_id, align_right, auto_adjust) {
        // toggles Holder by autocloser, hides it when click again
        // parent_id - link`s id, where are you clicking
        // holder_id - dropDown element
        // also parent element have to contain 'closed' className
        var parent = $(parent_id),
            holder = $(holder_id);
        
        if (parent.hasClassName('closed')) {
            autocloser.checkOpen(holder_id); // open holder
            autocloser.parentItem = parent;
            
            // set className of parent link to 'opened'
            $(autocloser.parentItem).removeClassName('closed');
            $(autocloser.parentItem).addClassName('opened');
            
            if (align_right === true) {
                var offset = parent.positionedOffset().left -
                             (holder.getWidth() - parent.getWidth());

                // Align the holder by right side only if there is enough space
                // for it on the screen. Otherwise left its position placed by
                // default.
                offset = offset > 0 ? offset + "px" : "auto";
                holder.setStyle({
                    left: offset
                });
                if (auto_adjust === true) {

                    // Dynamically change the holder position if user changes the
                    // window width to prevent falling holder out of the screen
                    Event.observe(window, 'resize', autocloser.resizeHandler);
                }
            }
        } else {
            autocloser.close(holder_id); // close holder
        }
    },

    toggleOpened: function(parent_id, holder_id, align_right) {
      
       var menuLinks = $$('.headerContainer');
       for (var i = 0; i < menuLinks.length; i++) {
          if (menuLinks[i].hasClassName('opened') && (menuLinks[i].id != parent_id)) {
              this.toggleHolder(parent_id, holder_id, align_right);
          }
       }
    }
};
