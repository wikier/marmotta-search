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
AjaxSolr.TimeChartWidget = AjaxSolr.AbstractFacetWidget.extend({
    dygraph: null,
    graphOpts: null,
    multivalue: false,
    perDay: false,
    buildData: function() {
        function noData() {
            return {
                window : null,
                data : [ [ new Date() ] ]
            };
        }
        // Where to take the data from
        var response = this.manager.response;
        var fCounts = response.facet_counts;
        if (!fCounts) return noData();
        var plainField = this.field.replace(/^\{.*\}/, "");

        var src = fCounts.facet_ranges[plainField] || fCounts.facet_dates[plainField];
        if (!src) return noData();
        
        // Build the data Array
        var data = [];
        var facets = src.counts || src;
        for ( var key in facets) {
            var val = facets[key];
            if (/^\d{4}(-\d\d){2}T\d\d(:\d\d){2}Z$/.test(key)) {
                // This is a date!
                var count = parseInt(val);
                var d = new Date(key)
                data.push([d, count]);
            }
        }
        var start = new Date(src.start);
        var end = new Date(src.end);
        
        if (data.length == 0) return noData();

         // determine zoomWindow
        var fqs = [].concat(response.responseHeader.params['fq']);
        for ( var fq in fqs) {
            var fqv = fqs[fq];
            if (fqv && fqv.match(new RegExp('^-?' + this.field + ':'))) {
                var split = fqv.split(/ *([\[\]]|TO) */);
                if (/^\d{4}(-\d\d){2}T\d\d(:\d\d){2}Z$/.test(split[2]))
                    start = new Date(split[2]);
                if (/^\d{4}(-\d\d){2}T\d\d(:\d\d){2}Z$/.test(split[4]))
                    end = new Date(split[4]);
            }
        }
        // TODO: Maybe ingore sparse margins?
        var window = [start.getTime(), end.getTime()];
        
        return { window: window, data: data };
    },
    init: function() {
        this.initStore();
        
        var self = this;
        // build ui
        var target = $(this.target).empty();
        var btns = $("<div>").attr('style', 'display: inline-block; width: 100%').appendTo(target);
        var container = document.createElement("div");
        target.append(container);
        
        // Some extra buttons...
        var btn_allB = $("<button class='time-chart-button'>").text("*").attr('style', 'float: left').appendTo(btns).click(
                function() {
                    self.zoomHandler(null, self.dygraph.xAxisRange()[1]);
                });
        var btn_before = $("<button class='time-chart-button'>").text("<").attr('style', 'float: left').appendTo(btns).click(
                function() {
                    var int = self.dygraph.xAxisRange();
                    var from = int[0];
                    var to = int[1];
                    from = from - ((to - from) / 2);
                    self.zoomHandler(new Date(from), new Date(to));
                });
        var btn_allL = $("<button class='time-chart-button'>").text("*").attr('style', 'float: right').appendTo(btns).click(
                function() {
                    self.zoomHandler(self.dygraph.xAxisRange()[0], null);
                });
        var btn_later = $("<button class='time-chart-button'>").text(">").attr('style', 'float: right').appendTo(btns).click(
                function() {
                    var int = self.dygraph.xAxisRange();
                    var from = int[0];
                    var to = int[1];
                    to = to + ((to - from) / 2);
                    self.zoomHandler(new Date(from), new Date(to));
                });

        // Display for the legend
        var display = document.createElement("div");
        $(display).attr('style', 'text-align: center;').appendTo(btns);
        
        $(container).width(this.width).height(this.height - btns.height());
        
        // Some default opts
        var opts = {
            //valueRange : [ 0, maxCount ],
            fillGraph : true,
            labelsDiv: display, 
            labelsShowZeroValues : true,
            labels: ["Date", "Results"],
            zoomCallback : function(minX, maxX, yRange) {
                var from = new Date(minX), to = new Date(maxX);
                self.zoomHandler(from, to);
            },
            xAxisLabelWidth : '60',
            axes : {
                x : {
                    valueFormatter: function(ms, a, b, c, d) {
                        if (self.perDay)
                            return new Date(ms).strftime('%d.%m.%Y');
                        return new Date(ms).strftime('%B %Y');
                    },
                    axisLabelFormatter : function(date, granularity, opt, dygraph) {
                        var lbl;
                        if (granularity >= Dygraph.DECADAL) {
                            lbl = date.strftime('%Y');
                        } else if (granularity >= Dygraph.MONTHLY) {
                            lbl = date.strftime('%b %y');
                        } else {
                            lbl = date.strftime('%d.%m.%y');
                        }
                        return lbl;
                    }
                }
            },
            drawYAxis : false
        };
        // override with specified
        if (this.graphOpts) $.extend(true, opts, this.graphOpts);

        // build the graph...
        var graphData = self.buildData();
        $.extend(true, opts, {
            dateWindow : graphData.window,
            valueRange: null
        });
        this.dygraph = new Dygraph(container, graphData.data, opts);
    },
    afterRequest : function() {
        var graphData = this.buildData();
        this.dygraph.updateOptions({
            dateWindow : graphData.window,
            valueRange: null,
            file: graphData.data
        });
    },
    beforeRequest: function() {
        //      var gap = "+1MONTH";
    },
    zoomHandler: function(from, to) {
        var _from, _to;
        if (from) {
            if (typeof from == "number") from = new Date(from);
            // set from-time to 00:00:00
            from.setHours(0);
            from.setMinutes(0);
            from.setSeconds(0);
            from.setDate(from.getDate() + 1);
            _from=from.strftime("%Y-%m-%dT%H:%M:%SZ");
        } else {
            _from = "*";
            from = new Date("1997-01-01T00:00:00Z")
        }
        if (to) {
            if (typeof to == "number") to = new Date(to);
            // never to the future ;-)
            to = new Date(Math.min(to, new Date()));
            // set to to 23:59:59 .
            to.setHours(23);
            to.setMinutes(59);
            to.setSeconds(59);
            to.setMilliseconds(999);
            _to = to.strftime("%Y-%m-%dT%H:%M:%SZ");
        } else {
            _to = "*";
            to = new Date();
        }

        var plainField = this.field.replace(/^\{.*\}/, "");
        var yiS = 1.6 * 365 * 24 * 60 * 60 * 1000;
        if ((to.getTime() - from.getTime()) < yiS) {
            this.manager.store.addByValue('f.' + plainField + '.facet.date.gap', '+1DAY');
            this.perDay = true;
        } else {
            this.manager.store.addByValue('f.' + plainField + '.facet.date.gap', '+1MONTH');
            this.perDay = false;
        }
        
        var val = '[' + _from + ' TO ' + _to + ']';
        if (this.set(val))
            this.manager.doRequest(0);
    },
    width: 480,
    height: 320
});

