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

AjaxSolr.ChartWidget = AjaxSolr.AbstractFacetWidget.extend({
  afterRequest: function () {
    //get start and end

    $(this.target).empty();
    var values = [];
    var maxCount = 9;
    var getDate = function(d) {return (d.getMonth()+1)+"/"+d.getDate()+"/"+(d.getYear()+1900)};
    for (var facet in this.manager.response.facet_counts.facet_dates[this.field]) {
        var count = parseInt(this.manager.response.facet_counts.facet_dates[this.field][facet]);
        if(facet != 'end' && facet!= 'gap' && facet!= 'start') {
            facet = new Date(facet.substr(0, 10));
            values[getDate(facet)]=count;
            if(maxCount<count) maxCount=count;
        }
    }
    var maxCount = 10+Math.round(maxCount/10)*10;
    var start = this.manager.store.get('facet.date.start').val().substr(0, 10);
    var end = this.manager.store.get('facet.date.end').val().substr(0, 10);

    var startDate = new Date(start);
    var endDate = new Date(end);

    var list = [];
    var ld = (endDate-startDate)/86400000;

    for(var i=0;i<ld+1;i++){
         if(values[getDate(startDate)]) {
             list.push(values[getDate(startDate)]);
         } else {
             list.push(0);
         }
         startDate.setDate(startDate.getDate()+1);
    }

    var EXTENDED_MAP='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.';
    var EXTENDED_MAP_LENGTH = EXTENDED_MAP.length;
    var extendedEncode = function(arrVals, maxVal) {
        var chartData = 'e:';

        for(var prop in arrVals) {
            // In case the array vals were translated to strings.
            var numericVal = new Number(arrVals[prop]);
            // Scale the value to maxVal.
            var scaledVal = Math.floor(EXTENDED_MAP_LENGTH * EXTENDED_MAP_LENGTH * numericVal / maxVal);

            if(scaledVal > (EXTENDED_MAP_LENGTH * EXTENDED_MAP_LENGTH) - 1) {
                chartData += "..";
            } else if (scaledVal < 0) {
                chartData += '__';
            } else {
                // Calculate first and second digits and add them to the output.
                var quotient = Math.floor(scaledVal / EXTENDED_MAP_LENGTH);
                var remainder = scaledVal - EXTENDED_MAP_LENGTH * quotient;
                chartData += EXTENDED_MAP.charAt(quotient) + EXTENDED_MAP.charAt(remainder);
            }
        }

      return chartData;
    }
    var src = 'http://chart.apis.google.com/chart?chxl='+
            '0:|'+start+'|'+end+'|1:|0|'+maxCount+'|2:|0|'+maxCount+
            '&chxs=0,00AA00,14,0.5,l,676767&chxt=x,r,y&chs=350x180&cht=lc&chd='+extendedEncode(list,maxCount)+'&chg=20,25&chls=1';
    $('<img/>').attr('src', src).appendTo(this.target);
  }
});

