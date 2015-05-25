/*
 * Copyright (C) 2013 Salzburg Research.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
	setQuery: function(query) {
		var input = $(this.input, $(this.target));
		input.val(query);
	}
});

