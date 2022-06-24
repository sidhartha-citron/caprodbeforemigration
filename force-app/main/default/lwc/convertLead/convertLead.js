import { LightningElement, api, wire, track } from 'lwc';
import getReadyToConvert from '@salesforce/apex/ConvertLeadController.getReadyToConvert';
import convertLeads from '@salesforce/apex/ConvertLeadController.convertLeads';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import FORM_FACTOR from '@salesforce/client/formFactor';


const columns = [
    { label: 'Account Name', fieldName: 'Name' },
    { label: 'Shipping Address', fieldName: 'Shipping_Address__c' },
    { label: 'Industry', fieldName: 'Industry' },
    // { label: 'Phone', fieldName: 'Phone', type: 'phone' }
    { label: 'Phone', fieldName: 'Phone', type: 'phone' },
];

const contcolumns = [
    { label: 'Contact Name', fieldName: 'Name' },
    { label: 'Account Name', fieldName: 'accName' },
    { label: 'Email', fieldName: 'Email', type: 'email' },
];
export default class ConvertLead extends NavigationMixin(LightningElement) {
    coldata = [];
    columns;
    @api recordId;
    @api oppId;
    @api isflow = false;
    @api flowOppId;
    convertMessage;
    done
    @track accdata;
    @track condata;
    accountDupeList = []
    contactDupeList = []
    dupeEncountered = false
    choosenAccount = ''
    choosenContact = ''
    bypassDupe = false;
    @track isLoaded = false;
    @track convertedAccount;
    @track columns;

    @track fixedWidth = 'width: 11rem';
    @track leadfName1;
    @api leadlName;
    @api leadName;
    @api companyName;
    detectDevice;


    @api
    get leadfName() {
        return this.leadfName1;
    }

    set leadfName(value) {
        this.leadfName1 = value;
    }

    //@track columns = 
    /*[
        { label: 'Name', fieldName: 'Name' },
        { label: 'Phone', fieldName: 'Phone', type: 'phone' },
    ];*/

    @track concolumns = [
        { label: 'Account Name', fieldName: 'AccountId' },
        { label: 'Email', fieldName: 'Email', type: 'email' },
    ];

    _currentPageReference;
    @api convertedname;
    @api ldname
    accOppname;
    conName;
    @api leadIdtoconvert;

    @wire(CurrentPageReference)
    currentPageReference(result) {
        this._currentPageReference = JSON.parse(JSON.stringify(result)).attributes.attributes;
        if (this._currentPageReference) {
            this.leadIdtoconvert = this._currentPageReference.c__recordId;
            this.convertedname = this._currentPageReference.c__name;
            this.ldname = this._currentPageReference.c__ldname;
            this.accOppname = (this.companyName === undefined || this.companyName === null) ? this.convertedname : this.companyName;
            if (this.ldname === undefined || this.ldname === null) {
                this.conName = this.leadfName1 + ' ' + this.leadlName;
            } else {
                this.conName = this.ldname;
            }
        }
    }


