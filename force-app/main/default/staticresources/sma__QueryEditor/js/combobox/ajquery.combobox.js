	(function( $ ) {
		$.widget( "ui.combobox", {
			_create: function() {
				this.wrapper = $( "<span>" ).addClass( "ui-combobox" ).insertAfter( select );
				this.element.hide();
				this._createAutocomplete();
				this._createShowAllButton();
				
			},
			_createAutocomplete: function () {
				var select = this.element.children(':selected');
				var selectElement = this.element;
				var value = selected.val() ? selected.text() : '';
			
				this.input = $( "<input>" )
					.appendTo(this.wrapper)
					.val(value)
					.addClass( "ui-state-default" )
					.autocomplete({
						delay: 0,
						minLength: 0,
						source: function( request, response ) {
							var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
							response(selectElement.children( "option" ).map(function() {
								var text = $(this).text();
								if (this.value && (!request.term || matcher.test(text)))
									return {
										label: text.replace(
											new RegExp(
												"(?![^&;]+;)(?!<[^<>]*)(" +
												$.ui.autocomplete.escapeRegex(request.term) +
												")(?![^<>]*>)(?![^&;]+;)", "gi"
											), "<strong>$1</strong>" ),
										value: text,
										option: this
									};
							}) );
						},
						select: function( event, ui ) {
							ui.item.option.selected = true;
							self._trigger( "selected", event, {
								item: ui.item.option
							});
							select.trigger("change");
						},
						change: function( event, ui ) {
							if ( !ui.item ) {
								var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( $(this).val() ) + "$", "i" ),
									valid = false;
								select.children( "option" ).each(function() {
									if ( $( this ).text().match( matcher ) ) {
										this.selected = valid = true;
										return false;
									}
								});
								if ( !valid ) {
									if ($(this).val() == '' && select.attr('data-blankvalue')) {
										$(this).val(select.attr('data-blankvalue'));
									}
									else {
										//set value back to the current selection on the underlying select
										$(this).val(select.find('option:selected').text());
										return false;
									}
								}
							}
						}
					})
					.addClass( "ui-widget ui-widget-content ui-corner-left" );

				input.data( "autocomplete" )._renderItem = function( ul, item ) {
					return $( "<li></li>" )
						.data( "item.autocomplete", item )
						.append( "<a>" + item.label + "</a>" )
						.appendTo( ul );
				};

				$( "<a>" )
					.attr("tabIndex", -1)
					.attr( "title", "Show All Items" )
					.appendTo( wrapper )
					.button({
						icons: {
							primary: "ui-icon-triangle-1-s"
						},
						text: false
					})
					.removeClass( "ui-corner-all" )
					.addClass( "ui-corner-right ui-button-icon" )
					.click(function() {
						// close if already visible
						if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
							input.autocomplete( "close" );
							return;
						}

						// work around a bug (likely same cause as #5265)
						$( this ).blur();

						// pass empty string as value to search for, displaying all results
						input.autocomplete( "search", "" );
						input.focus();
					});
			},
			_destroy: function() {
				this.wrapper.remove();
				this.element.show();
			}
		});
	})( jQuery );