/**
 * Created by timothychiang on 2020-04-20.
 */

import { track, api } from 'lwc';

import BaseComponent from 'c/baseComponent';

export default class Cpq2SummaryViewRow extends BaseComponent {
	@api lineItem;
	@api tableType;
	@api frequencyMap;

	get isService(){
		return this.rowType===this.PRODUCT_ITEM_TYPE_SERVICE;
	}

	get showPestFields(){
		return this.lineItem.productInfo.priceBookEntry.Product2.CPQ2_Enable_Additional_Pest_Fields__c;
	}

	get frequency(){
		let frequencyString;

		if(this.tableType === this.TABLE_TYPE_FEE || this.tableType === this.TABLE_TYPE_PURCHASE){
			frequencyString = 'One-Time';
		} else {
			frequencyString = this.lineItem.frequency;
		}

		return frequencyString;
	}

	get isPartOfPriceModel() {
		return (this.lineItem.productInfo.priceBookEntry.Product2.CPQ_Price_Model__c === this.CPQ2_HYGIENE_PRICE_MODEL);
	}

	get rowType(){
		return this.lineItem.productInfo.priceBookEntry.Product2.Item_Type__c;
	}

	get productUnit(){
		if (this.rowType===this.PRODUCT_ITEM_TYPE_SERVICE){
			return this.PRODUCT_ITEM_TYPE_SERVICE.toUpperCase();
		} else {
			return this.lineItem.productInfo.priceBookEntry.Product2.Unit__c;
		}
	}

	get total() {
		return this.calculateTotal(this.lineItem, this.frequencyMap, this.tableType);
	}

	get price() {
		if(this.tableType === this.TABLE_TYPE_FEE){
			return this.lineItem.installationPrice;
		} else {
			if (this.rowType===this.PRODUCT_ITEM_TYPE_SERVICE){
				return this.lineItem.servicePrice;
			} else {
				return this.lineItem.purchasePrice;
			}
		}

	}

	get productInfo(){
		return this.lineItem.productInfo.priceBookEntry.Product2;
	}

	get pricebookInfo(){
		return this.lineItem.productInfo.priceBookEntry;
	}

	get isRefreshNeeded(){
		return !!!this.lineItem.lineScore;
	}

	get scoreVariant(){
		if(this.lineItem.lineScore === 'Green'){
			return 'success';
		} else if(this.lineItem.lineScore === 'Yellow'){
			return 'warning';
		} else {
			return 'error';
		}
	}
}