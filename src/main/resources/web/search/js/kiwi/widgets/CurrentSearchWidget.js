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

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
	mappers : {},
	blacklist : [],
	image:{"remove":"img/remove.png"},
	separator: ' ',
	afterRequest: function () {
		var self = this;
		var facets = [];

		var fq = this.manager.store.values('fq');
		for (var i = 0, l = fq.length; i < l; i++) {
		    if (/^\{!geofilt.*\}$/.test(fq[i])) {
		        // Special handling of geofilter
		        var t = fq[i];
		        t = t.substr(2, t.length - 3);
		        var spl = t.split(/\s+/);

		        var field, pos, radius;
		        for (var j in spl) {
		            var kv = spl[j].split("=");
		            if (kv[0] == "sfield") field = kv[1];
		            else if (kv[0] == "d") radius = kv[1];
		            else if (kv[0] == "pt") pos = kv[1].split(",");
		        }
		        var name = this.mappers[field] || field;
		        var f = parseFloat(radius);
		        var value = (f>=100?f.toFixed(0):f.toFixed(1)) + 'km Umkreis'; 
		        
		        if (!(field == "" || this.blacklist.indexOf(field) > -1)) {
		            facets.push({name:name, value:value, query:fq[i], field:field});
		        }
		        continue;
		    }
			var qs = fq[i].replace(/^\{.*\}/,"")
			var split = qs.split(":");
			var field = split[0];
			if (field == "" || this.blacklist.indexOf(field) > -1) {
				// Do not display empty fields or fields that are in the blacklist
				continue;
			}
			
			var value = "";
			for(var j=1; j<split.length; j++) {
				if(j==1) value = split[1];
				else value = value+":"+split[j];
			}
			
			
			var name = this.mappers[field];
			if(name == null) {
				name  = field;
			}
			
			
			facets.push({name:name, value:value, query:fq[i], field:field});
		}
		self.render(facets);
	},
	render: function(facets) {
		var self = this;
		if (facets.length) {
			links = [];
			for ( f in facets) {
				var value = facets[f].value;
				var name = facets[f].name;
				var fq = facets[f].query;
				if (value.match(/\[.*TO.*\]/)) {
					// Handle ranges separately
					var values = value.match(/\d{4}(-\d{2}){2}/g);
					links.push($('<a href="#"/>').html(name + ":" + values[0] + " to " + values[1] + "<img style='margin-left:2px;' src='"+this.image.remove+"'>").click(self.removeFacet(fq)));
				}
				else {
					// links.push($('<a href="#"/>').text('(x) ' + fq[i]).click(self.removeFacet(fq[i])));
					links.push($('<a href="#"/>').html(name + ":" +value+"<img style='margin-left:2px;' src='"+this.image.remove+"'>").click(self.removeFacet(fq)));
				}
			}
			
			AjaxSolr.theme('list_items', this.target, links, this.separator);
			$(this.target).attr("class","selection-active");
			$(this.target).prepend("<h2>Selected</h2>");
		} else {
			$(this.target).attr("class","");
			$(this.target).html('');
		}
	},

  removeFacet: function (facet) {
    var self = this;
    return function () {
      if (self.manager.store.removeByValue('fq', facet)) {
        self.manager.doRequest(0);
      }
      return false;
    };
  },
  
  
});
