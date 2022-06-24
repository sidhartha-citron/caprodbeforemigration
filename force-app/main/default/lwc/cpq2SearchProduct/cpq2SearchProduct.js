import { track, api } from 'lwc';
import searchProducts from '@salesforce/apex/CPQ2_SearchProductController.getResults';

import BaseComponent from 'c/baseComponent';
export default class Cpq2SearchProduct extends BaseComponent {

    @api priceBook = '';
    @api typeFilter = 'All';
    @api accountId;
    @api recordId;
    @api displayQuantity = false;
    @api cpqSettings;
    @track searchResults;
    @track searchString = '';
    @track categoryFilter = 'All';
    @track lobFilter = 'All';
    @track isLoading = false;
    @track spinnerMessage = 'Searching...';
    @track resultSubsetList;

    

    privateQuantity = 1;

    get quantity(){
		return this.privateQuantity;
	}

	set quantity(value){
		this.privateQuantity = value;
	}

    get pageSize() {
        if(this.cpqSettings) {
            return this.cpqSettings.Product_Search_Page_Size__c;
        }
        else {
            return 5;
        }        
    }

    get showEquipment() {
        return this.typeFilter !== 'Service';
    }

    get showQuantity() {
        //CPQCN-524
        return false;
        //return (this.typeFilter === 'Service' && this.displayQuantity === true);
    }

    customEventHandler(event){
        this[event.detail.name] = event.detail.value;
    }

    genericOnChange(event){
        this[event.target.name] = event.target.value;
    }

    handleKeyUp(event){
        if (event.which === 13){
            this.handleSearch();
        }
    }

    handleSearch() {
        if(this.searchString.length < 2){
            this.fireToast('Searching for records', 'Please enter at least 2 characters to perform a search.', 'info');
            return;
        }

        if(!this.accountId){
            this.fireToast('Searching for records', 'Please contact your admin. This page did not find an Account for this quote.', 'error');
            return;
        }

        this.privateQuantity = 1;
        this.searchResults = undefined;
        this.resultSubsetList = undefined;

        this.isLoading = true;
        searchProducts({value : this.searchString, 
                        priceBook : this.priceBook,
                        typeFilter : this.typeFilter,
                        categoryFilter : this.categoryFilter,
                        lobFilter : this.lobFilter,
                        accountId : this.accountId,
                        recordId : this.recordId
                    })
        .then(result => {

            if(result.length > 0){
                console.log(JSON.stringify(result));
                this.searchResults = result;           
            } else {
                this.fireToast('Searching for records', 'No records have been found.', 'info');
            }

            this.isLoading = false;
        })
        .catch(error => {
            this.searchResults = undefined;
            this.handleError(error);

            this.isLoading = false;
        }) 
    }

    handleAddProduct(event){
        const newEvent = new CustomEvent('productadd', {
            detail: {
                "value": event.target.value,
                "quantity": this.privateQuantity
            }
        });
        this.dispatchEvent(newEvent);        
    }

    handleSubsetChanged(event){
        this.resultSubsetList = JSON.parse(event.detail.value);
    }


    
}