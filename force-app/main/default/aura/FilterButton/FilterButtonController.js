({
	addFilter : function(component, event, helper) {
        //var target = event.getSource();
        var target = component.find('theButton');
        var targetValue = target.get("v.value");
        var targetName = target.get("v.name");
        
        var iRecords = component.find('initRecords');
        var fRecords = component.find('fsRecords');
        var theSpinner = component.find('spinner');
        //$A.util.removeClass(theSpinner, 'slds-hide');
        
        var empty = false;
        var filterValues = component.get('v.theFilter') || [];
        var isChecked = targetName;
        console.log(filterValues.indexOf(targetValue));
        if(filterValues.indexOf(targetValue) != -1) {
            isChecked = false;
            $A.util.removeClass(target, 'slds-button--brand');
        } else {
            $A.util.addClass(target, 'slds-button--brand');
        }
        console.log('array length ' + filterValues.length + isChecked);
        
        if(isChecked && filterValues != null) {
            console.log('only if checked');
            console.log('filter Values before push ' + filterValues);
            filterValues.push(targetValue);
            component.set('v.theFilter', filterValues);
            console.log('filter Values after push ' + filterValues);
        } else if(!isChecked && filterValues != null) {
            console.log('if not checked');
            console.log('filterValues before splice ' + filterValues);
            var theIndex;
            theIndex = filterValues.indexOf(targetValue);
            filterValues.splice(theIndex,1);
            console.log(theIndex);
            console.log('filterValues after splice ' + filterValues);
            component.set('v.theFilter', filterValues);
            if(filterValues.length == 0) {
                empty = true;
            } 
        } 

        if(!empty) {
            console.log('filters present');
        	
            
        } else {
            $A.util.removeClass(iRecords, 'slds-hide');
            $A.util.addClass(fRecords, 'slds-hide');
            $A.util.addClass(theSpinner, 'slds-hide');
            console.log('filtersAbsent');
        }
        
        var filterEvent = component.getEvent("applyFilter");
        filterEvent.setParams({
            filterValues: filterValues
        }).fire();
	},
    
    toggleFilter : function(component){
        var button = component.find("theButton");
        $A.util.removeClass(button, 'slds-button--brand');
    }
})