// This should fix a nasty bug with the ticks...
Dygraph.getDateAxis = function(start_time, end_time, granularity, opts, dg) {
    var formatter = opts("axisLabelFormatter");
    var ticks = [];
    var t;

    if (granularity < Dygraph.MONTHLY) {
        // Generate one tick mark for every fixed interval of time.
        var spacing = Dygraph.SHORT_SPACINGS[granularity];

        // Find a time less than start_time which occurs on a "nice" time
        // boundary
        // for this granularity.
        var g = spacing / 1000;
        var d = new Date(start_time);
        var x;
        if (g <= 60) { // seconds
            x = d.getSeconds();
            d.setSeconds(x - x % g);
        } else {
            d.setSeconds(0);
            g /= 60;
            if (g <= 60) { // minutes
                x = d.getMinutes();
                d.setMinutes(x - x % g);
            } else {
                d.setMinutes(0);
                g /= 60;

                if (g <= 24) { // days
                    x = d.getHours();
                    d.setHours(x - x % g);
                } else {
                    d.setHours(0);
                    g /= 24;

                    if (g == 7) { // one week
                        d.setDate(d.getDate() - d.getDay());
                    }
                }
            }
        }
        start_time = d.getTime();

        for (t = start_time; t <= end_time; t += spacing) {
            ticks.push({
                v : t,
                label : formatter(new Date(t), granularity, opts, dg)
            });
        }
    } else {
        // Display a tick mark on the first of a set of months of each year.
        // Years get a tick mark iff y % year_mod == 0. This is useful for
        // displaying a tick mark once every 10 years, say, on long time scales.
        var months;
        var year_mod = 1; // e.g. to only print one point every 10 years.

        if (granularity == Dygraph.MONTHLY) {
            months = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
        } else if (granularity == Dygraph.QUARTERLY) {
            months = [ 0, 3, 6, 9 ];
        } else if (granularity == Dygraph.BIANNUAL) {
            months = [ 0, 6 ];
        } else if (granularity == Dygraph.ANNUAL) {
            months = [ 0 ];
        } else if (granularity == Dygraph.DECADAL) {
            months = [ 0 ];
            year_mod = 3;
        } else if (granularity == Dygraph.CENTENNIAL) {
            months = [ 0 ];
            year_mod = 30;
        } else {
            Dygraph.warn("Span of dates is too long");
        }

        var start_year = new Date(start_time).getFullYear();
        var end_year = new Date(end_time).getFullYear();
        var zeropad = Dygraph.zeropad;
        for ( var i = start_year; i <= end_year; i++) {
            if (i % year_mod !== 0)
                continue;
            for ( var j = 0; j < months.length; j++) {
                var date_str = i + "/" + zeropad(1 + months[j]) + "/01";
                t = Dygraph.dateStrToMillis(date_str);
                if (t < start_time || t > end_time)
                    continue;
                ticks.push({
                    v : t,
                    label : formatter(new Date(t), granularity, opts, dg)
                });
            }
        }
    }

    return ticks;
};

// Things to look at:
// jQuery.getScript()
// http://www.dustindiaz.com/scriptjs
