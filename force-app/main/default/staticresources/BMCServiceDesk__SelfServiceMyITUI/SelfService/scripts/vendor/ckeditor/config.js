/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
        config.extraPlugins = 'insertimage,filetools,lineutils,notificationaggregator,uploadimage,uploadwidget,widgetselection';
        config.uploadUrl = '/servlet/servlet.FileDownload?file=';     
        

    config.toolbar = 'MyToolbar';    
    config.toolbar_MyToolbar =
    [
        ['Undo','Redo'],
        ['Link','insertimage'],           
        ['JustifyLeft','JustifyCenter','JustifyRight'],
        ['NumberedList','BulletedList','-','Outdent','Indent'],
        ['Bold','Italic','Underline','Strike']
    ];
    config.allowedContent = true;
    config.ForcePasteAsPlainText = false;
    config.resize_enabled = false;
    config.removePlugins = 'elementspath';
    config.linkShowAdvancedTab = false;
    config.pasteFromWordRemoveFontStyles = false;
    config.pasteFromWordRemoveStyles = false;
    config.enterMode = CKEDITOR.ENTER_BR;
	if(isRTLRequired){
		config.contentsLangDirection = 'rtl';
	}
};

