var MAKMLExport = {
		styleObject : {},
		kmlParts : {
			header : '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n <Document>\n',
			footer : ' </Document>\n</kml>',
			placeMarkString : '    <Placemark>\n      <styleUrl>#::STYLEID::</styleUrl>\n      <name>::NAME::</name>\n      <description>::DESCRIPTION::</description>\n      <Point><coordinates>::COORDS::</coordinates></Point>\n    </Placemark>\n',
			queryFolders : '',
			queryPlaceMarks : '',
			shapeFolders : '',
			savedShapes : '',
			drawnShapes : '',
			styles : ''
		},
		otherMarkerURLS : {
			image : MASystem.Organization.MAIO_URL + '/images/marker?icon=Marker&color=000000',
			label : MASystem.Organization.MAIO_URL + '/images/marker?icon=Marker&color=000000',
			order : MASystem.Organization.MAIO_URL + '/images/marker?icon=Marker&color=000000'
		},
		
		resetKMLParts : function() {
			MAKMLExport.kmlParts.queryFolders = '';
			MAKMLExport.kmlParts.shapeFolders = '';
			MAKMLExport.kmlParts.styles = '';
			MAKMLExport.kmlParts.drawnShapes = '';
			MAKMLExport.kmlParts.savedShapes = '';
			MAKMLExport.styleObject = {};
		},

		createKML : function () {
			MAKMLExport.resetKMLParts();
			MAKMLExport.processSideBar(function() {
				MAKMLExport.saveKML();
			});
		},
		// Export all plotted marker layers (DATA LAYER NOT SUPPORTED)
		processSideBar : function (callback) {
				callback = callback || function(){};
				//start with queries
				var queries = $('#PlottedQueriesTable .PlottedRowUnit').not('.DataLayer')
				
				//batch the queries to process all information
				var q = async.queue(function (processData, callback) {
					
					//create folder for this query
					MAKMLExport.kmlParts.queryFolders += ' <Folder>\n    <name>'+ htmlEncode(processData.layerName) +'</name>\n';
	
					var arrayOfRecords = [];
					var tempArray = [];
					var chunks = 200;
					var tooltipData = processData.tooltipData;
	
					//create smaller chunks of records
					for (var id in processData.records) {
						var marker = processData.records[id];
						if(marker.isVisible || marker.isClustered || marker.isScattered) {
							tempArray.push(marker);
						}
	
						if(tempArray.length == chunks){
							arrayOfRecords.push(tempArray);
							tempArray = [];
						}
					}
	
					//Add remaining
					if(tempArray.length > 0){
						arrayOfRecords.push(tempArray);
					}	
	
					//batch
					var markerIndex = 1;
					var rbatch = async.queue(function (marker, callback) {
						if(marker.marker && marker.record) {
							var brush = marker.markerValue.replace('#','');
							var url;
							if(MA.Util.isIE()) {
								url = marker.content || '';
							}
							else {
								url = marker.marker.getIcon().url;
							}
	
							if(brush == 'labelMarker') {
								brush = '00000:Marker', url = MASystem.Organization.MAIO_URL + '/images/marker?icon=Circle&color=008FFF';
								if(!MAKMLExport.styleObject[brush]) {
									MAKMLExport.styleObject[brush] = url;
									MAKMLExport.kmlParts.styles += ' <Style id="'+brush+'"><IconStyle><Icon><href>'+htmlEncode(url)+'</href></Icon><scale>0.2</scale></IconStyle></Style>\n';
								}
							}
							else if(brush == 'orderMarker') {
								brush = '008FFF:Circle', url = MASystem.Organization.MAIO_URL + '/images/marker?icon=Circle&color=008FFF'; marker.tooltip1 = markerIndex.toString();
								if(!MAKMLExport.styleObject[brush]) {
									MAKMLExport.styleObject[brush] = url;
									MAKMLExport.kmlParts.styles += '<Style id="'+brush+'"><IconStyle><Icon><href>'+htmlEncode(url)+'</href></Icon><scale>0.5</scale></IconStyle></Style>\n';
								}
							}
							else if(brush.indexOf('image') >=0 ) {
								brush = '008FFF:Marker', url = MASystem.Organization.MAIO_URL + '/images/marker?icon=Marker&color=008FFF';
								if(!MAKMLExport.styleObject[brush]) {
									MAKMLExport.styleObject[brush] = url;
									MAKMLExport.kmlParts.styles += ' <Style id="'+brush+'"><IconStyle><Icon><href>'+htmlEncode(url)+'</href></Icon><scale>1</scale></IconStyle><LabelStyle><scale>0</scale></LabelStyle></Style>\n';
								}
							}
							else {
								var markerParts = brush.split(':');
								var shape = markerParts[1] || 'Marker';
								if(shape != 'Marker' && shape != 'Square' && shape != 'Triangle' && shape != 'Circle') {
									//use a standard marker
									brush = markerParts[0] +':Marker';
								}
								if(url.indexOf('svg') !== -1) {
									//try to get the brush
									url = MASystem.Organization.MAIO_URL + '/images/marker?icon=' + shape + '&color=' + markerParts[0];
								}
								if(!MAKMLExport.styleObject.hasOwnProperty(brush)) {
									if(MA.Util.isIE()) {
									   MAKMLExport.styleObject[brush] = marker.marker.content;
									}
									else {
										MAKMLExport.styleObject[brush] = marker.marker.getIcon();
									}
									MAKMLExport.kmlParts.styles += ' <Style id="'+brush+'"><IconStyle><Icon><href>'+htmlEncode(url)+'</href></Icon><scale>1</scale></IconStyle><LabelStyle><scale>0</scale></LabelStyle></Style>\n';
								}
							}
	
							var markerOptions = {
								title : marker.tooltip1 || '',
								lat : marker.marker.getPosition().lat(),
								lng : marker.marker.getPosition().lng(),
								styleId : brush,
								tooltipData : tooltipData,
								record : marker || {}
							};
	
							MAKMLExport.processPlaceMark(markerOptions,function() {
								markerIndex++;
								callback();
							});
						}
						else {
							callback();
						}
					});
	
					if(arrayOfRecords.length > 0) {
						for(var i = 0; i < arrayOfRecords.length; i++){
							var records = arrayOfRecords[i];
							rbatch.push(records,function(res){
								//do nothing
							});
						}
					}
					else {
						//no markers, just close the folder
						MAKMLExport.kmlParts.queryPlaceMarks = '';
						MAKMLExport.kmlParts.queryFolders += '  </Folder>\n';
						callback({success:true});
					}
	
					rbatch.drain = function() {
						//append markers and close folder
						MAKMLExport.kmlParts.queryFolders += MAKMLExport.kmlParts.queryPlaceMarks;
						MAKMLExport.kmlParts.queryFolders += '  </Folder>\n';
						MAKMLExport.kmlParts.queryPlaceMarks = '';
						callback({success:true});
					};
				});
				//q.concurrency=5;
				
				//create queue
				//('------Loop over queries------');
				if(queries.length > 0) {
					for(var i = 0; i < queries.length; i++){
						var $query = $(queries[i]);
						if(!$query.hasClass('DataLayer')) {
							var data = $query.data();
							var processData = {
								tooltipData : data.tooltips || [],
								layerName : data.savedQueryName,
								records : data.records || {}
							};
							//('-----add query-------');
							q.push(processData,function(res){
								//do nothing
							});
						}
					}
				}
				else {
					//('query done');
					MAKMLExport.proccessShapes(function() {
						callback();
					});
				}
				
				q.drain = function(){
					//('query done');
					MAKMLExport.proccessShapes(function() {
						callback();
					});
				};
		},	

		processPlaceMark : function (options,callback) {
			//('processMarker');
			callback = callback || function(){};
			//build xml string
			if(options.lat && options.lng) {
				var name = MA.Util.encodeHTML(options.title);
				
				MAKMLExport.processPlaceMarkTooltips(options,function(res) {
					var placeMark = MAKMLExport.kmlParts.placeMarkString.replace('::NAME::', htmlEncode(name)).replace('::COORDS::',options.lng + ',' + options.lat + ',0').replace('::STYLEID::',options.styleId).replace('::DESCRIPTION::', res.data);
					
					MAKMLExport.kmlParts.queryPlaceMarks += placeMark;
					callback({success:true});
				});
				
			}
			else {
				callback({success:false});
			}
		},

		processPlaceMarkTooltips : function (placemark,callback) {
			//var cdata = '<![CDATA[Name: Sofia<br>Latitude: 42.71619925<br>Longitude: 23.35866764]]>';
			var cdata = '<![CDATA[<table>';
			try{
				for(var t = 0; t < placemark.tooltipData.length; t++) {
					var tooltip = placemark.tooltipData[t];
					cdata += '<tr><td style="padding-right: 10px;">' + tooltip.FieldLabel + ':</td><td>' + formatTooltip(placemark.record, tooltip) + '</td></tr>';
				}
				if (cdata.substring(cdata.length-11,cdata.length) != '</table>]]>'){
					cdata+= '</table>]]>';
                }
				callback({success:true,data: cdata});
			}
			catch(e){
				if (cdata.substring(cdata.length-11,cdata.length) != '</table>]]>'){
					cdata+= '</table>]]>';
                }
				callback({success:true,data: cdata});
			}
		},
        
		processDataLayerSyle : function (dataLayer,shapeId) {
		    var returnStyle = ' <Style id="'+shapeId+'prox"><LineStyle><width>4</width><color>99000000</color></LineStyle><PolyStyle><color>9922cc22</color></PolyStyle></Style>\n';
		    
		    //open up the data layer to get the styles
		    var styleInfo = dataLayer.style;
		    
		    if(styleInfo) {
		        returnStyle = ' <Style id="'+shapeId +'prox"><LineStyle><width>'+styleInfo.strokeWeight+'</width><color>'+MAKMLExport.colorHelpers.hexToKML(styleInfo.strokeColor,'0.4')+'</color></LineStyle><PolyStyle><color>'+MAKMLExport.colorHelpers.hexToKML(styleInfo.fillColor,'0.4')+'</color></PolyStyle></Style>\n';
		    }
		    
		    
		    return returnStyle;
		},

		proccessShapes : function(callback) {
			callback = callback || function(){};
			var shapes = $('#PlottedQueriesContainer .proximity.layer');
			var savedShapes = $('#PlottedQueriesContainer .PlottedShapeLayer');
			var sq = async.queue(function (processData, callback) {
				if(processData.isSaved) {
					if((processData.shapes && processData.shapes.length > 0) || (processData.kmlInfo && processData.kmlInfo.length > 0)) {
						var savedShapeFolder = '<Folder><name>'+processData.name+'</name>\n';
						if(processData.kmlInfo && processData.kmlInfo.length > 0) {
						    //this is a shape layer
						    var shapeId = new Date();
						    shapeId = shapeId.getTime();
						    
						    //process style info
						    if(processData.dataLayer) {
						        MAKMLExport.kmlParts.styles += MAKMLExport.processDataLayerSyle(processData.dataLayer,shapeId);
						    }
						    else {
						        //defualt
						        MAKMLExport.kmlParts.styles += ' <Style id="'+shapeId+'prox"><LineStyle><width>4</width><color>99000000</color></LineStyle><PolyStyle><color>9922cc22</color></PolyStyle></Style>\n';
						    }
						    
						    //MAKMLExport.kmlParts.styles += ' <Style id="'+shapeId +'"><LineStyle><width>'+shapeData.strokeWeight+'</width><color>'+MAKMLExport.colorHelpers.hexToKML(shapeData.strokeColor,shapeData.fillOpacity)+'</color></LineStyle><PolyStyle><color>'+MAKMLExport.colorHelpers.hexToKML(shapeData.fillColor,shapeData.fillOpacity)+'</color></PolyStyle></Style>\n';
                            for(var i = 0, length = processData.kmlInfo.length; i < length; i++) {
                            	var shapeInfo = processData.kmlInfo[i] || {};
                            	var features = shapeInfo.features || [];
                            	for(var f = 0, len = features.length; f < len; f++) {
                            		var geo = features[f] || [];
                            		var coordinates = geo.geometry.coordinates || [];
                            		for(var c = 0, cLen = coordinates.length; c < cLen; c++) {
                            		    savedShapeFolder += '<Placemark>\n<styleUrl>#'+shapeId +'prox</styleUrl>\n<name>'+processData.name+'</name><Polygon><outerBoundaryIs><LinearRing><coordinates>';
                            			var coordinate = coordinates[c] || [];
                            			for(var ll = 0, llength = coordinate.length; ll < llength; ll++) {
                            				var latlngWrap = coordinate[ll] || [];
                            				var isNumber = !isNaN(latlngWrap[0]);
                            			    if(isNumber) {
                            			        savedShapeFolder += latlngWrap.join(',') + '\n';
                            			    }
                            			    else {
                                				for(var l = 0, llen = latlngWrap.length; l < llen; l++) {
                                					var latlng = latlngWrap[l];
                                					savedShapeFolder += latlng.join(',') + '\n';
                                				}
                            			    }
                            			}
                            			savedShapeFolder += '</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>';
                            		}
                            	}
                            }
						}
						else {
    						//create folder for this saved shape and add all shapes (right now only one, but mayby more later)
    						for(var pds = 0; pds < processData.shapes.length; pds++) {
    						    
    							var sShape = processData.shapes[pds];
    							var shapeKMLData = MAKMLExport.polygonHelpers.parseShapeOptions(sShape);
    							savedShapeFolder += shapeKMLData;
    						}
    
    						//check for a label marker
    						if(processData.labels.length > 0) {
    							//create placemarks
    							for(var l = 0; l < processData.labels.length; l++) {
    								var label = processData.labels[l];
    								var lat = label.getPosition().lat();
    								var lng = label.getPosition().lng();
    								var url = label.getIcon().replace(/&/g,'&amp;');
    								MAKMLExport.styleObject[processData.name + l] = url;
    								MAKMLExport.kmlParts.styles += ' <Style id="'+processData.name + l+'"><IconStyle><Icon><href>'+htmlEncode(url)+'</href></Icon><scale>2</scale></IconStyle><LabelStyle><scale>0</scale></LabelStyle></Style>\n';
    								var placeMark = MAKMLExport.kmlParts.placeMarkString.replace('::NAME::', '').replace('::COORDS::',lng + ',' + lat + ',0').replace('::STYLEID::',processData.name + l).replace('::DESCRIPTION::', '');
    								savedShapeFolder += placeMark;
    							}
    						}
						}

						savedShapeFolder += '</Folder>';
                        
						MAKMLExport.kmlParts.savedShapes += savedShapeFolder;
					}
					callback();
				}
				else {
					var shapeKMLData = MAKMLExport.polygonHelpers.parseShapeOptions(processData.shape);
					MAKMLExport.kmlParts.drawnShapes += shapeKMLData;
					callback();
				}
			});
			//q.concurrency=5;
			
			//create queue
			//('------Loop over shapes------');
			if(shapes.length > 0 || savedShapes.length >0) {
				for(var s= 0; s < shapes.length; s++){
					var $shape = $(shapes[s]);
					var data = $shape.data();
					if(data.proxObject) {
						var processData = {
							shape : data.proxObject,
							isSaved : false
						};
						//('-----add shape-------');
						sq.push(processData,function(res){
							//do nothing
						});
					}
				}

				for(var ss= 0; ss < savedShapes.length; ss++){
					var $savedShape = $(savedShapes[ss]);
					var data2 = $savedShape.data();
					if(data2.proxObjects) {
						var processData2 = {
							shapes : data2.proxObjects || [],
							isSaved : true,
							name : data2.popupData.name || '',
							labels : data2.labelmarkers || [],
							kmlInfo : data2.kmlInfo || [],
							dataLayer : data2.dataLayer || null
						};
						//add to que
						//('-----add Saved shape-------');
						sq.push(processData2,function(res){
							//do nothing
						});
					}
				}
			}

			else {
				//('done shapes');
				callback();
			}
			
			sq.drain = function(){
				//('done shapes');
				callback();
			};
		},

		saveKML : function() {
			var returnKML = MAKMLExport.kmlParts.header;
			returnKML += MAKMLExport.kmlParts.styles;
			returnKML += MAKMLExport.kmlParts.queryFolders;
			//create shape folders
			if(MAKMLExport.kmlParts.drawnShapes !== '' || MAKMLExport.kmlParts.savedShapes !== '') {
				MAKMLExport.kmlParts.shapeFolders += '  <Folder>\n    <name>All Shapes</name>\n';
				MAKMLExport.kmlParts.shapeFolders += '    <Folder>\n      <name>Drawn Shapes</name>\n' + MAKMLExport.kmlParts.drawnShapes + '</Folder>\n';
				MAKMLExport.kmlParts.shapeFolders += '    <Folder>\n      <name>Saved Shapes</name>\n' + MAKMLExport.kmlParts.savedShapes + '</Folder>\n';
				MAKMLExport.kmlParts.shapeFolders += '  </Folder>';
				returnKML += MAKMLExport.kmlParts.shapeFolders;
			}
			returnKML += MAKMLExport.kmlParts.footer;

            MAKMLExport.saveData('MapAnythingKML.kml',returnKML,'data/xml');    
		},

		newDownload: function (content, fileName) {
			content = content || '';
			fileName = fileName || 'MapAnything_Export';
			fileName = fileName.replace('.kml', '');
			openNewWindow('POST', "/apex/sma__MASavedQueryAJAXResources", {exportData: content, fileName: fileName}, '_blank');
		},

        saveData : function(fileName, content, mimeType) {
        	try {
				mimeType = mimeType || 'application/octet-stream';
				fileName = fileName || 'MapAnythingKML.kml';
				
				MAKMLExport.newDownload(content, fileName);
        	} catch(e) {
        		console.warn(e);
        	}
        },
		colorHelpers : {
			hexToKML : function(hex,op) {
				hex = hex.replace('#','');
				op = op || 0.5;
				var colors = {
	                r: hex.substr(0, 2) || "00",
	                g: hex.substr(2, 2) || "00",
	                b: hex.substr(4, 2) || "00"
	            };

	            var rgba = {
	            	r: parseInt(colors.r, 16),
	                g: parseInt(colors.g, 16),
	                b: parseInt(colors.b, 16),
	                a: op
	            };

	            colors = {
	                r: rgba.r,
	                g: rgba.g || 0,
	                b: rgba.b || 0
	            };

	            op = parseInt(op * 255, 10); 
	            op = op.toString(16);

	            colors.b = colors.b.toString(16);
	            colors.g = colors.g.toString(16);
	            colors.r = colors.r.toString(16);
	            if (op.length < 2) op = "0" + op;
	            if (colors.b.length < 2) colors.b = "0" + colors.b;
	            if (colors.g.length < 2) colors.g = "0" + colors.g;
	            if (colors.r.length < 2) colors.r = "0" + colors.r;
	            return op + colors.b + colors.g + colors.r;
			}
		},

		polygonHelpers : {
			toEarth : function(p) {
			    var longitude, latitude, DEG, colatitude;
			    if (p.x === 0) {
			        longitude = Math.PI / 2.0;
			    } else {
			        longitude = Math.atan(p.y / p.x);
			    }
			    colatitude = Math.acos(p.z);
			    latitude = (Math.PI / 2.0 - colatitude);
			    if (p.x < 0.0) {
			        if (p.y <= 0.0) {
			            longitude = -(Math.PI - longitude);
			        } else {
			            longitude = Math.PI + longitude;
			        }
			    }
			    DEG = 180.0 / Math.PI;
			    return {longitude: longitude * DEG, latitude: latitude * DEG};
			},

			toCart : function(longitude, latitude){
			    var theta = longitude;
			    var phi = Math.PI/2.0 - latitude;
			    // spherical coordinate use "co-latitude", not "lattitude"
			    // latitude = [-90, 90] with 0 at equator
			    // co-latitude = [0, 180] with 0 at north pole
			    return {x:Math.cos(theta)*Math.sin(phi),y:Math.sin(theta)*Math.sin(phi),z:Math.cos(phi)};
			},


			spoints : function(longitude,latitude,meters,n,offset){
			    //constant to convert to radians
			    var RAD = Math.PI/180.0;
			    //mean radius of earth in meters
			    var MR = 6378.1 * 1000.0;
			    var offsetRadians = (offset || 0) * RAD;
			    // compute long degrees in rad at a given lat
			    var r = (meters/(MR * Math.cos(latitude * RAD)));
			    var vec = MAKMLExport.polygonHelpers.toCart(longitude*RAD, latitude* RAD);
			    var pt = MAKMLExport.polygonHelpers.toCart(longitude*RAD + r, latitude*RAD);
			    var pts = [];
			    for(i=0;i<=n;i++){
			        pts.push(MAKMLExport.polygonHelpers.toEarth(MAKMLExport.polygonHelpers.rotPoint(vec,pt,offsetRadians + (2.0 * Math.PI/n)*i)));
			    }
			    //add another point to connect back to start
			    //pts.push(pts[0]);
			    return pts;
			},

			rotPoint : function(vec,pt,phi){
			    //remap vector for clarity
			    var u, v, w, x, y,z;
			    u=vec.x;
			    v=vec.y;
			    w=vec.z;
			    x=pt.x;
			    y=pt.y;
			    z=pt.z;
			    var a, d,e;
			    a=u*x + v*y + w*z;
			    d = Math.cos(phi);
			    e=Math.sin(phi);
			    return {x:(a*u + (x-a*u)*d+ (v*z-w*y)*e),y:(a*v + (y - a*v)*d + (w*x - u*z) * e),z:(a*w + (z - a*w)*d + (u*y - v*x) * e)};
			},

			kml_regular_polygon : function(longitude,latitude,meters,segments,offset){
			    var s = '<Polygon>\n';
			    s += '  <outerBoundaryIs><LinearRing><coordinates>\n';
			    var pts = MAKMLExport.polygonHelpers.spoints(longitude,latitude,meters,segments,offset);
			    var len = pts.length;
			    for(i=0;i<len;i++){
			        s += "    " + pts[i].longitude + "," + pts[i].latitude + "\n";
			    }

			    s += '  </coordinates></LinearRing></outerBoundaryIs>\n';
			    s += '</Polygon>\n';
			    return s;
			},

			parseShapeOptions : function(shape) {
				var shapeData;
				var uId = new Date();
		        uId = uId.getTime() + 'prox';
		        var shapeId = shape.qid || uId;
				if(typeof(shape.getCenter) == 'function') {
		            //circle
		            //get the center
		            var center = shape.getCenter();
		            
		            shapeData = {
		                pT : 'C',
		                longitude : center.lng(),
		                latitude : center.lat(),
		                meters : shape.getRadius(),
		                segments : 20,
		                fillColor : shape.fillColor || '#3083d3',
		                fillOpacity : shape.fillOpacity || 0.6,
		                strokeColor : shape.strokeColor || '#16325C',
		                strokeWeight : shape.strokeWeight || 4,
		                label : 'Circle'
		            }

		            //update the style string
		            MAKMLExport.kmlParts.styles += ' <Style id="'+shapeId +'"><LineStyle><width>'+shapeData.strokeWeight+'</width><color>'+MAKMLExport.colorHelpers.hexToKML(shapeData.strokeColor,shapeData.fillOpacity)+'</color></LineStyle><PolyStyle><color>'+MAKMLExport.colorHelpers.hexToKML(shapeData.fillColor,shapeData.fillOpacity)+'</color></PolyStyle></Style>\n';

		            var polygonKMLString =  MAKMLExport.polygonHelpers.kml_regular_polygon(shapeData.longitude,shapeData.latitude,shapeData.meters,shapeData.segments);

		            var shapeKMLString = '<Placemark>\n<styleUrl>#'+shapeId +'</styleUrl>\n<name>'+shapeData.label+'</name>';
		            shapeKMLString += polygonKMLString;
		            return shapeKMLString += '</Placemark>\n';

		        }
		        else if(typeof(shape.getPath) == 'function') {
		            //poly
		            shapeData = {
		                pT : 'P',
		                points : [],
		                fillColor : shape.fillColor || '#22CC22',
		                fillOpacity : shape.fillOpacity || 0.6,
		                strokeColor : shape.strokeColor || '#000000',
		                strokeWeight : shape.strokeWeight || 4,
		                label : 'Polygon'
		            }

		            MAKMLExport.kmlParts.styles += ' <Style id="'+shapeId +'"><LineStyle><width>'+shapeData.strokeWeight+'</width><color>'+MAKMLExport.colorHelpers.hexToKML(shapeData.strokeColor,shapeData.fillOpacity)+'</color></LineStyle><PolyStyle><color>'+MAKMLExport.colorHelpers.hexToKML(shapeData.fillColor,shapeData.fillOpacity)+'</color></PolyStyle></Style>\n';

		            var shapeKMLString = '<Placemark>\n<styleUrl>#'+shapeId+'</styleUrl>\n<name>'+shapeData.label+'</name>\n<Polygon>\n<outerBoundaryIs><LinearRing><coordinates>\n';
		            
		            //loop over the points to get the lat lng
		            var points = shape.getPath();
		            for (var i =0; i < points.getLength(); i++) {
		                var xy = points.getAt(i);
		                shapeKMLString += xy.lng() +','+xy.lat()+'\n';
		            }
		            var end = points.getAt(0);
		            shapeKMLString += end.lng() +','+end.lat()+'\n';
		            
		            return shapeKMLString += '</coordinates></LinearRing></outerBoundaryIs>\n</Polygon>\n</Placemark>\n';
		        }
		        else if(typeof(shape.getBounds) == 'function') {
		            //rectangle
		            shapeData = {
		                pT : 'R',
		                points : [],
		                fillColor : shape.fillColor || '#FFC96B',
		                fillOpacity : shape.fillOpacity || 0.6,
		                strokeColor : shape.strokeColor || '#000000',
		                strokeWeight : shape.strokeWeight || 4,
		                label : 'Rectangle'
		            }
		            
		            //get the bounds
		            var bounds = shape.getBounds();
		            var NE = bounds.getNorthEast();
		            var SW = bounds.getSouthWest();

		            var points = [{lat: NE.lat(), lng: NE.lng()},{lat: NE.lat(), lng: SW.lng()},{lat:SW.lat(), lng: SW.lng()},{lat: SW.lat(), lng:NE.lng()}];

		            MAKMLExport.kmlParts.styles += ' <Style id="'+shapeId+'"><LineStyle><width>'+shapeData.strokeWeight+'</width><color>'+MAKMLExport.colorHelpers.hexToKML(shapeData.strokeColor,shapeData.fillOpacity)+'</color></LineStyle><PolyStyle><color>'+MAKMLExport.colorHelpers.hexToKML(shapeData.fillColor,shapeData.fillOpacity)+'</color></PolyStyle></Style>\n';

		            var shapeKMLString = '<Placemark>\n<styleUrl>#'+shapeId +'</styleUrl>\n<name>'+shapeData.label+'</name>\n<Polygon>\n<outerBoundaryIs><LinearRing><coordinates>\n';
		            
		            //loop over the points to get the lat lng
		            for (var i =0; i < points.length; i++) {
		                var xy = points[i];
		                shapeKMLString += xy.lng +','+xy.lat+'\n';
		            }
		            var end = points[0];
		            shapeKMLString += end.lng +','+end.lat+'\n';
		            
		            return shapeKMLString += '</coordinates></LinearRing></outerBoundaryIs>\n</Polygon>\n</Placemark>\n';
		            
		        }
		        else {
		        	return '';
		        }
			}
		}
	}