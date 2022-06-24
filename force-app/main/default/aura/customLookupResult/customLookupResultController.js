({
   selectRecord : function(component, event, helper){     
    // get the selected record from list 
      var getSelectRecord = component.get("v.oRecord");
      var getRecordId = component.get("v.RecId");
       console.log('11111111' + getSelectRecord);
       console.log('lovelove' + getRecordId);
    // call the event  
      var compEvent = component.getEvent("oSelectedRecordEvent");
    // set the Selected sObject Record to the event attribute. 
         compEvent.setParams({"recordByEvent" : getSelectRecord }); 
      	 compEvent.setParams({"recordById" : getRecordId });
    // fire the event 
         compEvent.fire();
    }
})