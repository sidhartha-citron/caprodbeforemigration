/**
 * Created by timothychiang on 2020-05-08.
 */

import {api, track} from 'lwc';

import getInitData from '@salesforce/apex/CPQ2_ScreenController.getInitData';
import getNewLine from '@salesforce/apex/CPQ2_ScreenController.getNewLineItem';
import saveChanges from '@salesforce/apex/CPQ2_ScreenController.saveChanges';
import getShipToScore from '@salesforce/apex/CPQ2_ScreenController.calculateShipToScore';
import validateOrder from '@salesforce/apex/CPQ2_ScreenController.validateOrder';

import BaseComponent from 'c/baseComponent';

export default class Cpq2OrderScreen extends BaseComponent {
	@api recordId = '';
	@api returnRecordId = '';
	@api objectApiName ='';
	@track priceBookEntry = '';
	@track result;
	@track frequency;
	@track cpqSettings;
	@track mapLineItems = {};
	@track permissions;

	@track listLineItemsServices = [];
	@track listLineItemsConsumables = [];
	@track listLineItemsEquipment = [];
	@track listCATMultiplier = [];
    @track listScoreMultiplier = [];

	@track showExistingServices = false;
	@track error;

	@track isLoading = false;
	@track spinnerMessage = 'Processing...';
	@track isErrorFound = false;
	@track isAllValid = true;
	@track isServiceValid = true;
	@track isConsumableValid = true;
	@track isEquipmentValid = true;
	@track isServiceError = false;
	@track isConsumableError = false;
	@track isEquipmentError = false;
	@track shipToScore;
	@track showSummary = false;

	// I think there should be a more graceful way to handle exist (mainly to use a callback function)
	// but I don't know how to do that.
	flagForExit;

	get showServiceTabError(){
		return (this.isServiceError || !this.isServiceValid);
	}

	get showConsumableTabError(){
		return (this.isConsumableError || !this.isConsumableValid);
	}

	get showEquipmentTabError(){
		return (this.isEquipmentError || !this.isEquipmentValid);
	}

	handleInit() {
		console.log('running *** : ' + this.recordId);
		this.isLoading = true;
		getInitData({targetId : this.recordId})
			.then(result => {
				console.log(JSON.stringify(result.entity.accountItem));
				this.result = JSON.parse(JSON.stringify(result.entity));
				this.frequency = JSON.parse(JSON.stringify(result.customSettings.frequencyMap));
				this.cpqSettings = JSON.parse(JSON.stringify(result.customSettings.cpqSettings));
				this.permissions = JSON.parse(JSON.stringify(result.screenPermissions));
				this.listCATMultiplier = JSON.parse(JSON.stringify(result.categoryMultiplier));
                this.listScoreMultiplier = JSON.parse(JSON.stringify(result.scoreMultiplier));
				this.formProductLists();
				this.handleGetShipToScore();
				this.showSummary = true;
				this.error = undefined;
			})
			.catch(error => {
				this.error = error;
				this.result = undefined;
				this.frequency = undefined;
				this.cpqSettings = undefined;
				this.handleError(error);
			})
			.finally(() => { this.isLoading = false; });
	}

	connectedCallback() {
		// initialize component
		this.handleInit();
	}

	handleOpenExistingServices() {
		this.showExistingServices = true;
	}

	handleCloseExistingServices() {
		this.showExistingServices = false;
	}

	get serviceLabel(){
		let label = this.PRODUCT_ITEM_TYPE_SERVICE;
		if(this.listLineItemsServices.length > 0){
			label += ' (' + this.listLineItemsServices.length + ')';
		}
		return label;
	}

	get consumablesLabel(){
		let label = this.PRODUCT_ITEM_TYPE_CONSUMABLES;
		if(this.listLineItemsConsumables.length > 0){
			label += ' (' + this.listLineItemsConsumables.length + ')';
		}
		return label;
	}

	get equipmentLabel(){
		let label = this.PRODUCT_ITEM_TYPE_EQUIPMENT;
		if(this.listLineItemsEquipment.length > 0){
			label += ' (' + this.listLineItemsEquipment.length + ')';
		}
		return label;
	}

	get showServiceTable(){
		return this.listLineItemsServices.length > 0;
	}

	get showConsumablesTable(){
		return this.listLineItemsConsumables.length > 0;
	}

