({
// Infinite Scrolling logic care of Doug Ayers: https://github.com/DouglasCAyers/sfdc-lightning-data-tables-component/blob/master/src/aura/DataTableCmp/DataTableCmpRenderer.js   
//    MIT License

//Copyright (c) 2016 Doug Ayers

//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all
//copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//SOFTWARE.

    afterRender : function( component, helper ) {

        this.superAfterRender();

        // this is done in renderer because we don't get
        // access to the window element in the helper js.

        // per John Resig, we should not take action on every scroll event
        // as that has poor performance but rather we should take action periodically.
        // http://ejohn.org/blog/learning-from-twitter/

        var didScroll = false;

        component.find("initRecords").getElement().addEventListener("scroll", function() {
            didScroll = true;
        });

		console.log("didscroll " + didScroll);

        // periodically attach the scroll event listener
        // so that we aren't taking action for all events
        var scrollCheckIntervalId = setInterval( $A.getCallback( function() {

            // since this function is called asynchronously outside the component's lifecycle
            // we need to check if the component still exists before trying to do anything else
            if ( didScroll && component.isValid() ) {

                didScroll = false;
                // adapted from stackoverflow to detect when user has scrolled sufficiently to end of document
                // http://stackoverflow.com/questions/4841585/alternatives-to-jquery-endless-scrolling
                if ( window['scrollY'] >= document.body['scrollHeight'] - window['outerHeight'] - 100 ) {
                    var page = component.get("v.pageNum") || 1;
                    helper.pullOrderData(component, (page + 1), component.get("v.theFilter"), component.get("v.searchString"));
                }

            }

        }), 1000 );

        component.set( 'v.scrollCheckIntervalId', scrollCheckIntervalId );
		console.log(component.get('v.scrollCheckIntervalId'));
    },

    unrender : function( component, helper ) {

        this.superUnrender();

        var scrollCheckIntervalId = component.get( 'v.scrollCheckIntervalId' );

        if ( !$A.util.isUndefinedOrNull( scrollCheckIntervalId ) ) {
            window.clearInterval( scrollCheckIntervalId );
        }

    }
})