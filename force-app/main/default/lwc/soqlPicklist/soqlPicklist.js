import { LightningElement, wire, api, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getSoqlPickListItems from '@salesforce/apex/SoqlPicklistController.getPicklistOptions';

export default class SoqlPicklist extends LightningElement {

    @api firstValue = '';
    @api picklistName = '';
    @api objectName = '';
    @api fieldLabel = '';
    @api placeHolder = '';
    @api fieldName = '';
    @api labelField = '';
    @api valueField = '';
    @api whereClause = '';
    @api orderBy = '';
    @api value = '';
    @api useFirstValue = false;
    @api disabled = false;
    @track options;
    apiFieldName;

    provisionedValues; 

    @wire(getSoqlPickListItems, { objectName: '$objectName',
                                targetColumnValue: '$valueField',
                                targetColumnLabel: '$labelField',
                                whereClause: '$whereClause',
                                orderBy: '$orderBy'})

    wiredPickListItems(provisionedValue) {
        this.provisionedValues = provisionedValue; // track the provisioned value
        const { data, error } = provisionedValue; // destructure it for convenience
        if (data) {
                
            // Map picklist values
            this.options = data.map(plValue => {
                return {
                    label: plValue.label,
                    value: plValue.value
                };
            });
            //if(this.firstValue){
                this.options.unshift({
                    label: this.firstValue,
                    value: this.firstValue
                })
//}

            this.error = undefined;

            if(!this.value &&
                this.useFirstValue &&
                this.options &&
                this.options.length > 0){
                this.value = this.options[0].value;
                this.sendChangeEvent(this.value);
            }
        } else if (error) {
            console.log(error);
            this.error = error;
            this.options = undefined;
        }
    }

    handleChange(event) {
        //console.log('*** ' + JSON.stringify(event));
        this.sendChangeEvent(event.detail.value, event.detail.label);
    }

    sendChangeEvent(detailValue){

        let detailLabel;
        for(let i=0; i < this.options.length;i++){
            if(this.options[i].value === detailValue){
                detailLabel = this.options[i].label;
                break;
            }
        }

        const changeEvent = new CustomEvent('picklistchange', {
            detail: {value: detailValue, label: detailLabel,
                    name: this.picklistName }
        });

        //console.log('*** ' + JSON.stringify(changeEvent));
        // Fire the custom event
        this.dispatchEvent(changeEvent);
    }
}