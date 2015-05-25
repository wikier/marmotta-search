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

AjaxSolr.theme.prototype.result = function (doc, snippet, response) {
  var link = '';
  if(doc.lat != undefined) {
     link = ' <img style="cursor:pointer" src="img/gmap_marker_default.gif" onclick="loadTitleMap('+doc.lat+','+doc.lng+',event);"/>';
  }
  var title = htmlEncode(doc.title);
  if (response && response.highlighting && response.highlighting[doc.id]) {
	  var title = (response.highlighting[doc.id].title+"").replace(/<Title>/,"undefined");
  }
  var output = '<div class="result"><h2><a href="'+baseURI+'/resource?uri='+encodeURIComponent(doc.uri)+'">' + title + '</a>'+link+'</h2>';
  output += '<h4><b>Last modifiy:</b> '+doc.date+' </h4>';
  output += '<table><tr><td style="padding:5px">';
//  output += "<img src='"+doc.thumbnail+"'></td><td style='padding:5px'>"; 
  output += '<p>' + snippet + '</p></td></tr></table></div>';
  return output;
};

AjaxSolr.theme.prototype.snippet = function (doc, response) {
  if (response && response.highlighting && response.highlighting[doc.id]) {
	  var output = response.highlighting[doc.id].summary;
	  return output;
  }
  var output = doc.summary;
  return output;
};

AjaxSolr.theme.prototype.tag = function (facet, weight, handler) {
  return $('<a href="#" class="tagcloud_item"/>').text(facet.value+"("+facet.count+") ").addClass('tagcloud_size_' + weight).click(handler);
};

AjaxSolr.theme.prototype.facet_link = function (value, handler) {
  return $('<a href="#"/>').text(value).click(handler);
};

AjaxSolr.theme.prototype.no_items_found = function () {
  return 'no items found in current selection';
};

})(jQuery);

function htmlEncode(value){
  return (""+value).replace(/&/,"&amp;").replace(/</,"&lt;").replace(/>/,"&gt;");
}



