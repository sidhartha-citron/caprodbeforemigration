/*
 Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or http://ckeditor.com/license
*/
CKEDITOR.plugins.add( 'insertimage', {
    icons: 'insertimage',
    init: function( editor ) {
        var param = editor.config.pluginParam;
        editor.addCommand( 'insertimage', new CKEDITOR.dialogCommand( 'insertimageDialog' ) );
        editor.ui.addButton( 'insertimage', {
   			 label: param.Insert,
			    command: 'insertimage',
			    toolbar: 'insert'
			});
        CKEDITOR.dialog.add( 'insertimageDialog', this.path + 'dialogs/insertimage.js' );
    }
});

