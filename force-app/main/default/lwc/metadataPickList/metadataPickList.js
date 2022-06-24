import { LightningElement, wire, api, track } from 'lwc';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';

export default class MetadataPickList extends LightningElement {

    @api allowNoValue = false;
    @api firstValue = '';
    @api picklistName = '';
    @api objectName = 'Account';
    @api fieldName = 'Industry';
    @api placeHolder = '';
    @api disabled = false;
    @api fieldLabel;

    // making sure the master recordTypeId is populated because 'data.defaultRecordTypeId' only returns null
    // for opportunityLineItems - joys of early LWC
    @api recordTypeId = '012000000000000AAA';
    @api defaultValue;
    @track options;
    apiFieldName;

    @wire(getObjectInfo, { objectApiName: '$objectName' })
    getObjectData({ error, data }) {
        if (data) {
            if (!this.recordTypeId){
                this.recordTypeId = data.defaultRecordTypeId;
            }

            if (!this.fieldLabel){
                this.fieldLabel = data.fields[this.fieldName].label;
            }
            this.apiFieldName = this.objectName + '.' + this.fieldName;

        } else if (error) {
            // Handle error
            console.log('==============Error  ');
            console.log(error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: '$apiFieldName' })
    getPicklistValues({ error, data }) {
        if (data) {
            console.log('==== ' + JSON.stringify(data) );
            // Map picklist values
            this.options = data.values.map(plValue => {
                return {
                    label: plValue.label,
                    value: plValue.value
                };
            });
            if(this.firstValue){
                this.options.unshift({
                    label: this.firstValue,
                    value: this.firstValue
                })
            }
            if(this.allowNoValue){
                this.options.unshift({
                    label: '',
                    value: ''
                })
            }

        } else if (error) {
            // Handle error
            console.log('==============Error  ' + error);
            console.log(error);
        }
    }

    handleChange(event) {

        console.log('*** FROM PL: ' + event.detail.value);
        console.log('*** FROM PL: ' + this.picklistName);

        const filterChangeEvent = new CustomEvent('filterchange', {
            detail: {value: event.detail.value, name: this.picklistName }
        });
        // Fire the custom event
        this.dispatchEvent(filterChangeEvent);    
    }
}