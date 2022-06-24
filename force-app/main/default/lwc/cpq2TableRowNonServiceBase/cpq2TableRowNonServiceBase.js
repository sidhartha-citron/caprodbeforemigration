/**
 * Created by timothychiang on 2020-04-17.
 */

import { api, track } from "lwc";

import Cpq2TableRowBase from "c/cpq2TableRowBase";

export default class Cpq2TableRowNonServiceBase extends Cpq2TableRowBase {

	privateIsCoreListPrice = false;
	privateQuantity;
	privatePurchasePrice;
	privateCoreListPrice;

	@api coreListPriceLobList = [];
	@track lineNotes;
	@track isCoreListPriceAlreadyExists = false;
	@track isLineItemFieldsDisabled = false;
	@track isPurchasePriceRequired = false;

	get requestedCoreListPrice(){
		return this.privateCoreListPrice;
	}

	set requestedCoreListPrice(value){
		this.privateCoreListPrice = value;
		this.handleShipToScoreStale();
	}

	get purchasePrice(){
		return this.privatePurchasePrice;
	}

	set purchasePrice(value){
		this.privatePurchasePrice = value;
		this.handleShipToScoreStale();
	}

	get isCoreListSubmittedDisabled(){
		let disabled = false;

		if(this.isCoreListPriceAlreadyExists){
			disabled = true;
		} else if(!this.coreListPriceLobList.includes(this.lineItem.productInfo.priceBookEntry.Product2.Family)){
			disabled = true;
		}

		return disabled;
	}

	get showDiscount(){
		return (this.discount > 0);
	}

	get discount(){
		if(this.lineItem.productInfo.priceBookEntry.UnitPrice && this.purchasePrice && this.purchasePrice !==0){
			return (this.lineItem.productInfo.priceBookEntry.UnitPrice - this.purchasePrice)/this.lineItem.productInfo.priceBookEntry.UnitPrice;
		} else {
			return undefined;
		}
	}

	get showCoreListDiscount(){
		return (this.discountCoreList > 0);
	}

	get discountCoreList(){
		if(this.lineItem.productInfo.priceBookEntry.UnitPrice && this.requestedCoreListPrice && this.requestedCoreListPrice !==0){
			return (this.lineItem.productInfo.priceBookEntry.UnitPrice - this.requestedCoreListPrice)/this.lineItem.productInfo.priceBookEntry.UnitPrice;
		} else {
			return undefined;
		}
	}


	get totalPrice(){
		return this.privateQuantity*this.purchasePrice;
	}

	get quantityAvailable(){
		if(this.priceItemInfo){
			return this.priceItemInfo.Quantity_Available__c;
		} else {
			return undefined;
		}
	}

	get isCoreListSubmitted(){
		return this.privateIsCoreListPrice;
	}

	set isCoreListSubmitted(value) {
		this.privateIsCoreListPrice = value;
		this.handleShipToScoreStale();
	}

	get isCoreListPriceDisabled() {
		return (!this.isCoreListSubmitted);
	}

	get existingPrice(){
		let price;

		if(this.lineItem.productInfo.contractPriceSummary){
			price = this.lineItem.productInfo.contractPriceSummary.lowestApplicablePrice;
		} else {
			price = this.lineItem.productInfo.priceBookEntry.UnitPrice;
		}

		return price;
	}

	get productInfo(){
		return this.lineItem.productInfo.priceBookEntry.Product2;
	}

	get pricebookInfo(){
		return this.lineItem.productInfo.priceBookEntry;
	}

	get priceItemInfo(){
		return this.lineItem.productInfo.productItem;
	}


	calculateExistingPrice(){
		let price;

		if(this.lineItem.productInfo.contractPriceSummary){
			price = this.lineItem.productInfo.contractPriceSummary.lowestApplicablePrice;
		} else {
			price = this.lineItem.productInfo.priceBookEntry.UnitPrice;
		}

		return price;
	}
}