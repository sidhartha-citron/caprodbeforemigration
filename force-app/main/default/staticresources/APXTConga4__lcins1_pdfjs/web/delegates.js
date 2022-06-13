(function($) {
	$(document).ready(function() {
        var $viewport = $('#viewerContainer');
        var mouseUpTimer;

        var scrollTo = function(next) {
            var nextOffset = $(next).parent().position();
            var pageOffset = next.parents('.page').position();
            // Scroll viewer to location of input in center of $viewport
            var scrollTop = parseInt(nextOffset.top + $viewport.scrollTop() + pageOffset.top - $viewport.height() / 1.25);
            if(scrollTop < 0) {
                // Can't scroll to this position so we'll scroll to top of document instead of bottom of document
                scrollTop = parseInt(nextOffset.top + $viewport.scrollTop() + pageOffset.top - ($viewport.height() - $viewport.height() / 1.25));
            }
            var scrollLeft = parseInt(nextOffset.left + $viewport.scrollLeft() + pageOffset.left - $viewport.width() / 2);
            var scrollDist = Math.sqrt(Math.pow(scrollTop - $viewport.scrollTop(),2) + Math.pow(scrollLeft - $viewport.scrollLeft(),2));
            var animationMs = parseInt(Math.abs(scrollDist / $viewport.height()) * 300);
            // Animate scroll to desired position
            $viewport.animate({
                scrollTop: scrollTop,
                scrollLeft: scrollLeft
            },
            {
                // Animation time based on distance from current scroll position
                duration:animationMs
            });
        };
        
        var determineIndexOfSelection = function($node, offset) {
    		var $pageElements = $node.closest('div.page').find('div.textLayer>div');
    		var textString = '';
    		for(var i=0; i<$pageElements.length; i++) {
    			var element = $($pageElements[i]);
    			if(element.is($node)) {
    				var nodeText = element.text().substring(0, offset);
    				textString += nodeText;
    				return textString;
    			} else {
    				textString += element.text();
    			}
    		}
    		console.error('COULD NOT FIND SENTENCE STOP.');
    	}
    	
    	var getRangeObject = function(selectionObject) {
    		if(selectionObject.getRangeAt) {
    			return selectionObject.getRangeAt(0);
    		} else {
    			var range = document.createRange();
    			range.setStart(selectionObject.anchorNode, selectionObject.anchorOffset);
    			range.setEnd(selectionObject.focusNode, selectionObject.focusOffset);
    			return range;
    		}
    	}
    	
    	var getOccurrenceNumber = function(pageEl, targetEl, value, valueElIndex) {
            // Remove whitespace from page text and selection text
            var spacesRe = /\s+/g;
            var pageText = pageEl.text().replace(spacesRe, '');
            var searchText = value.replace(spacesRe, '');
            // Adjust value offset value by number of chars removed as whitespace
            var divText = targetEl.text().substring(0, valueElIndex);
            var divStripText = divText.replace(spacesRe, '');
            var spacesOffset = divText.length - divStripText.length;
            valueElIndex -= spacesOffset;
            // Find total number of occurrences of selection in page text, escape regexp special chars
            var re = new RegExp(searchText.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\\\$&'), 'g');
            var indices = [];
            var match = re.exec(pageText);
            while (match != null && indices.length < pageText.length) {
                indices.push(match.index);
                match = re.exec(pageText);
            }
            // If only one return 0
            if (indices.length > 1) {
                // If multiple occurrences, identify selection offset from start of page by number of characters
                var expectedOffset = targetEl.prevAll().text().replace(spacesRe, '').length + valueElIndex;
                // Loop through each match and compare offset relative to page until occurence is found
                for (var i=0; i<indices.length; i++) {
                    if (indices[i] >= expectedOffset) {
                        // Return occurrence index
                        return i;
                    }
                }
            }
            return 0;
        };
        
    	$('div#viewer').on('mouseup', 'div.page div.textLayer', function(e) {
    		mouseUpTimer = setTimeout(function() {
                clearInterval(mouseUpTimer);
	    		var selection = window.getSelection();
	    		var range = getRangeObject(selection);
	    		var endOffset = selection.getRangeAt(0).endOffset;
	    		var startNode = range.startContainer.parentNode;
	    		var endNode = range.endContainer.parentNode;
	    		var $startNode = $(startNode);
	    		var $endNode = $(endNode);
	    		var rexp = new RegExp('(\r\n|\n|\r)', 'gm');
	    		var selectedText = selection.toString().replace(rexp, '');
	    		if(selectedText) {
	    			var start;
                    if($(start).is($(selection.anchorNode))) {
                        start = $(selection.focusNode);
                    } else {
                        start = $(selection.anchorNode);
                    }
					//scrollTo(start);
	    			var textString = determineIndexOfSelection($endNode, endOffset);
	    			var highlightedTextString = selectedText.replace(/(\r\n|\n|\r)/gm, '');
	    			var regex = new RegExp(selectedText, 'g');
	    			var occurrence = (textString.match(regex) || []).length;
	    			var page = $startNode.closest('div.page').attr('data-page-number');
	    			var dataObj = {
	    				coords: {
	    					x: e.pageX,
	    					y: e.pageY
	    				},
						targetHeight: e.target.clientHeight,
	    				occurrence: occurrence,
	    				page: page,
	    				text: highlightedTextString
	    			};
	    			parent.postMessage(JSON.stringify(dataObj), window.location.origin);
	    		}
    		}, 300);
    	});
    });
}(jQuery));