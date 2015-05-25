/*
 * Copyright (c) 2008-2012 Salzburg Research.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function ($) {
	AjaxSolr.TimeChartWidget = AjaxSolr.AbstractFacetWidget.extend({
		multivalue: false,
		afterRequest: function () {
			function pad(n) { if (n<10) return "0" + n; else return n; };
			function getDate(d) {
				return pad(d.getMonth()+1)+"/"+pad(d.getDate())+"/"+(d.getFullYear());
			};
			function printDate(d) {
				return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate());
			};
			function date2solrString(d) {
				var dString = (d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + "Z");
				return dString;
			};

			$(this.target).empty();
			var values = [];
			var maxCount = 9;
			var wStart, wEnd;
			var response = this.manager.response;
			
			var fqs = [].concat(response.responseHeader.params['fq']);
			for (var fq in fqs) {
				var fqv = fqs[fq];
				if (fqv && fqv.match(new RegExp('^-?' + this.field + ':'))) {
					var split = fqv.split(/ ?([\[\]]|TO) ?/);
					wStart = new Date(split[2].substr(0,10));
					wEnd = new Date(split[4].substr(0,10));
				}
			}
			
			var start, end;
			var csv = "Date,Articles\n";
			var facet = response.facet_counts.facet_dates[this.field.replace(/^\{.*\}/,"")];
			for (var key in facet) {
				var val = facet[key];
				switch (key) {
				case 'start':
					if (!start) start = new Date(val.substr(0,10));
					break;
				case 'end':
					if (!end) end = new Date(val.substr(0,10));
					break;
				case 'gap':
				case 'before':
				case 'after':
				case 'between':
					break;
				default:
					var count = parseInt(val);
					var d = new Date(key.substr(0,10))
					values[getDate(d)]=count;
					if (!wStart || !wEnd || (wStart <= d && d <= wEnd)) {
						if(maxCount<count) maxCount=count;
					}
				break;
				}
			}
			if (wStart) {wStart.setHours(12); wStart.setDate(wStart.getDate()-1);}
			if (wEnd) {wEnd.setHours(12);}
			
			var maxCount = 10*Math.ceil((maxCount+1)/10);

			// TODO: Ingore sparse margins.
			var first = true;
			var zeros = "";
			var last = new Date();
			for (var cd = new Date(start); cd <= end; cd.setDate(cd.getDate()+1)) {
				if(values[getDate(cd)]) {
					csv = csv + zeros + printDate(cd) + "," + values[getDate(cd)] + "\n" ;
					zeros = "";
					first = false;
					last = new Date(cd);
				} else {
					if (first)
						zeros = printDate(cd) + ",0\n" ;
					else
						zeros = zeros + printDate(cd) + ",0\n" ;
					if (end - cd < 1000*60*60*24) {
						last.setDate(last.getDate()+1);
						csv = csv + printDate(last) + ",0\n" ;
					}
				}
			}

			var self = this;
			var target = $(this.target)[0];
			var window = null;
			// Zoom in if facet is constrained.
			if (wStart && wEnd) window = [wStart.getTime(), wEnd.getTime()];

			var chart = new Dygraph(target, csv, {
				valueRange: [0, maxCount],
				fillGraph: true,
				labelsShowZeroValues: true,
				zoomCallback: function(minX, maxX, yRange) {
					self.clear();
					var from = new Date(minX), to = new Date(maxX);
					// set from-time to 00:00:00
					from.setHours(0); from.setMinutes(0); from.setSeconds(0); from.setDate(from.getDate() + 1);
					// set to to 00:00:00 of the next day.
					to.setHours(23); to.setMinutes(59); to.setSeconds(59); to.setMilliseconds(999);
					var val = '[' + date2solrString(from) + ' TO ' + date2solrString(to) + ']'; 
					self.add(val);
					self.manager.doRequest(0);
				},
				axes: {
					x: {
						axisLabelWidth: 80,
						axisLabelFormatter: function(d, gran) {
							if (d.getHours() == 0)
								return printDate(d);
							return "";
						}
					}
				},
				dateWindow: window,
				drawYAxis: false
			});
		}
	});
})(jQuery);

// Things to look at:
// jQuery.getScript()
// http://www.dustindiaz.com/scriptjs