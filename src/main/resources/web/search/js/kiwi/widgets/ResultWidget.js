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

AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
	loader: '#loader',
	resultTheme: 'result',
	emptyTheme: 'no_results',
	/**
	 * Before a request, show the loading animation and 
	 */
	beforeRequest: function () {
		this.showLoader(true);
		// goto top
		$("html").scrollTop(0);
	},
	showLoader: function(show) {
		if ( show )
			$(this.loader).show();
		else
			$(this.loader).hide();
	},

	facetLinks: function (facet_field, facet_values) {
    var links = [];
    if (facet_values) {
      for (var i = 0, l = facet_values.length; i < l; i++) {
        links.push(AjaxSolr.theme('facet_link', facet_values[i], this.facetHandler(facet_field, facet_values[i])));
      }
    }
    return links;
	},

	facetHandler: function (facet_field, facet_value) {
    var self = this;
    return function () {
      self.manager.store.remove('fq');
      self.manager.store.addByValue('fq', facet_field + ':' + facet_value);
      self.manager.doRequest(0);
      return false;
    };
	},
  	/**
  	 * After a request, hide the loading animation
  	 * and display the results.
  	 */
	afterRequest: function () {
    	$(this.target).empty();
    	var resp = this.manager.response;
    	for (var i = 0, l = resp.response.docs.length; i < l; i++) {
    		var doc = resp.response.docs[i];
    		$(this.target).append(AjaxSolr.theme(this.resultTheme, doc, resp));
    	}
    	if(resp.response.numFound == 0) {
    		var x = resp.responseHeader.params.q;
    		$(this.target).html(AjaxSolr.theme(this.emptyTheme));
    	}
    	this.showLoader(false);
	},

  init: function () {
   /*
    $('a.more').livequery(function () {
      $(this).toggle(function () {
        $(this).parent().find('span').show();
        $(this).text('less');
        return false;
      }, function () {
        $(this).parent().find('span').hide();
        $(this).text('more');
        return false;
      });
    });
    */
  }

});

