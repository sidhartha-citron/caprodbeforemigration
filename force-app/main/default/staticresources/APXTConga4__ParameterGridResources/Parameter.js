/****Changes due to new MySQL table (JM)****/

Ext.define("cpl.model.Parameter",
    {
        extend: "Ext.data.Model",
        idProperty: "Id",        
        fields: [
            { name: "Name" },
            { name: "CategoryName" },
            { name: "Description" },
            { name: "Keywords" },
            { name: "LongDescription" },
            { name: "DefaultValue" }
            //{ name: "CategoryId" },
            //{ name: "Active" },
            //{ name: "C7Enabled" },
            //{ name: "C8Enabled" },
            //{ name: "HTMLBody" },
            //{ name: "Id" },
            //{ name: "ParameterName" },
            //{ name: "ParameterDefinition" },
            //{ name: "ParameterValue" },
            //{ name: "ArticleURL" },
            //{ name: "SortOrder" }
        ]
    });