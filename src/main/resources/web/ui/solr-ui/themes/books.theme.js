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
  output += '<h4 class="title">'+ doc.id + '</a></h4>';
  output += '<p class="preview">' + snippet + '</p>';
  var date = new Date(doc.created);

  output += '<p class="meta">' + 'created: ' + date + '</div></li>';
  
  return output;
};

AjaxSolr.theme.prototype.snippet = function (doc, response) {
  var output = '';
  if (response && response.highlighting && response.highlighting[doc.id] && response.highlighting[doc.id].uri) {
    var desc = response.highlighting[doc.id].uri + '';
    output += desc;
  } else {
    var desc = doc.uri +'';
    if (desc.length > 300) {
      output += desc.substring(0, 300) + " " + "...";
      output += '<span style="display:none;">' + desc.substring(300);
      output += '</span> <a href="#" class="more">[read more]</a>';
    } else {
      output += desc;
    }
  }
  return output;
};


AjaxSolr.theme.prototype.no_items_found = function () {
  return 'no items found in current selection';
};
})(jQuery);