import { LightningElement, track} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CURRENCY from '@salesforce/i18n/currency';
import { NavigationMixin } from 'lightning/navigation';

export default class BaseComponent extends NavigationMixin(LightningElement) {

    PRODUCT_ITEM_TYPE_SERVICE = 'Service';
    PRODUCT_ITEM_TYPE_CONSUMABLES = 'Consumables';
    PRODUCT_ITEM_TYPE_EQUIPMENT = 'Equipment';
    CPQ2_HYGIENE_PRICE_MODEL = 'Hygiene Pricing Model';
    OBJECT_OPPORTUNITY_LINE_ITEM_NAME = 'OpportunityLineItem';
    OBJECT_CORE_LIST_PRICE_REQUEST_NAME = 'CPQ2_Core_List_Price_Request__c';
    OBJECT_VMI_REQUEST_NAME = 'CPQ2_VMI_Request__c';
    TABLE_TYPE_VMI = 'VMI';
    TABLE_TYPE_CORE_LIST_PRICE = 'CORE LIST PRICE';
    TABLE_TYPE_FEE = 'FEE';
    TABLE_TYPE_PURCHASE = 'PURCHASE';
    TABLE_TYPE_RECURRING_PURCHASE = 'RECURRING PURCHASE';
    TABLE_TYPE_SERVICE = 'SERVICE';

    @track isoCode = CURRENCY;

    fireToast(title, message, variant){
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );  
    }

    fireToastWithUrl(title, message, url, label, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                messageData: [
                    {
                        url: url,
                        label: label
                    }],
                variant: variant
            })
        ); 
    }

    handleError(error){
        window.console.log('error =====> '+JSON.stringify(error));
        if(error) {
            this.fireToast('Error while searching for records', error.body.message, 'error');
        }
    }

    split(str, separator, limit) {
        str = str.split(separator);

        if(str.length > limit) {
            let ret = str.splice(0, limit);
            ret.push(str.join(separator));

            return ret;
        }

        return str;
    }

    navigateToRecord(recordId) {
        // Navigate to the Account home page
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                actionName: 'view',
            }
        }, true);
    }

    calculateTotal(lineItem, frequencyMap, tableType){
        let productInfo = lineItem.productInfo.priceBookEntry.Product2;
        let total = 0;

        if(tableType === this.TABLE_TYPE_FEE){
            if(productInfo.GL_Title__c === 'Installation'){
                total = lineItem.quantity * lineItem.servicePrice;
            } else {
                if(lineItem.installationStatus && lineItem.quantity && lineItem.installationPrice){
                    total = lineItem.quantity * lineItem.installationPrice;
                }
            }
        } else {
            if (productInfo.Item_Type__c ===this.PRODUCT_ITEM_TYPE_SERVICE && lineItem.frequency !== 'One-Time'){
                if(lineItem.quantity && lineItem.servicePrice && lineItem.frequency && frequencyMap){
                    let totalPerService = lineItem.quantity * lineItem.servicePrice;
                    let annualFrequency = totalPerService * frequencyMap[lineItem.frequency].Occurrences_In_Year__c;
                    total = annualFrequency/12;
                }


            } else if (productInfo.Item_Type__c ===this.PRODUCT_ITEM_TYPE_SERVICE && lineItem.frequency === 'One-Time'){
                if(lineItem.quantity && lineItem.servicePrice){
                    total = lineItem.quantity * lineItem.servicePrice;
                }

            } else if (lineItem.isRecurring){
                if (lineItem.quantity && lineItem.purchasePrice && lineItem.frequency && frequencyMap) {
                    let totalPerVisit = lineItem.quantity * lineItem.purchasePrice;
                    let annualFrequency = totalPerVisit * frequencyMap[lineItem.frequency].Occurrences_In_Year__c;
                    total = annualFrequency / 12;
                }

            } else {
                if(lineItem.quantity && lineItem.purchasePrice){
                    total = lineItem.quantity * lineItem.purchasePrice;
                }
            }
        }

        return total;
    }
}