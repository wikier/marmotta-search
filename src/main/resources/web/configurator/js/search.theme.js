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
(function ($) {

AjaxSolr.theme.prototype.result = function (doc, snippet) {
  
  var output = '<div><h3 class="supertitle"><p id="links_' + doc.id + '"class="metainfo"></p></h3>';
  if (__configuration.results.title && __configuration.results.title != "") {
      if (__configuration.results.link && __configuration.results.link != "") {
          output += '<h4 class="title"> <a href="'+doc[__configuration.results.link]+'">' + doc[__configuration.results.title] + '</a></h4>';
      } else {
          output += '<h4 class="title">' + doc[__configuration.results.title] + '</h4>';
      }
  }
  if (__configuration.results.author && __configuration.results.author != "") {
      output += '<h5>by '+doc[__configuration.results.author]+'</h5>';
  }
  if(__configuration.results.thumb && __configuration.results.thumb != "" && doc[__configuration.results.thumb]) {
	output += '<img class="left" src="'+doc[__configuration.results.thumb]+'"/>';
  }
  if (snippet) {
      output += '<p class="preview">' + snippet + '</p>';
  }
  if (__configuration.results.created && __configuration.results.created != "") {
      var date = new Date(doc[__configuration.results.created]);
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate()-1);
      var strDate;
      if (date.strftime('%x') == yesterday.strftime('%x')) {
          strDate = "gestern";
      } else {
          strDate = date.strftime('%x');
      }
      output += '<p class="meta">' + 'created: ' + strDate + '</div></li>';
  }
  return output;
};

AjaxSolr.theme.prototype.snippet = function (doc, response) {
    if (!__configuration.results.description || __configuration.results.description == "") return null;
    
    if (response && response.highlighting && response.highlighting[doc.id] && response.highlighting[doc.id][__configuration.results.description]) {
        var desc = response.highlighting[doc.id][__configuration.results.description];
        if (!desc) return null;
        else return desc + '';
    } else {
        var desc = doc[__configuration.results.description];
        if (!desc) return null;
        var output = '';
        if (desc.length > 300) {
            output += desc.substring(0, 300) + " " + "...";
            output += '<span style="display:none;">' + desc.substring(300);
            output += '</span> <a href="#" class="more">[read more]</a>';
        } else {
            output += desc;
        }
        return output;
    }
    return null;
};

AjaxSolr.theme.prototype.tag = function (facet, weight, handler) {
  var title = facet.value;
  if (title.length > 30) {
    title = title.substring(0,30) + "...";
  }
  var output  = $('<li/>', {"class":(facet.active?"checked":"notchecked")}).append($('<a class="" href="#">' + title + '</a>').click(handler)).append('<span class="checkbox"></span>' + '<span class="facNum">' + facet.count + '</span>');
  return output;  
  
};

AjaxSolr.theme.prototype.facet_link = function (value, handler) {
  return $('<a href="#"/>').text(value).click(handler);
};

AjaxSolr.theme.prototype.no_items_found = function () {
  return 'no items found in current selection';
};
})(jQuery);