	get showEquipmentTable(){
		return this.listLineItemsEquipment.length > 0;
	}

	get headerTitle() {
		return this.result.header.orderNumber;
	}

	handleProductAdd(event){
		let productId = event.detail.value;
		let quantity = event.detail.quantity;
		this.handleGetNewLine(productId, quantity);
	}

	handleGetNewLine(productId, quantity) {

		if(this.isHandleConsumableOrEquipmentAlreadyExists(productId)){
			this.fireToast('Target Consumable already exists in list.',
				'Please check your product lists..',
				'warning');
			return;
		}

		this.isLoading = true;
		getNewLine({
			productId: productId,
			pricebookId: this.result.header.priceBookId,
			targetId: this.result.header.id,
			accountId: this.result.header.accountId,
			quantity: quantity
		})
			.then(result => {
				this.handleNewLineResult(result);
			})
			.catch(error => {
				this.handleError(error);
				return undefined;
			})
			.finally(() => { this.isLoading = false; });
	}

	handleNewLineResult(result){
		let lineItems = JSON.parse(JSON.stringify(result));
		console.log('***' + JSON.stringify(lineItems));
		for(let i = 0; i < lineItems.length; i++) {
			this.result.lineItems.push(lineItems[i]);
			this.addLineToProductLists(lineItems[i]);
		}

		this.handleNewLineStaleScore(lineItems[0]);

		this.fireToast('Item Added',
				'Line Item has been successfully added',
				'success');
		return JSON.parse(JSON.stringify(result));
	}

	isHandleConsumableOrEquipmentAlreadyExists(productId){
		let isFound = false;
		/* CPQCN-481 Removing this check 20201215 */
		/*
		for(let i=0; i< this.listLineItemsConsumables.length; i++){
			if(this.listLineItemsConsumables[i].productId === productId){
				isFound = true;
				break;
			}
		}
		*/
		return isFound;
	}

	handleRefresh(event){
		if(this.handleValidation()){
			this.handleGetShipToScore();
		}
	}

	handleNewLineStaleScore(lineItem){
		// if(lineItem.productInfo.priceBookEntry.Product2.CPQ_Price_Model__c === this.CPQ2_HYGIENE_PRICE_MODEL){
		//     this.handleSetParentStale();
		// }
		this.handleSetParentStale();
	}

	handleGetShipToScore() {
		this.isLoading = true;

		getShipToScore({
			entity: JSON.stringify(this.result)
		})
			.then(result => {
				let entity = JSON.parse(JSON.stringify(result));
				this.processShipToScore(entity);
			})
			.catch(error => {
				this.handleError(error);
				return undefined;
			})
			.finally(() => { this.isLoading = false; });
	}

	processShipToScore(entity){
		this.shipToScore = entity.shipToDealScore;
		this.result.header = entity.header;
		this.result.accountItem = entity.accountItem;
		for(let i=0;i<entity.lineItems.length;i++){
			let lineItem = entity.lineItems[i];
			this.mapLineItems[lineItem.key].lineScore = lineItem.lineScore;
		}
	}

	handleBack(){
		if(confirm("Do you really want to leave? Changes you made may not be saved.")) {
			let returnId = (this.returnRecordId)?this.returnRecordId:this.recordId;
			this.navigateToRecord(returnId);
		}
	}

	handBackAfterSave() {
        let returnId = (this.returnRecordId)?this.returnRecordId:this.recordId;
        this.navigateToRecord(returnId); 
    }

	handleSave(){
		this.removeAllResults();
		if(this.handleValidation()){
			if(this.isLoading === false) {
				this.isLoading = true;

				this.handleServiceEquipmentSplitByQty();				
				//this.handleValidateOrder(this.handleSaveEverything.bind(this));
			}
		}
	}

