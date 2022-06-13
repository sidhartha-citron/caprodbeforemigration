({
    setTargetRecordId: function(component, event, helper) {
        console.log('targetId ' + component.get("v.recordId"));
        helper.callAction( component, 'c.getDestinationId', {
            'targetId' : component.get("v.recordId")
        }, function( data ) {
            console.log('test ' + JSON.stringify(data));
            let newId = data.returnId;
            console.log('test ' + newId);
            component.set('v.targetRecordId', newId);
            component.set('v.isQuoteSyncCheckFailed', data.isQuoteSyncCheckFailed);
        });
    },

})