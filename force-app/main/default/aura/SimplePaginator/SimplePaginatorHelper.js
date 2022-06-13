({
	updatePage : function(component, pg) {
        var updatePageEvt = $A.get("e.c:updatePageEvt");
        updatePageEvt.setParams({
            "currPage" : pg 
        });
        
        updatePageEvt.fire();
	},
    
    setPages : function(component) {
        var numPages = component.get('v.numPages');
        var pgs = [];
        
        for (var x = 0; x < numPages; x++) {
            pgs[x] = x + 1;
        }
        
        component.set('v.pgs', pgs);
    }
})