(function ($) {

AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
  beforeRequest: function () {
    $(this.target).html($('<div/>', {class: "result_loader"}));
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
      //self.manager.store.remove('fq');
      self.manager.store.addByValue('fq', facet_field + ':' + AjaxSolr.Parameter.escapeValue(facet_value));
      self.manager.doRequest(0);
      return false;
    };
  },

  afterRequest: function () {
    $(this.target).empty();
    for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
      var doc = this.manager.response.response.docs[i];
      $(this.target).append(AjaxSolr.theme('result', doc, AjaxSolr.theme('snippet', doc)));

      var items = [];
            items = items.concat(this.facetLinks('organisation', doc.organisation));

      items = items.concat(this.facetLinks('ort', doc.ort));
      items = items.concat(this.facetLinks('bundesland', doc.bundesland));
      items = items.concat(this.facetLinks('land', doc.land));

      AjaxSolr.theme('list_items', '#links_' + doc.id, items);
    }
  },

  init: function () {
    $('a.more').livequery(function () {
      $(this).toggle(function () {
        $(this).parent().find('span').show();
        $(this).text('[read less]');
        return false;
      }, function () {
        $(this).parent().find('span').hide();
        $(this).text('[read more]');
        return false;
      });
    });
  }
});

})(jQuery);