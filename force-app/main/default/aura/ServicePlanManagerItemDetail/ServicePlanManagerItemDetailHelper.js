/**
 * @FileName: ServicePlanManagerItemDetailHelper.js
 * @Description: Helper methods for ServicePlanManagerItemDetail
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       12/6/2019         Created
 *-----------------------------------------------------------  
 */
({
    selectAll : function(component, event) {
        LightningUtils.selectAll(component, event);
    },

    confirm : function(component) {
        let servicePlanId = component.get("v.servicePlanId");

        let asset = component.get("v.asset");

        asset.selected = false;
        asset.selectedQuantity = 0;

        for(let itemWrapper of asset.items) {
            if(itemWrapper.selected) {
                itemWrapper.servicePlanId = servicePlanId;
                asset.selectedQuantity += itemWrapper.quantity;

                // if any item is selected, set the asset to selected
                if(!asset.selected) asset.selected = true;
            } else {
                itemWrapper.servicePlanId = null;
            }
        }

        let evt = component.getEvent("ServicePlanManagerItemDetailConfirm");
        evt.setParams({
            "asset" : asset
        });
        evt.fire();

        this.cancel(component);
    },

    cancel : function(component) {
        component.destroy();
    }
});