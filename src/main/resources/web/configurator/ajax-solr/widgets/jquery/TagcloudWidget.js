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

AjaxSolr.TagcloudWidget = AjaxSolr.AbstractFacetWidget.extend({

  sorted : false,

  afterRequest: function () {
    if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
      $(this.target).html(AjaxSolr.theme('no_items_found'));
      return;
    }

    var maxCount = 0;
    var objectedItems = [];
    for (var facet in this.manager.response.facet_counts.facet_fields[this.field]) {
      var count = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet]);
      if (count > maxCount) {
        maxCount = count;
      }
      var isActive = false;
      if (this.manager.response.responseHeader.params["fq"])
        isActive = this.manager.response.responseHeader.params["fq"].indexOf(this.fq(facet)) >= 0;
      
      objectedItems.push({ facet: facet, count: count , active:isActive });
    }
    if(this.sorted) {
    objectedItems.sort(function (a, b) {
      return a.facet < b.facet ? -1 : 1;
    });
    }

    $(this.target).empty();
    for (var i = 0, l = objectedItems.length; i < l; i++) {
      var facet = objectedItems[i].facet;
      $(this.target).append(AjaxSolr.theme('tag', {value:facet,count:objectedItems[i].count, active: objectedItems[i].active}, parseInt(objectedItems[i].count / maxCount * 10), objectedItems[i].active?this.unclickHandler(facet):this.clickHandler(facet)));
    }
    if(objectedItems.length==0) {
        $(this.target).text("no facets");
    }
  }
});

})(jQuery);
