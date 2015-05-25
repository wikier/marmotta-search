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

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
  mappers : {},
  image:{"remove":"img/remove.png"},
  afterRequest: function () {
    var self = this;
    var links = [];

    var fq = this.manager.store.values('fq');
    for (var i = 0, l = fq.length; i < l; i++) {
      var split = fq[i].split(":");
      var value = split[split.length-1];
      var name = "";
      for(var j=0; j<split.length-1; j++) {
          if(j==0) name = split[0];
          else name = name+":"+split[j];
      }
      var t = this.mappers[name];
      var display;
      if(t!=null) {
        if (typeof t === 'string')
           display = t+":"+value;
        else
           display = t(value);
      } else {
         display = name+":"+value;
      }
      if (fq[i].match(/\[.*TO.*\]/)) {
    		    var field = fq[i].match(/\w+:/)[0];
    		    var values = fq[i].match(/\d{4}(-\d{2}){2}/g);
    		    // links.push($('<a href="#"/>').text('(x) ' + field + value).click(self.removeFacet(fq[i])));
    		    links.push($('<a href="#"/>').html(field + values[0] + " to " + values[1] + "<img style='margin-left:2px;' src='"+this.image.remove+"'>").click(self.removeFacet(fq[i])));
    		  }
    		  else {
    		    // links.push($('<a href="#"/>').text('(x) ' + fq[i]).click(self.removeFacet(fq[i])));
    		    links.push($('<a href="#"/>').html(display+"<img style='margin-left:2px;' src='"+this.image.remove+"'>").click(self.removeFacet(fq[i])));
    		  }
    }

    
    if (links.length > 1) {
      links.unshift($('<a href="#"/>').text('remove all').click(function () {
        self.manager.store.remove('fq');
        self.manager.doRequest(0);
        return false;
      }));
    }
    

    if (links.length) {
      AjaxSolr.theme('list_items', this.target, links);
      $(this.target).attr("class","selection-active");
      /*$(this.target).prepend("<h2>Selected</h2>");*/
    }
    else {
      $(this.target).attr("class","");
      $(this.target).html('<p>Currently no active filters</p>');
    }
  },
  

  removeFacet: function (facet) {
    var self = this;
    return function () {
      if (self.manager.store.removeByValue('fq', facet)) {
        self.manager.doRequest(0);
      }
      return false;
    };
  }
});
    })(jQuery);
