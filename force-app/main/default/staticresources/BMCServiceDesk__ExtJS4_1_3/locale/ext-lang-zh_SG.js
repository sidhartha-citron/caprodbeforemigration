/**
 * Chinese translation (utf8-encoding)
 */
Ext.onReady(function() {
	Ext.define('Ext.locale.zh_SG.util.Format', {
    override: 'Ext.util.Format'
	}, function () {
		var originalDate = Ext.util.Format.date;
		Ext.util.Format.date = function (v, format) {
			return originalDate(v,format).replace('am', '上午').replace('pm', '下午').replace('AM', '上午').replace('PM', '下午');
		}
		var originalParse = Ext.Date.parse;
		Ext.Date.parse = function (input, format, strict) {
			return originalParse(input.replace('下午', 'pm').replace('上午', 'am').replace('下午', 'PM').replace('上午', 'AM'), format, strict);
		}
	});
});
