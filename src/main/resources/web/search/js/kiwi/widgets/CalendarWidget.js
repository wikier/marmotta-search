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

AjaxSolr.CalendarWidget = AjaxSolr.AbstractFacetWidget.extend({
  afterRequest: function () {
    var self = this;
    $(this.target).datepicker('destroy').datepicker({
      dateFormat: 'yy-mm-dd',
      defaultDate: new Date(1987, 2, 1),
      maxDate: $.datepicker.parseDate('yy-mm-dd', this.manager.store.get('facet.date.end').val().substr(0, 10)),
      minDate: $.datepicker.parseDate('yy-mm-dd', this.manager.store.get('facet.date.start').val().substr(0, 10)),
      nextText: '&gt;',
      prevText: '&lt;',
      beforeShowDay: function (date) {
        var value = $.datepicker.formatDate('yy-mm-dd', date) + 'T00:00:00Z';
        var count = self.manager.response.facet_counts.facet_dates[self.field][value];
        return [ parseInt(count) > 0, '', count + ' documents found!' ];
      },
      onSelect: function (dateText, inst) {
        if (self.add('[' + dateText + 'T00:00:00Z TO ' + dateText + 'T23:59:59Z]')) {
          self.manager.doRequest(0);
        }
      }
    });
  }
});

