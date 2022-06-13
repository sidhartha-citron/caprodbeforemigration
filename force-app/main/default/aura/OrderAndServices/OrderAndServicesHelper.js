({
    getSummary : function(component, event, helper) {
        this.callAction(component, 'c.loadViewData', {
            'accountId': component.get('v.recordId')
        }, function (data) {
            if(data){
                console.log(data);
                component.set('v.viewData', data);
                component.set('v.isLoaded', true);
            } 
        });
    }
})