	// Split any Service and Equipment Line Items with more than 1 as quantity as separate line items (CPQCN-373)
	// 2020-12-03 CPQCN-450 Now Consumables too
	handleServiceEquipmentSplitByQty() {
		let initialQuantity = this.result.lineItems.length;
		let initialSizeService = this.listLineItemsServices.length;
		let initialSizeEquipment = this.listLineItemsEquipment.length;
		let initialSizeConsumables = this.listLineItemsConsumables.length;
		let callOutMade = false;
		let counter = 0;
		let totalCallOutsNeeded = 0;
		let indexOfItemsToRemoveService = [];
		let indexOfItemsToRemoveEquipment = [];
		let indexOfItemsToRemoveConsumables = [];
		let indexOfItemsToRemoveResults = [];

		for(let k=0;k<initialQuantity;k++){
			let lineItem = this.result.lineItems[k];
			let productType = lineItem.productInfo.priceBookEntry.Product2.Item_Type__c;
			if(lineItem.quantity > 1 && (productType === this.PRODUCT_ITEM_TYPE_SERVICE || productType === this.PRODUCT_ITEM_TYPE_EQUIPMENT || productType === this.PRODUCT_ITEM_TYPE_CONSUMABLES)) {
				totalCallOutsNeeded++;
			}
		}

		for(let i=0;i<initialQuantity;i++){
			let lineItem = this.result.lineItems[i];
			
			if(lineItem.quantity > 1) {
				let productType = lineItem.productInfo.priceBookEntry.Product2.Item_Type__c;
				let quantity = lineItem.quantity;
				if(productType === this.PRODUCT_ITEM_TYPE_SERVICE || productType === this.PRODUCT_ITEM_TYPE_EQUIPMENT || productType === this.PRODUCT_ITEM_TYPE_CONSUMABLES){
					callOutMade = true;
					getNewLine({
						productId: lineItem.productId,
						pricebookId: this.result.header.priceBookId,
						targetId: this.result.header.id,
						accountId: this.result.header.accountId,
						quantity: quantity
					})
						.then(result => {
							counter++;
							this.handleNewLineResultForSplit(result, lineItem);
						})
						.catch(error => {
							this.handleError(error);
							return undefined;
						})
						.finally(() => { 
							lineItem.quantity = 1;

							indexOfItemsToRemoveResults.push(i);
							
							for(let s = 0; s < initialSizeService; s++) {
								if(this.listLineItemsServices[s].key === lineItem.key) {
									indexOfItemsToRemoveService.push(s);
								}
							}

							for(let e = 0; e < initialSizeEquipment; e++) {
								if(this.listLineItemsEquipment[e].key === lineItem.key) {
									indexOfItemsToRemoveEquipment.push(e);
								}
							}

							for(let c = 0; c < initialSizeConsumables; c++) {
								if(this.listLineItemsConsumables[c].key === lineItem.key) {
									indexOfItemsToRemoveConsumables.push(c);
								}
							}
							
							if(counter === totalCallOutsNeeded) {
								indexOfItemsToRemoveService.sort(function(a, b){return b-a});
								indexOfItemsToRemoveEquipment.sort(function(a, b){return b-a});
								indexOfItemsToRemoveConsumables.sort(function(a, b){return b-a});
								indexOfItemsToRemoveResults.sort(function(a, b){return b-a});

								for(let s = 0; s < indexOfItemsToRemoveService.length; s++) {
									this.listLineItemsServices.splice(indexOfItemsToRemoveService[s], 1);
								}

								for(let e = 0; e < indexOfItemsToRemoveEquipment.length; e++) {
									this.listLineItemsEquipment.splice(indexOfItemsToRemoveEquipment[e], 1);
								}

								for(let c = 0; c < indexOfItemsToRemoveConsumables.length; c++) {
									this.listLineItemsConsumables.splice(indexOfItemsToRemoveConsumables[c], 1);
								}

								for(let r = 0; r < indexOfItemsToRemoveResults.length; r++) {
									this.result.lineItems.splice(indexOfItemsToRemoveResults[r], 1);
								}
								this.handleValidateOrder(this.handleSaveEverything.bind(this));
							}
						});
				} 
			}
		}
		if(!callOutMade) {
			console.log('No split required...ready to do do more work');
			this.handleValidateOrder(this.handleSaveEverything.bind(this));
		}
	}

