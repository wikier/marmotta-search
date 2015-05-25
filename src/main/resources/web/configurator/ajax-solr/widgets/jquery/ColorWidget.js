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
        f.append($("<span>", {style: "width: 20px; height: 20px; display: inline-block; background-color: " + color}).html('&nbsp;'));
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
        var cs = sc.replace(/^("?)(.*)\1$/, "$2").split(',');
        return '#' + toHex(cs[0]) + toHex(cs[1]) + toHex(cs[2]);
}

