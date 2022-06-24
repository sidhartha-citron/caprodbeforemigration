var Vue = require('vue').default;

module.exports = {
    methods: {
        decodeHtml: function(html) {
            var txt = document.createElement("textarea");
            txt.innerHTML = html;
            return txt.value;
        }
    }
};