	handleNewLineResultForSplit(result, lineItem){
		let lineItems = JSON.parse(JSON.stringify(result));
		console.log('***' + JSON.stringify(lineItems));
		for(let i = 0; i < lineItems.length; i++) {
			lineItems[i].quantity = 1;
			lineItems[i].frequency = lineItem.frequency;
			lineItems[i].purchasePrice = lineItem.purchasePrice;
			lineItems[i].servicePrice = lineItem.servicePrice;
			lineItems[i].installationStatus = lineItem.installationStatus;
			lineItems[i].installationPrice = lineItem.installationPrice;
			if(lineItem.installationPrice){
				lineItems[i].installTotal = lineItem.installationPrice * 1;
			} else {
				lineItems[i].installTotal = undefined;
			}
			//lineItems[i].installTotal = lineItem.installTotal;
			lineItems[i].relatedProduct = lineItem.relatedProduct;
			lineItems[i].relatedProductName = lineItem.relatedProductName;
			lineItems[i].isActive = lineItem.isActive;
			lineItems[i].requestedPriceApproved = lineItem.requestedPriceApproved;
			lineItems[i].requestedPrice = lineItem.requestedPrice;
			lineItems[i].serviceNotes = lineItem.serviceNotes;
			lineItems[i].areaOfCoverage = lineItem.areaOfCoverage;
			lineItems[i].areaOfCoverageOther = lineItem.areaOfCoverageOther;
			lineItems[i].coveredPests = lineItem.coveredPests;
			lineItems[i].coveredPestsOther = lineItem.coveredPestsOther;
			lineItems[i].bypassInactive = lineItem.bypassInactive;
			lineItems[i].description = lineItem.description;

			this.result.lineItems.push(lineItems[i]);
			this.addLineToProductLists(lineItems[i]);
		}
	
		this.handleNewLineStaleScore(lineItems[0]);
		return JSON.parse(JSON.stringify(result));
	}	

	handleSaveAndClose(){
		this.removeAllResults();
		if(this.handleValidation()){
			this.flagForExit = true;

			if(this.isLoading === false) {
				this.isLoading = true;
				this.handleServiceEquipmentSplitByQty();
			
				//this.handleValidateOrder(this.handleSaveEverything.bind(this));
			}
		}
	}

	handleValidateOrder(afterValidate){
		//this.isLoading = true;
		validateOrder({
			entity: JSON.stringify(this.result)
		})
			.then(result => {
				console.log(JSON.stringify(result));
				if(result.isSuccess){
					console.log('SUCCESS');
					afterValidate();
				} else {
					this.isLoading = false;
					this.fireToast('Errors were encountered while validating the order',
						'Please check the order item configuration. It is currently of an invalid configuration.',
						'error');

					// this.fireToastWithUrl('Errors were encountered while validating the order',
					// 	'Please check the order item configuration. It is currently of an invalid configuration. You can find more details {0}',
					// 	'http://www.google.com/',
					// 	'here',
					// 	'error');
				}
			})
			.catch(error => {
				this.handleError(error);
				this.isLoading = false;
			});
	}

	handleSaveEverything(){
		saveChanges({
			lineItems: JSON.stringify(this.result.lineItems)
		})
			.then(result => {
				console.log(JSON.stringify(result));
				
				this.handleSaveResults(result);
				if(this.flagForExit && !this.isErrorFound){
					this.handBackAfterSave();
				} else {
					this.handleGetShipToScore();
				}
				//2021-03-22 https://trello.com/c/WG03QJkY refresh data from SF
				if (!this.isErrorFound){
					this.handleInit();
				}
			})
			.catch(error => {
				this.handleError(error);
			})
			.finally(() => { this.isLoading = false; this.flagForExit = false;});
	}

	removeAllResults(){

		this.isServiceError = false;
		this.isConsumableError = false;
		this.isEquipmentError = false;

		for(let i=0;i<this.result.lineItems.length;i++){
			this.result.lineItems[i].dmlResult = undefined;
		}
	}

	handleSaveResults(results){
		this.isErrorFound = false;

		for(let j=0;j<results.length;j++){
			if(!results[j].isSuccess){
				this.isErrorFound = true;
			}
		}

		for(let i=0;i<results.length;i++){
			let currentResult = results[i];
			let key = currentResult.key;
			let childKey = currentResult.childKey;

			if(key in this.mapLineItems){
				let lineItem = this.mapLineItems[key];
				if(lineItem.dmlResult){
					lineItem.dmlResult = this.mergeResult(lineItem.dmlResult, currentResult);
				} else {
					lineItem.dmlResult = currentResult;
				}

				if(!this.isErrorFound){
					this.handleInsertSuccess(currentResult, lineItem)
					this.handleDeleteSuccess(currentResult, lineItem)
				}
			}
		}

		if(this.isErrorFound){
			this.handleTabErrorStatus();
			this.fireToast('Errors were encountered while saving records',
				'Please check each line item to resolve issues.',
				'error');
		} else {
			this.fireToast('Save Success',
				'Line Items have been successfully saved',
				'success')			
		}
	}

