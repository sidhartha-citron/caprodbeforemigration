Ext.define('cpl.view.GridTextField',
    {
        extend: 'Ext.form.field.Text',
        xtype: 'gridtextfield',

        labelWidth: 50,
        labelAlign: 'right',
        labelPad: 5,
        width: 485,
        enableKeyEvents: true,
        fieldLabel: 'Search',

        listeners: {
            keyup: {
                fn: function (field, e) {
                    var userInput = field.getValue();

                    var parameterGrid = this.up('grid');
                    var pGroup = parameterGrid.getView().getFeature('DatasetGrouping');

                    /****Added ability to search the Category Name, Keywords and LongDescription (JM)****/
                    var parameterGridFilter = parameterGrid.getStore().filterBy(function (record) {
                        if (record.get('Name').toLowerCase().indexOf(userInput.toLowerCase()) != -1 ||
                            record.get('Description').toLowerCase().indexOf(userInput.toLowerCase()) != -1 ||
                            record.get('CategoryName').toLowerCase().indexOf(userInput.toLowerCase()) != -1 ||
                            record.get('Keywords').toLowerCase().indexOf(userInput.toLowerCase()) != -1 ||
                            record.get('LongDescription').toLowerCase().indexOf(userInput.toLowerCase()) != -1) {
                            console.log("record:");
                            console.log(record);
                            return record;
                        }
                    }, this);

                    if (userInput === '') {
                        parameterGrid.setTitle("Composer Parameters");
                        pGroup.collapseAll();

                    } else {
                        parameterGrid.setTitle(Ext.util.Format.htmlEncode('"' + userInput + '" Parameters'));
                        pGroup.expandAll();
                    }
                },
                buffer: 100
            }
        }
    })