    @track recId;
    @track convertedContact;
    connectedCallback() {
        this.detectDevice = FORM_FACTOR;
        if (this.detectDevice === 'Large') {
            this.largedevice = true
            this.tablestyle = 'width:87%;margin:auto';
        }
        else {
            this.largedevice = false
            this.tablestyle = ''
        }
        this.isLoaded = true;
        console.log(this.recordId);
        console.log(this.leadIdtoconvert);
        this.accOppname = (this.companyName === undefined || this.companyName === null) ? this.convertedname : this.companyName;
        if (this.ldname === undefined || this.ldname === null) {
            this.conName = this.leadfName1 + ' ' + this.leadlName;
        } else {
            this.conName = this.ldname;
        }
        this.recId = this.recordId !== undefined ? this.recordId : this.leadIdtoconvert;
        this.accOppname = (this.companyName === undefined || this.companyName === null) ? this.convertedname : this.companyName;
        if (this.ldname === undefined || this.ldname === null) {
            this.conName = this.leadfName1 + ' ' + this.leadlName;
        } else {
            this.conName = this.ldname;
        }
        getReadyToConvert({ leadId: this.recId })
            .then(result => {
                console.log(result)
                this.isLoaded = false;
                if (result.message) {
                    this.convertMessage = result.message
                } else {
                    this.convertLead(this.recId, this.choosenAccount, this.choosenContact, this.bypassDupe);
                }
            })
            .catch(error => {
                console.log('Error Occured:- ' + error);
            });
    }
    @track options = [];
    temparray = []
    accId;
    customMessage;
    convertLead(recordId, accountId, contactId, bypassDupe) {
        this.isLoaded = true;
        convertLeads({ 'leadId': recordId, 'accountId': accountId ? accountId : null, 'contactId': contactId ? contactId : null, 'bypassDupeCheck': bypassDupe })
            .then(result => {
                console.log(result)
                this.isLoaded = false;
                if (result.isSuccess) {
                    this.convertMessage = 'Lead has been converted.';
                    this.dupeEncountered = false;
                    this.convertedContact = result.contactId;
                    this.convertedAccount = result.accountId;
                    //alert(this.convertedAccount)
                    this.oppId = result.opportunityId !== null ? '/' + result.opportunityId : '';
                    this.conId = '/' + result.contactId;
                    this.accId = '/' + result.accountId;
                    //alert(this.oppId)
                    this.flowOppId = result.opportunityId;
                    this.customMessage = ''
                    if (this.accId) {
                        //     this.customMessage = 'Duplicate found.'
                        const custEvent = new CustomEvent(
                            'convertsuccess', {
                            detail: this.accId
                        });
                        this.dispatchEvent(custEvent);

                    }
                } else {
                    this.isLoaded = false;
                    let optionsValues = [];
                    for (let i = 0; i < result.accountLists.length; i++) {
                        optionsValues.push({
                            label: result.accountLists[i].Name + ' ' + result.accountLists[i].Phone,
                            value: result.accountLists[i].Name + ' ' + result.accountLists[i].Phone
                        })
                    }
                    this.options = optionsValues;
                    this.columns = JSON.parse(JSON.stringify(result.columnsLists));
                    this.accdata = result.accountLists.length === 0 ? '' : result.accountLists;
                    if (this.accdata) {
                        this.columns = columns;

                        this.accdata.forEach(recItem => {
                            this.coldata.push(recItem);
                        });
                    }
                    this.condata = result.contactLists.length > 0 ? result.contactLists : '';
                    if (this.condata) {
                        this.columns = contcolumns;
                        this.condata.forEach(res => {
                            let temp = {};
                            temp.Name = res.Name;
                            temp.accName = res.Account.Name;
                            temp.Email = res.Email
                            this.coldata.push(temp)
                            // this.coldata.push(recItem);
                        });
                    }
                    this.convertMessage = result.message;
                    this.accountDupeList = result.accountLists
                    this.contactDupeList = result.contactLists
                    this.dupeEncountered = result.isDupe;
                    if (this.dupeEncountered) {
                        this.customMessage = 'Duplicate found.'
                        const custEvent = new CustomEvent(
                            'dupencounter', {
                            detail: this.dupeEncountered
                        });
                        this.dispatchEvent(custEvent);
                    }

                }
            })
            .catch(error => {
                this.error = error;
            });
    }

    handleaccselection(e) {
        const selectedRows = e.detail.selectedRows;
        if (this.accountDupeList.length > 0) {
            this.choosenAccount = e.detail.selectedRows[0].Id
        }

        if (this.contactDupeList.length > 0) {
            this.choosenContact = e.detail.selectedRows[0].Id
        }

    }

    handleconselection(e) {
        const selectedRows = e.detail.selectedRows;
        this.choosenContact = e.detail.selectedRows[0].Id
    }
    @api
    convert(choosenAccount, choosenContact) {
        this.dupeEncountered = false;
        var accountList = this.accountDupeList
        // var choosenAccount = this.choosenAccount;
        var contactList = this.contactDupeList;
        //  var choosenContact = this.choosenContact;
        var byPass = false;

        if (accountList.length > 0 && (choosenAccount !== null || choosenAccount !== undefined)) {
            byPass = true;
        }

        if (contactList.length > 0 && (!choosenContact /*=== null || choosenContact !== undefined*/)) {
            byPass = true;
        }
        this.convertLead(this.recId, choosenAccount, choosenContact, byPass)
    }
    @track dupaccid;
    getaccrowid(e) {
        console.log(e)
        console.log(e)
        if (e.target.checked) {
            const boxes = this.template.querySelectorAll('lightning-input');
            boxes.forEach(box =>
                box.checked = e.target.name === box.name
            );
            this.dupaccid = this.accdata[e.target.value].Id
            this.choosenAccount = this.dupaccid
        }
        //this.dupaccid = this.accdata[e.target.value].Id
        //this.choosenAccount = this.dupaccid
    }
    getconrowid(e) {
        console.log(e)
        this.dupaccid = this.condata[e.target.value].Id
        this.choosenContact = this.dupaccid
    }
    back(e) {
        var compDefinition = {
            componentDef: "c:callblockv1",
            attributes: {
            }
        };
        // Base64 encode the compDefinition JS object
        var encodedCompDef = btoa(JSON.stringify(compDefinition));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedCompDef
            }
        });
    }

    handleRowSelection(e) {
        var selectedRows = e.detail.selectedRows;
        console.log(selectedRows);
        const custEvent = new CustomEvent(
            'selectedrow', {
            detail: e.detail.selectedRows
        });
        this.dispatchEvent(custEvent);
    }
    gotoCallBlock(e) {
        var compDefinition = {
            componentDef: "c:callblockv1",
            attributes: {
            }
        };
        // Base64 encode the compDefinition JS object
        var encodedCompDef = btoa(JSON.stringify(compDefinition));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedCompDef
            }
        });
    }

    callConvert(e) {
        this.convert(this.choosenAccount, this.choosenContact)
    }
}