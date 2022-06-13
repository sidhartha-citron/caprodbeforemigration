import {api, track} from 'lwc';

import getInitData from '@salesforce/apex/CPQ2_ScreenController.getInitData';
import getNewLine from '@salesforce/apex/CPQ2_ScreenController.getNewLineItem';
import saveChanges from '@salesforce/apex/CPQ2_ScreenController.saveChanges';
import getShipToScore from '@salesforce/apex/CPQ2_ScreenController.calculateShipToScore';

import BaseComponent from 'c/baseComponent';

export default class Cpq2OpportunityScreen extends BaseComponent {

    @api recordId = '';
    @api returnRecordId = '';
    @api objectApiName ='';
    @track priceBookEntry = '';
    @track result;
    @track frequency;
    @track cpqSettings;
    @track coreListPriceLobList;
    @track mapLineItems = {};

    @track listLineItemsServices = [];
    @track listLineItemsConsumables = [];
    @track listLineItemsEquipment = [];
    @track listRecurringConsumables = [];
    @track listVmiProducts = [];
    @track listCoreListPriceRequest = [];
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
    @track isVmiServicePresent = false;
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
                console.log('*** : ' + this.recordId);
                console.log(JSON.stringify(result.entity));
                this.result = JSON.parse(JSON.stringify(result.entity));
                this.frequency = JSON.parse(JSON.stringify(result.customSettings.frequencyMap));
                this.cpqSettings = JSON.parse(JSON.stringify(result.customSettings.cpqSettings));
                this.coreListPriceLobList = JSON.parse(JSON.stringify(result.customSettings.coreListPriceLobList));
                this.listCATMultiplier = JSON.parse(JSON.stringify(result.categoryMultiplier));
                this.listScoreMultiplier = JSON.parse(JSON.stringify(result.scoreMultiplier));
                this.formProductLists();
                this.handleGetShipToScore();
                this.determineIfVmiServicePresent();
                this.showSummary = true;
                this.error = undefined;
            })
            .catch(error => {
                console.log('***' + error);
                this.error = error;
                this.result = undefined;
                this.frequency = undefined;
                this.cpqSettings = undefined;
                this.coreListPriceLobList = undefined;
                this.handleError(error);
            })
            .finally(() => { 
                console.log('***Finally***');
                this.isLoading = false; 
            });
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
        return this.result.header.name + ' - ' + this.result.header.type + ' - ' + this.result.header.headerDate;
    }

    handleProductAdd(event){
        let productId = event.detail.value;
		let quantity = event.detail.quantity;
        this.handleGetNewLine(productId, quantity);
    }

    handleGetNewLine(productId, quantity) {

        if(this.isHandleConsumableOrEquipmentAlreadyExists(productId)){
            this.fireToast('Target Consumable or Equipment already exists in list.',
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
        this.determineIfVmiServicePresent();

        this.fireToast('Item Added',
				'Line Item has been successfully added',
				'success');
		return JSON.parse(JSON.stringify(result));
    }

    isHandleConsumableOrEquipmentAlreadyExists(productId){
        let isFound = false;

        for(let i=0; i< this.listLineItemsConsumables.length; i++){
            if(this.listLineItemsConsumables[i].productId === productId){
                isFound = true;
                break;
            }
        }

        if(!isFound){
            for(let j=0; j< this.listLineItemsEquipment.length; j++){
                if(this.listLineItemsEquipment[j].productId === productId){
                    isFound = true;
                    break;
                }
            }
        }

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
            this.mapLineItems[lineItem.key].coreListThresholdTriggered = lineItem.coreListPriceRequest.coreListPriceRequest.CPQ2_Threshold_Triggered__c;
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
            this.handleSaveEverything();
        }
    }

    handleSaveAndClose(){
        this.removeAllResults();
        if(this.handleValidation()){
            this.flagForExit = true;
            this.handleSaveEverything();
        }
    }

    handleSaveEverything(){
        if(this.isLoading === false) {
            this.isLoading = true;

            console.log('*** ' + JSON.stringify(this.result.lineItems));
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
            let key = currentResult.key;
            let childKey = currentResult.childKey;
            
            if(currentResult.objectName === this.OBJECT_OPPORTUNITY_LINE_ITEM_NAME){
                if(key === childKey){
                    lineItem.id = undefined;    
                    if(parseInt(lineItem.quantity) !== 0){
                        let entityIndex = this.result.lineItems.indexOf(lineItem);
                        if (entityIndex > -1) {
                            this.result.lineItems.splice(entityIndex, 1);
                        }
                        //this.result.lineItems = this.filterOutKey(this.result.lineItems,lineItem.key);
                    }
                    //CPQCN-587 2021-01-19 should not reset these Id, they can exist without the opp line
                    /*
                    lineItem.vmiRequest.vmiRequest.Id = undefined;
                    lineItem.coreListPriceRequest.coreListPriceRequest.Id = undefined;
                    */
                } else {
                    lineItem.recurringItem.Id = undefined;  
                }
            } else if(currentResult.objectName === this.OBJECT_VMI_REQUEST_NAME){
                lineItem.vmiRequest.vmiRequest.Id = undefined;
            } else if(currentResult.objectName === this.OBJECT_CORE_LIST_PRICE_REQUEST_NAME) {
                lineItem.coreListPriceRequest.coreListPriceRequest.Id = undefined;
            }    
        }
    }

    handleInsertSuccess(currentResult, lineItem){
        if(currentResult.action === 'Insert') {
            let key = currentResult.key;
            let childKey = currentResult.childKey;

            if (currentResult.objectName === this.OBJECT_OPPORTUNITY_LINE_ITEM_NAME) {
                if (key === childKey) {
                    lineItem.id = currentResult.recordId;
                } else {
                    lineItem.recurringItem.Id = currentResult.recordId;
                }
            } else if (currentResult.objectName === this.OBJECT_VMI_REQUEST_NAME) {
                lineItem.vmiRequest.vmiRequest.Id = currentResult.recordId;
            } else if (currentResult.objectName === this.OBJECT_CORE_LIST_PRICE_REQUEST_NAME) {
                lineItem.coreListPriceRequest.coreListPriceRequest.Id = currentResult.recordId;
            }
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
            //this.listLineItemsServices.push(lineItem);
            this.listLineItemsServices = [...this.listLineItemsServices, lineItem];
        } else if(productType===this.PRODUCT_ITEM_TYPE_CONSUMABLES){
            //this.listLineItemsConsumables.push(lineItem);
            this.listLineItemsConsumables = [...this.listLineItemsConsumables, lineItem];
            this.handleChangeInLineItemChildren(lineItem);
        } else if(productType===this.PRODUCT_ITEM_TYPE_EQUIPMENT) {
            //this.listLineItemsEquipment.push(lineItem);
            this.listLineItemsEquipment = [...this.listLineItemsEquipment, lineItem];
            this.handleChangeInLineItemChildren(lineItem);
        }
    }

    handleChangeInLineItemChildren(lineItem){

        if(lineItem.recurringItem.isRecurring){
            let entityIndex = this.listRecurringConsumables.indexOf(lineItem.recurringItem);
            if (entityIndex < 0) {
                lineItem.recurringItem.productInfo = lineItem.productInfo;
                this.listRecurringConsumables = [...this.listRecurringConsumables, lineItem.recurringItem];
            }
        } else {
            this.listRecurringConsumables = this.filterOutKey(this.listRecurringConsumables, lineItem.recurringItem.key);
        }

        if(lineItem.isVmi){
            let vmiIndex = this.listVmiProducts.indexOf(lineItem);
            if (vmiIndex < 0) {
                this.listVmiProducts = [...this.listVmiProducts, lineItem];
            }

        } else {
            this.listVmiProducts = this.filterOutKey(this.listVmiProducts, lineItem.key);
        }

        if(lineItem.isCoreListSubmitted){
            let clIndex = this.listCoreListPriceRequest.indexOf(lineItem);
            if (clIndex < 0) {
                this.listCoreListPriceRequest = [...this.listCoreListPriceRequest, lineItem];
            }

        } else {
            this.listCoreListPriceRequest = this.filterOutKey(this.listCoreListPriceRequest, lineItem.key);
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
        lineItem.description = event.detail.lineNotes;
        lineItem.relatedProduct = event.detail.relatedProduct;
        lineItem.relatedProductName = event.detail.relatedProductName;
        lineItem.areaOfCoverage = event.detail.areaOfCoverage;
        lineItem.areaOfCoverageOther = event.detail.areaOfCoverageOther;
        lineItem.coveredPests = event.detail.coveredPests;
        lineItem.coveredPestsOther = event.detail.coveredPestsOther;
    }

    handleConsumablesChange(event){
        let key = event.detail.key;
        let lineItem = this.mapLineItems[key];
        lineItem.quantity = event.detail.quantity;
        lineItem.frequency = 'One-Time';
        lineItem.purchasePrice = event.detail.purchasePrice;
        lineItem.description = event.detail.lineNotes;
        lineItem.isCoreListSubmitted = event.detail.isCoreListSubmitted;
        lineItem.isVmi = event.detail.isVmi;
        lineItem.coreListPriceRequest.coreListPriceRequest.CPQ2_Is_VMI__c = event.detail.isVmi;
        lineItem.coreListPriceRequest.coreListPriceRequest.CPQ2_Requested_Price__c = event.detail.coreListRequestedPrice;
        lineItem.coreListPriceRequest.coreListPriceRequest.CPQ2_List_Price__c = lineItem.productInfo.priceBookEntry.UnitPrice;
        lineItem.recurringItem.isRecurring = event.detail.isRecurring;
        lineItem.recurringItem.frequency = event.detail.recurringFrequency;
        //CPQCN-567 Darcy 2021-01-14 default value 1 if they leave the field blank
        if (event.detail.recurringQuantity) {
            lineItem.recurringItem.quantity = event.detail.recurringQuantity;
        } else {
            lineItem.recurringItem.quantity = 1; 
        }
        lineItem.vmiRequest.vmiRequest.CPQ2_Par_Level__c = event.detail.vmiParLevel;
        // lineItem.installationStatus = 'Install';
        // lineItem.installationPrice = 0;

        if(lineItem.recurringItem.isCoreListSubmitted || event.detail.isCoreListPriceAlreadyExists){
            lineItem.recurringItem.purchasePrice = event.detail.coreListRequestedPrice;
        } else {
            lineItem.recurringItem.purchasePrice = lineItem.productInfo.priceBookEntry.UnitPrice;
        }
        this.handleChangeInLineItemChildren(lineItem);
    }

    handleEquipmentChange(event){
        let key = event.detail.key;
        let lineItem = this.mapLineItems[key];
        lineItem.frequency = 'One-Time';
        lineItem.quantity = event.detail.quantity;
        lineItem.purchasePrice = event.detail.purchasePrice;
        lineItem.description = event.detail.lineNotes;
        lineItem.isCoreListSubmitted = event.detail.isCoreListSubmitted;
        lineItem.coreListPriceRequest.coreListPriceRequest.CPQ2_Requested_Price__c = event.detail.coreListRequestedPrice;
        lineItem.coreListPriceRequest.coreListPriceRequest.CPQ2_List_Price__c = lineItem.productInfo.priceBookEntry.UnitPrice;
        lineItem.installationStatus = event.detail.installationStatus;
        lineItem.installationPrice = event.detail.installationPrice;
        lineItem.installTotal = event.detail.installTotal;
        this.handleChangeInLineItemChildren(lineItem);
    }

    deleteLineItem(key){
        let lineItem = this.mapLineItems[key];

        //mark the item as deleted
        lineItem.isDeleted = true;

        let productType = lineItem.productInfo.priceBookEntry.Product2.Item_Type__c;
        let targetArray;

        if(productType===this.PRODUCT_ITEM_TYPE_SERVICE){
            //targetArray = this.listLineItemsServices;
            this.listLineItemsServices = this.filterOutKey(this.listLineItemsServices,lineItem.key);
        } else if(productType===this.PRODUCT_ITEM_TYPE_CONSUMABLES){
           //targetArray = this.listLineItemsConsumables;
            lineItem.recurringItem.isRecurring = false;
            lineItem.isCoreListSubmitted = false;
            lineItem.isVmi = false;
            this.handleChangeInLineItemChildren(lineItem);
            this.listLineItemsConsumables = this.filterOutKey(this.listLineItemsConsumables,lineItem.key);
        } else if(productType===this.PRODUCT_ITEM_TYPE_EQUIPMENT) {
            //targetArray = this.listLineItemsEquipment;
            lineItem.isCoreListSubmitted = false;
            this.handleChangeInLineItemChildren(lineItem);
            this.listLineItemsEquipment = this.filterOutKey(this.listLineItemsEquipment,lineItem.key);
        }

        //remove from respective list
        // const targetIndex = targetArray.indexOf(lineItem);
        // if (targetIndex > -1) {
        //     targetArray.splice(targetIndex, 1);
        // }

        this.determineIfVmiServicePresent();
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

        // this.isConsumableValid = this.template.querySelector('c-modal').show();
        // this.isEquipmentValid = this.template.querySelector('c-modal').show();

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

    determineIfVmiServicePresent(){
        for(let i=0; i<this.listLineItemsServices.length;i++){
            if(this.listLineItemsServices[i].productInfo.priceBookEntry.Product2.ProductCode === this.cpqSettings.CPQ2_VMI_Code__c){
                this.isVmiServicePresent = true;
                return;
            }
        }
        this.isVmiServicePresent = false;

    }

}