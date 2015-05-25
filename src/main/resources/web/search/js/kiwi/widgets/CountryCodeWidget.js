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

AjaxSolr.CountryCodeWidget = AjaxSolr.AbstractFacetWidget.extend({
	init: function() {
        this.initStore();
		$(this.target).html(AjaxSolr.theme('no_facets'));
	},
	afterRequest: function () {
		var target = $(this.target);
		target.empty();

		var maps = {
				world: 'view the World',
				africa: 'view Africa',
				asia: 'view Asia',
				europe: 'view Europe',
				middle_east: 'view the Middle East',
				south_america: 'view South America',
				usa: 'view North America'
		};
		target.append(AjaxSolr.theme('select_tag', 'region', AjaxSolr.theme('options_for_select', maps)));

		var self = this;
		$('#region', target).change(function () {
			$('img', target).hide();
			$('#' + self.id + $(this).val()).show();
		});

    var maxCount = 0;
    var options = { '': '--select--' };
    for (var facet in this.manager.response.facet_counts.facet_fields[this.field]) {
      if (facet.length == 2) { // only display country codes
        var count = this.manager.response.facet_counts.facet_fields[this.field][facet];
        if (count > maxCount) {
          maxCount = count;
        }
        options[facet] = facet + ' (' + count + ')';
      }
    }
    target.append(AjaxSolr.theme('select_tag', 'country', AjaxSolr.theme('options_for_select', options)));

    var self = this;
    target.find('#country').change(function () {
      var value = $(this).val();
      if (value && self.add(value)) {
        self.manager.doRequest(0);
      }
    });

    var chd = [];
    var chld = '';
    for (var facet in this.manager.response.facet_counts.facet_fields[this.field]) {
      if (facet.length == 2) { // only display country codes
        chd.push(parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet] / maxCount * 100) + '.0');
        chld += facet;
      }
    }
    var size = target.width() + "x180"
    for (var value in maps) {
      var src = 'http://chart.apis.google.com/chart?chco=f5f5f5,edf0d4,6c9642,365e24,13390a&chd=t:' + chd.join(',') + '&chf=bg,s,eaf7fe&chtm=' + value + '&chld=' + chld + '&chs='+size+'&cht=t';
      $('<img/>').attr('id', this.id + value).showIf(value == 'world').attr('src', src).appendTo(this.target);
    }
  }
});

