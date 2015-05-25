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
/**
  *
  */
AjaxSolr.ColorWidget = AjaxSolr.AbstractFacetWidget.extend({
    mapping: {        
        "#202020": "black",
        "#0087BD": "blue",
        "#009F6B": "green",
        "#9A9898": "grey",
        "#C40233": "red",
        "#FFD300": "yellow",
        "#EEEEEE": "white"
        },
    afterRequest: function() {
        if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
            $(this.target).html(AjaxSolr.theme('no_items_found'));
            return;
        }
        $(this.target).empty();
        for (var c in this.manager.response.facet_counts.facet_fields[this.field]) {
            var color = AjaxSolr.ColorWidget.solr2color(c);
            $(this.target).append(this.createFacet(color, this.manager.response.facet_counts.facet_fields[this.field][c]).click(this.clickHandler(c))).append(" ");
        }
    },
    createFacet: function(color, count) {
        var lbl = this.mapping[color.toUpperCase()] || color;
        var f = $("<a>");
        f.append($("<span>", {style: "width: 16px; height: 16px; display: inline-block; background-color: " + color}));
        f.append($("<span>").text(" " + lbl + " (" + count + ")"));
        return f;
    }
});

AjaxSolr.ColorWidget.solr2color = function(sc) {
        function toHex(d) {
            var s = parseInt(d).toString(16);
            if (s.length < 2) return "0"+s;
            return s;
        }
        var cs = sc.split(',');
        return '#' + toHex(cs[0]) + toHex(cs[1]) + toHex(cs[2]);
}
