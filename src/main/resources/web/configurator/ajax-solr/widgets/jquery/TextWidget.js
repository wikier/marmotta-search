
AjaxSolr.TextWidget = AjaxSolr.AbstractWidget.extend({
	input: '#text',
	submit: '#button',
	reset: '#reset',
	defaultQuery: '*:*',
	prefix : '',
	postfix : '',
	field: 'q',
	init: function () {
		var self = this;
		var container = $(this.target);
		var input = $(this.input, container),
			submit = $(this.submit, container),
			reset = $(this.reset, container);
		
		input.bind('keydown', function(e) {
			if (e.which == 13) {
				submit.click();
				return false;
			}
		});
		submit.bind('click', function(e) {
			//var value = input.val();
			//if(value=="") {
			//	alert('Please enter query string!');
			//	return false;
			//}
			self.manager.doRequest(0);
			return false;
		});
		reset.bind('click', function(e) {
			var loc = window.location.href.slice(0,window.location.href.indexOf('?')+1);
			if(loc.indexOf("?") != -1) {
				loc = window.location.href.slice(0,window.location.href.indexOf('?'));
			}
			window.location.href = loc;
			input.val('');
		});
	},
	beforeRequest: function() {
		var input = $(this.input, $(this.target));
		var value = input.val().trim();
		if (value == "" || value == '*' || value == '?') {
			value = this.defaultQuery;
		}
		// self.manager.store.addByValue('q', '('+value+')'+self.appendix);
		this.manager.store.addByValue(this.field, this.prefix +  value + this.postfix);
	},
	afterRequest: function() {
        var input = $(this.input, $(this.target));
        var vs = this.manager.store.values(this.field);
        var value;
        if (vs.length > 0) {
            value = vs[0];
            if (value.search(this.prefix) == 0) {
                value = value.substr(this.prefix.length);
            }
            if (value.search(this.postfix) == value.length - this.postfix.length) {
                value = value.substr(0, value.length - this.postfix.lengt);
            }
            if (value === this.defaultQuery) {
                value = "";
            }
        } else {
            value = "";
        }
        input.val(value);
	},
	setQuery: function(query) {
		var input = $(this.input, $(this.target));
		input.val(query);
	}
});