	handleDeleteSuccess(currentResult, lineItem) {
		if(currentResult.action === 'Delete') {

			if(parseInt(lineItem.quantity) !== 0){
				let entityIndex = this.result.lineItems.indexOf(lineItem);
				if (entityIndex > -1) {
					this.result.lineItems.splice(entityIndex, 1);
				}
				//this.result.lineItems = this.filterOutKey(this.result.lineItems,lineItem.key);
			}

		}
	}

	handleInsertSuccess(currentResult, lineItem){
		if(currentResult.action === 'Insert') {
			lineItem.id = currentResult.recordId;
		}
	}

	mergeResult(resultA, resultB){
		resultA.isSuccess = resultA.isSuccess && resultB.isSuccess;
		if(!resultA.recordId){
			resultA.recordId = resultB.recordId;
		}

		if(resultA.isSuccess){
			resultA.objectName = resultB.objectName;
			resultA.action = resultB.action;
		}
		resultA.errors.concat(resultB.errors);

		return resultA;
	}

	handleTabErrorStatus(){
		this.isServiceError = false;
		this.isConsumableError = false;
		this.isEquipmentError = false;

		for(let i=0; i < this.listLineItemsServices.length;i++){
			if(this.listLineItemsServices[i].dmlResult){
				if(!this.listLineItemsServices[i].dmlResult.isSuccess) {
					this.isServiceError = true;
					break;
				}
			}
		}

		for(let j=0; j < this.listLineItemsConsumables.length;j++){
			if(this.listLineItemsConsumables[j].dmlResult){
				if(!this.listLineItemsConsumables[j].dmlResult.isSuccess) {
					this.isConsumableError = true;
					break;
				}
			}
		}

		for(let k=0; k < this.listLineItemsEquipment.length;k++){
			if(this.listLineItemsEquipment[k].dmlResult){
				if(!this.listLineItemsEquipment[k].dmlResult.isSuccess) {
					this.isEquipmentError = true;
					break;
				}
			}
		}
	}

	addLineToProductLists(lineItem){
		let productType = lineItem.productInfo.priceBookEntry.Product2.Item_Type__c;

		this.mapLineItems[lineItem.key]=lineItem;

		if(productType===this.PRODUCT_ITEM_TYPE_SERVICE){
			this.listLineItemsServices = [...this.listLineItemsServices, lineItem];
		} else if(productType===this.PRODUCT_ITEM_TYPE_CONSUMABLES){
			this.listLineItemsConsumables = [...this.listLineItemsConsumables, lineItem];
		} else if(productType===this.PRODUCT_ITEM_TYPE_EQUIPMENT) {
			this.listLineItemsEquipment = [...this.listLineItemsEquipment, lineItem];
		}
	}

	formProductLists(){
		this.listLineItemsServices = [];
		this.listLineItemsConsumables = [];
		this.listLineItemsEquipment = [];

		for(let i=0; i < this.result.lineItems.length;i++){
			this.addLineToProductLists(this.result.lineItems[i]);
		}
	}

	handleServiceChange(event){
		let key = event.detail.key;
		let lineItem = this.mapLineItems[key];
		lineItem.quantity = event.detail.quantity;
		lineItem.frequency = event.detail.frequency;
		lineItem.servicePrice = event.detail.servicePrice;
		lineItem.installationStatus = event.detail.installationStatus;
		lineItem.installationPrice = event.detail.installationPrice;
		lineItem.installTotal = event.detail.installTotal;
		lineItem.relatedProduct = event.detail.relatedProduct;
		lineItem.relatedProductName = event.detail.relatedProductName;
		lineItem.isActive = event.detail.active;
		lineItem.requestedPriceApproved = event.detail.requestedPriceApproved;
		lineItem.requestedPrice = event.detail.requestedPrice;
		lineItem.serviceNotes = event.detail.serviceNotes;
		lineItem.areaOfCoverage = event.detail.areaOfCoverage;
		lineItem.areaOfCoverageOther = event.detail.areaOfCoverageOther;
		lineItem.coveredPests = event.detail.coveredPests;
		lineItem.coveredPestsOther = event.detail.coveredPestsOther;
		lineItem.bypassInactive = !event.detail.active;

	}

