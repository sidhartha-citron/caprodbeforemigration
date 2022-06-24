Ext.define('cpl.view.GridSelectButton',
    {
        extend: 'Ext.button.Button',
        xtype: 'gridselectbutton',

        text: 'Select Parameter',
        alignTo: 'l',

        handler: function (grid, record, e) {
            var parameterTopPanel = this.up().up().up('panel');
            var parameterGrid = parameterTopPanel.down('grouped-grid');
            //var parameterGrid = this.up().up().up('panel').down('grouped-grid');
            
            var pGroup = parameterGrid.getView().getSelectionModel().getSelection();

            var greenColorCode = "60bb46";
            var redColorCode = "ED1C24";

            var selectedEntryParameterName = pGroup[0].get("Name");
            var selectedEntryParameterDesc = pGroup[0].get("Description");
            var selectedEntryParameterDefaultVal = pGroup[0].get("DefaultValue");

            var parameterValueShadeColor = '';
            var durationPeriod = '1500';

            if (selectedEntryParameterDefaultVal === "" || selectedEntryParameterDefaultVal === null)
            {
                parameterValueShadeColor = redColorCode;
                durationPeriod = '2500';
            }
            else
            {
                parameterValueShadeColor = greenColorCode;
            }

            /*Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:nameStringItem:nameStringBox").set({ value: selectedEntryParameterName }).highlight("60bb46", {
                attr: 'color',
                attr: 'backgroundColor',
                duration: 1500
            });*/

            /***Changed so the focus at Select Parameter to the SF search field to reposition the page nicely for the user****/

            Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:nameStringItem:nameStringBox").dom.value = selectedEntryParameterName;
            Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:nameStringItem:nameStringBox").highlight(greenColorCode, {
                attr: 'color',
                attr: 'backgroundColor',
                duration: 1500
            });

            Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:descriptionSectionItem:commentStringBox").dom.value = selectedEntryParameterDesc;
            Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:descriptionSectionItem:commentStringBox").highlight(greenColorCode, {
                attr: 'color',
                attr: 'backgroundColor',
                duration: 1500
            });

            Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:valueStringItem:valueStringBox").dom.value = selectedEntryParameterDefaultVal;
            Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:valueStringItem:valueStringBox").highlight(parameterValueShadeColor, {
                attr: "color",
                attr: "backgroundColor",
                duration: durationPeriod
            });

            /**Only highlights and fills in the Value if it was empty - retired code with new Default Value work above**/
            /*
            if (Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:valueStringItem:valueStringBox").dom.value === '') {
                Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:valueStringItem:valueStringBox").highlight("ED1C24", {
                    attr: "color",
                    attr: "backgroundColor",
                    duration: 2500
                });
                //}).focus(10, '');
            }*/

            //Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:nameStringItem:nameStringBox").focus(10, '');

            /****This is the SF Search field at the very top****/
            Ext.get("phSearchInput").focus(10, '');
            Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:valueStringItem:valueStringBox").focus(10, '');

            /*var detailPanel = this.ownerCt.child("#detailPanel");
            detailPanel.update(record.data);*/
        }
    });