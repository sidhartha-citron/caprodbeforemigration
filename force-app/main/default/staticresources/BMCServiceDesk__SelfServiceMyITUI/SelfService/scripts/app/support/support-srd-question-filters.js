	angular.module('supportModule')
		.filter('expectedCompletion', ['$filter', function ($filter) {
			return function (time, units) {
				var sufix = '';
				if (units == 1000) {
					if (time <= 1) {
						sufix = 'hour';
					} else {
						sufix = 'hours';
					}
				} else if (units == 2000) {
					if (time <= 1) {
						sufix = 'day';
					} else {
						sufix = 'days';
					}
				}

				return '---';//$filter('i18n')('support.sr.turnaroundTime.' + sufix, time);
			}
		}])
		.filter('rangeHint', function () {
			return function (data) {
				var start = (data.minValue == data.minLabel) ? data.minValue :
					(data.minLabel + " (" + data.minValue + ")");
				var end = (data.maxValue == data.maxLabel) ? data.maxValue :
					(data.maxLabel + " (" + data.maxValue + ")");
				return start + ' - ' + end;
			}
		})
		.filter('fileTypeIconClass', function () {
			return function (filename) {

				var fileTypes = {
					doc: 'doc', docx: 'doc',
					ppt: 'ppt', pptx: 'ppt',
					xls: 'xls', xlsx: 'xls', csv: 'xls',
					pdf: 'pdf',
					txt: 'txt', text: 'txt', properties: 'txt',
					bmp: 'images', jpg: 'images', jpeg: 'images', jpe: 'images', jfif: 'images', gif: 'images',
					png: 'images', tiff: 'images',
					asf: 'videos', avi: 'videos', wmv: 'videos', mpeg1: 'videos', mpeg: 'videos', mpg: 'videos',
					m1v: 'videos', mp2: 'videos', wav: 'videos', snd: 'videos', au: 'videos', aif: 'videos',
					aifc: 'videos', aiff: 'videos', wm: 'videos', wma: 'videos', mp3: 'videos'
				};
				if(typeof extension != 'undefined'){
					var extension = filename.split('.').pop();
					if (extension) {
						var type = fileTypes[extension.toLowerCase()];
						if (type) {
							return 'i-file-type-' + type;
						}
					}
				}

				// all the rest of the file types match generic icon
				return 'i-file-type-generic';
			}
		})
		.filter('filterHtml', function () {
			return function (instruction) {
				if (!instruction) {
					return;
				}
				var nonAnchorTagRegExp = /<((?!a[>|\s])\w+)[^>]*>.*?<\/\1>/;
				if (nonAnchorTagRegExp.test(instruction)) {
					return '';
				}
				var anchorTagRegExp = /(<a[^>]*href=.*>.*?<\/a>)/;
				if (anchorTagRegExp.test(instruction)) {
					return instruction.replace(/<a/g, '<a target="_blank"');
				}

				return instruction;
			};
		});