	handleConsumablesChange(event){
		let key = event.detail.key;
		let lineItem = this.mapLineItems[key];
		lineItem.quantity = event.detail.quantity;
		lineItem.frequency = event.detail.frequency;
		lineItem.purchasePrice = event.detail.purchasePrice;
		lineItem.description = event.detail.lineNotes;
		// lineItem.installationStatus = 'Install';
		// lineItem.installationPrice = 0;
		lineItem.isActive = event.detail.active;
		lineItem.requestedPriceApproved = event.detail.requestedPriceApproved;
		lineItem.requestedPrice = event.detail.requestedPrice;
		lineItem.bypassInactive = !event.detail.active;
	}

	handleEquipmentChange(event){
		let key = event.detail.key;
		let lineItem = this.mapLineItems[key];
		lineItem.frequency = 'One-Time';
		lineItem.quantity = event.detail.quantity;
		lineItem.purchasePrice = event.detail.purchasePrice;
		lineItem.description = event.detail.lineNotes;
		lineItem.installationStatus = event.detail.installationStatus;
		lineItem.installationPrice = event.detail.installationPrice;
		lineItem.installTotal = event.detail.installTotal;
		lineItem.isActive = event.detail.active;
		lineItem.requestedPriceApproved = event.detail.requestedPriceApproved;
		lineItem.requestedPrice = event.detail.requestedPrice;
		lineItem.bypassInactive = !event.detail.active;
	}

	deleteLineItem(key){
		let lineItem = this.mapLineItems[key];

		//mark the item as deleted
		lineItem.isDeleted = true;

		let productType = lineItem.productInfo.priceBookEntry.Product2.Item_Type__c;

		if(productType===this.PRODUCT_ITEM_TYPE_SERVICE){
			this.listLineItemsServices = this.filterOutKey(this.listLineItemsServices,lineItem.key);
		} else if(productType===this.PRODUCT_ITEM_TYPE_CONSUMABLES){
			this.listLineItemsConsumables = this.filterOutKey(this.listLineItemsConsumables,lineItem.key);
		} else if(productType===this.PRODUCT_ITEM_TYPE_EQUIPMENT) {
			this.listLineItemsEquipment = this.filterOutKey(this.listLineItemsEquipment,lineItem.key);
		}
	}

	filterOutKey(targetArray, key){
		return targetArray.filter(function (element) {
			return element.key !== key;
		}, this);
	}

	handleDeleteLine(event){
		if(event.detail.partOfPriceModel){
			this.shipToScore = undefined;
		}

		let key = event.detail.key;
		this.deleteLineItem(key);
	}

	handleValidation(){
		this.isValid = true;
		this.isServiceValid = true;
		this.isConsumableValid = true;
		this.isEquipmentValid = true;

		if(this.template.querySelector('.serviceTable')){
			this.isServiceValid = this.template.querySelector('.serviceTable').isValid;
		}

		if(this.template.querySelector('.consumableTable')){
			this.isConsumableValid = this.template.querySelector('.consumableTable').isValid;
		}

		if(this.template.querySelector('.equipmentTable')){
			this.isEquipmentValid = this.template.querySelector('.equipmentTable').isValid;
		}

		this.isAllValid = this.isServiceValid && this.isConsumableValid && this.isEquipmentValid;

		if (this.isAllValid) {
			//Submit information on Server
		} else {
			this.fireToast('Validation Errors',
				'Validation Errors Encountered, Please check each line item to resolve issues.',
				'error');
		}

		return this.isAllValid;
	}

	handleSetStaleScore(event){
		this.handleSetParentStale();
		this.mapLineItems[event.detail.value].lineScore = undefined;
	}

	handleSetParentStale(){
		this.shipToScore = undefined;
	}

	get accountShiComplete(){
		if(this.result.accountItem!=null){
			if(this.result.accountItem.shipComplete!=null){
				return this.result.accountItem.shipComplete;
			}
		}
		return false;
	}

}