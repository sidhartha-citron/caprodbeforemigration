/**
 * Created by timothychiang on 2020-04-13.
 */

import { api, track } from "lwc";

import Cpq2TableRowNonServiceBase from "c/cpq2TableRowNonServiceBase";
export default class Cpq2TableRowEquipment extends Cpq2TableRowNonServiceBase {

	@track installationStatus;
	@track installationPrice;
	@track installTotal;
	@track isInstallationStatusDisabled = false;

	get quantity(){
		return this.privateQuantity;
	}

	set quantity(value){
		this.privateQuantity = value;
		if(this.privateQuantity < 1){
			this.installationStatus = '';
			this.installationPrice = undefined;
			this.installTotal = undefined;
			this.isInstallationStatusDisabled = true;
			this.isLineItemFieldsDisabled = true;
			this.isPurchasePriceRequired = false;
			this.isPartOfPriceModel = false;
		} else {
			this.isInstallationStatusDisabled = false;
			this.isPurchasePriceRequired = true;
			this.isLineItemFieldsDisabled = false;
			this.isPartOfPriceModel = true;
		}
	}

	get isInstallationPriceRequired(){
		return !!this.installationStatus;
	}

	get isInstallationPriceReadOnly(){
		return !!!this.installationStatus;
	}

	connectedCallback(){
		this.isPartOfPriceModel = true;
		this.privateHandleChange = this.handleChange.bind(this);
		this.privateGenericOnChangeFunctions.push(this.refreshInstall.bind(this));

		let hasDefaultBeenSet = false;

		this.isCoreListPriceAlreadyExists = (this.lineItem.productInfo.contractPriceSummary && this.lineItem.productInfo.contractPriceSummary);

		if(this.lineItem.purchasePrice!=null){
			this.privatePurchasePrice = this.lineItem.purchasePrice;
		} else {
			this.privatePurchasePrice = this.calculateExistingPrice();
			hasDefaultBeenSet = true;
		}

		if(this.lineItem.description){
			this.lineNotes = this.lineItem.description;
		}

		if(this.lineItem.isCoreListSubmitted){
			this.privateIsCoreListPrice = this.lineItem.isCoreListSubmitted;
		}
		//CPQCN-568 2021-01-18 Darcy
		if(this.lineItem.coreListPriceRequest.coreListPriceRequest.CPQ2_Requested_Price__c != null){
			this.privateCoreListPrice = this.lineItem.coreListPriceRequest.coreListPriceRequest.CPQ2_Requested_Price__c;
		} else {
			this.privateCoreListPrice = this.calculateExistingPrice();
		}

		if(this.lineItem.quantity){
			this.quantity = this.lineItem.quantity;
		} else {
			this.quantity = 0;
			hasDefaultBeenSet = true;
		}

		if(hasDefaultBeenSet){
			this.handleChange();
		}
		
		// CPQCN-484 Darcy 
		if(this.lineItem.installationStatus){
			this.installationStatus = this.lineItem.installationStatus;
		}

		if(this.lineItem.installationPrice || this.lineItem.installationPrice === 0){
			this.installationPrice = this.lineItem.installationPrice;
		}
	}

	installationStatusOnChange(event){

		this.installationStatus = event.detail.value;

		if(this.installationStatus === 'Install') {
			this.installationPrice = this.lineItem.productInfo.priceBookEntry.CPQ2_Installation_Unit_Price__c;
		} else if(this.installationStatus === 'Replace'){
			this.installationPrice = this.lineItem.productInfo.priceBookEntry.CPQ2_Replacement_Price__c;
		} else if(this.installationStatus === 'Remove'){
			this.installationPrice = this.lineItem.productInfo.priceBookEntry.CPQ2_Removal_Price__c;
		} else {
			this.installationPrice = null;
		}
		this.refreshInstall();
		this.handleChange();
	}

	refreshInstall(){
		if(this.installationPrice){
			this.installTotal = this.installationPrice * this.privateQuantity;
		} else {
			this.installTotal = undefined;
		}
	}

	handleChange() {
		const equipmentChangeEvent = new CustomEvent('linechange', {
			detail: {
				changeType: this.PRODUCT_ITEM_TYPE_EQUIPMENT,
				key: this.lineItem.key,
				quantity: this.quantity,
				purchasePrice: this.purchasePrice,
				lineNotes: this.lineNotes,
				installationStatus: this.installationStatus,
				installationPrice: this.installationPrice,
				installTotal: this.installTotal,
				isCoreListSubmitted: this.isCoreListSubmitted,
				coreListRequestedPrice: this.requestedCoreListPrice,
				isCoreListPriceAlreadyExists: this.isCoreListPriceAlreadyExists
			}
		});

		// Fire the custom event
		this.dispatchEvent(equipmentChangeEvent);
	}

}