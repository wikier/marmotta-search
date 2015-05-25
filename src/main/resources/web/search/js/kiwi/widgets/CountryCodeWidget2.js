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
//(function ($) {
	google.load('visualization', '1', {'packages':['geochart']});

	/**
	 * AjaxSolr.CountryCodeWidget facades the country codes of the search results
	 * TODO: needs some work on intelligent zooming (depending on the facaded values)
	 * Requires http://www.google.com/jsapi and jQuery
	 * <script type='text/javascript' src='http://www.google.com/jsapi'></script>
	 */
	AjaxSolr.CountryCodeWidget = AjaxSolr.AbstractFacetWidget.extend({
		initialized: false,
		chart: null,
		chartOptions: {},
		init: function() {
	        this.initStore();
			var self = this;
			// this is where the real initialisation is done.
			function initCCW() {
				var container = $(self.target)[0];
				self.chart = new google.visualization.GeoChart(container);
				google.visualization.events.addListener(self.chart, 'regionClick', function(event) {self.regionClick(event.region)});

				if (self._queued) {
					self._queued();
				} else {
					var data = new google.visualization.DataTable();
					data.addColumn('string', 'Country');
					data.addColumn('number', 'Results');
					data.addRow(['world',0]);
					self.chart.draw(data, self.chartOptions);
				}
				self.initialized = true;
			}
			// load the additional google libs
			google.setOnLoadCallback(initCCW);
			return false;
		},
		afterRequest: function () {
			var self = this;
			var facets = this.manager.response.facet_counts.facet_fields[this.field];

			var data = new google.visualization.DataTable();
			data.addColumn('string', 'Country');
			data.addColumn('number', 'Results');
			
			for (var facet in facets) {
				if (facet.length == 2) { // only display country codes
					var c = facets[facet];
					data.addRow([facet, c]);
				}
			}
			if (data.getNumberOfRows() < 1) {
				data.addRow(['world',0]);
			}
			function drawCCW(gData) {
				self.chart.draw(gData, self.chartOptions);
				self._queued = null;
			};
			if (!this.initialized) {
				self._queued = function() {drawCCW(data);};
			} else {
				drawCCW(data);
			}
		},
		regionClick: function( countryCode ) {
			console.log("CCW: clicked " + countryCode);
			this.set(countryCode);
			this.manager.doRequest(0);
		},
		_queued: null
	});
//})(jQuery);
