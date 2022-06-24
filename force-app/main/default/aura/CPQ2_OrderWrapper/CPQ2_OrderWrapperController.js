/**
 * Created by timothychiang on 2020-05-08.
 */

({
	/**
	 * init function
	 *
	 */
	init: function(component, event, helper) {
		//
		helper.getRecordId(component);
	},

	reInit: function(component, event, helper) {
		$A.get('e.force:refreshView').fire();
		helper.getRecordId(component);
	},

	handleClose: function(component, event, helper) {
		helper.closeAction(component);
	},
});