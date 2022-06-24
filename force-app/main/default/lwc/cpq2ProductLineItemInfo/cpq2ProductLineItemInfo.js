/**
 * Created by timothychiang on 2020-04-23.
 */

import {api, track, LightningElement} from 'lwc';

import Cpq2TableRowBase from "c/cpq2TableRowBase";
export default class Cpq2ProductLineItemInfo extends Cpq2TableRowBase {

	@api disableLineScore = false;
	@api scoreType = 'normal'; // possible values are normal, coreList and lineItem

	get isRefreshNeeded(){
		return !!!this.lineItem.lineScore;
	}

	get productInfo(){
		return this.lineItem.productInfo.priceBookEntry.Product2;
	}

	get pricebookInfo(){
		return this.lineItem.productInfo.priceBookEntry;
	}

	// normal, coreList, lineItem
	get scoreVariant(){
		if(this.scoreType === 'normal' && this.lineItem.coreListThresholdTriggered !== null) {
			if((this.lineItem.lineScore === 'Red' && this.lineItem.quantity >= 1)|| this.lineItem.coreListThresholdTriggered === 2) {
				return 'error';
			}
			else if((this.lineItem.lineScore === 'Yellow' && this.lineItem.quantity >= 1) || this.lineItem.coreListThresholdTriggered === 1) {
				return 'warning';
			}
			else {
				return 'success';
			}
		}
		else if(this.scoreType === 'lineItem' || (this.scoreType === 'normal' && !this.lineItem.coreListThresholdTriggered)) {
			if(this.lineItem.lineScore === 'Green'){
				return 'success';
			} else if(this.lineItem.lineScore === 'Yellow'){
				return 'warning';
			} else {
				return 'error';
			}
		}
		else if(this.scoreType === 'coreList') {
			if(this.lineItem.coreListThresholdTriggered === 2) {
				return 'error';
			}
			else if(this.lineItem.coreListThresholdTriggered === 1) {
				return 'warning';
			}
			else {
				return 'success';
			}
		}				
	}


	get showScore(){
		if(this.disableLineScore){
			return false;
		}

		if(this.productInfo.CPQ_Price_Model__c === this.CPQ2_HYGIENE_PRICE_MODEL){
			return true;
		} else if (this.productInfo.Item_Type__c !== this.PRODUCT_ITEM_TYPE_SERVICE){
			if(this.lineItem.isRecurring){
				return false;
			} else {
				return (this.lineItem.quantity >= 1 || this.lineItem.coreListThresholdTriggered !== null);
			}
		} else {
			return false;
		}
	}
}