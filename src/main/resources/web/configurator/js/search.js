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
var Manager;

function clearOldStuff() {
    $("#searchbutton").unbind();
    $("#sortResults").unbind();
    $("#pageSize").unbind();
}

function setManager(configuration,core) {

    var ROOT = "../../";
    //var ROOT = "http://localhost:8080/LMF/";

    //set widgets stuff
    $("#widget_box_container").empty();
    var widget_template = '<div class="widget_box" id="box_${id}">'+
						  '<input id="ac-${id}" name="accordion-${id}" type="checkbox" checked />  '+
										'<label class="widget_label" for="ac-${id}"></label>  '+
										'<nav class="ac-small"> '+
											'<ul class="facet_list" id="${id}"> '+
											'</ul>'+
										'</nav>'+
									'</div>';
    for (var i = 0; configuration.widgets.length > i; i++) {
        var box = $(widget_template.replace(/\$\{id\}/g, configuration.widgets[i].id));
        box.find(".widget_label").text(configuration.widgets[i].name);
        $("#widget_box_container").append(box);
    }
/*    if(configuration.widgets.length==0) {
        var box = $(widget_template);
        box.attr("id","box_not_define_widget");
        box.removeClass("widget_box");
        box.find(".widget_label").text("No Widget defined");
        box.find(".inner_box").attr("id","not_define_widget");
        $("#widget_box_container").append(box);
    }
*/
    clearOldStuff();

  $(function () {
    Manager = new AjaxSolr.Manager({
      solrUrl: ROOT + 'solr/'+core+'/'
    });

    Manager.addWidget(new AjaxSolr.ResultWidget({
      id: 'result',
      target: '#docs'      
    }));

    Manager.addWidget(new AjaxSolr.DropDownParamWidget({
      id: 'sort',
      param: 'sort',
      target: 'select.sort',
      values: {"relevance":'score desc', "date descending": 'lmf.created desc', "date ascending": 'lmf.created asc'}
    }));

    Manager.addWidget(new AjaxSolr.DropDownParamWidget({
      id: 'rows',
      param: 'rows',
      target: '#pageSize',
      values: [10,15,25],
	  default: 15
    }));

    Manager.addWidget(new AjaxSolr.PagerWidget({
      id: 'pager',
      target: '#pager',
      prevLabel: '&laquo;',
      nextLabel: '&raquo;',
      innerWindow: 1,
      renderHeader: function (perPage, offset, total) {
        $('#pager-header').html($('<span/>').text('Shown results: ' + Math.min(total, offset + 1) + ' to ' + Math.min(total, offset + perPage) + ' of ' + total));
      }
    }));

    var mappers = {}

    for (var i = 0, l = configuration.widgets.length; i < l; i++) {
      if(configuration.widgets[i].type=="text") {
      Manager.addWidget(new AjaxSolr.TagcloudWidget({
        id: configuration.widgets[i].id,
        target: '#' + configuration.widgets[i].id,
        field: configuration.widgets[i].field
      }));
      if(configuration.widgets[i].mapper)mappers[configuration.widgets[i].field]=configuration.widgets[i].mapper;
      } else if(configuration.widgets[i].type=="color") {
        Manager.addWidget(new AjaxSolr.ColorWidget({
            id: configuration.widgets[i].id,
            target: '#'+configuration.widgets[i].id,
            field: configuration.widgets[i].field
        }));
         var x = "";
          if(configuration.widgets[i].mapper){
                            x='&nbsp;<span>('+configuration.widgets[i].mapper+')</span>';
                        }

        mappers[configuration.widgets[i].field]= function(value) {
                        var a = $("<a>", {href:"#"})
                        a.append($("<span style='width: 20px; height: 20px; display: inline-block; background-color: " + AjaxSolr.ColorWidget.solr2color(value) + "'>&nbsp;</span>"));
                        a.append(x);
                        return a.html();
                    }
      }
    }

      Manager.addWidget(new AjaxSolr.InputWidget({
                id: 'inputWidget',
                target:"#searchfield",
                button:"#searchbutton",
                suggestions:"#search_suggestionbox"
      }));

       Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
                id: 'currentsearch',
                target: '#selection',
                mappers: mappers,
                image: {"remove":"images/remove.png"}
            }));

 /*
    Manager.addWidget(new AjaxSolr.AutocompleteWidget({
      id: 'text',
      target: '#search',
      field: 'text_all',
      mappers: {"genre":"(Genre)" , "title":"(Title)" , "writer":"(Writer)"},
      fields: [ 'title' , 'writer', 'genre', 'created', 'text_all']
    }));
*/
    var fields = [];
    for(var i=0;i<configuration.widgets.length;i++) {
        fields.push(configuration.widgets[i].field);
    }
    Manager.init();
    Manager.store.addByValue('q', '*:*');
    var params = {
      facet: true,
      'facet.field': fields,
      'facet.sort':'count',
      'facet.limit': 10,
      'facet.mincount': 1,
      'json.nl': 'map',
      'hl':true,
      'hl.fl':"description"
    };
    for (var name in params) {
      Manager.store.addByValue(name, params[name]);
    }

    function getUrlVars () {
        var vars = [], hash;
        var hashes = window.location.search.substr(1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }

 function getUrlVars () {
        var vars = [], hash;
        var hashes = window.location.search.substr(1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }

    function getUrlVar(name) {
        return getUrlVars()[name];
    }

    var paramMapping = {
            writer: "writer",
            genre: "genre",
            cover: "thumb_color"
    }
    for (var p in paramMapping) {
        var f = paramMapping[p],
        val = getUrlVar(p);
        if (val != null && val != "") {
            Manager.store.addByValue('fq', f + ':"' + decodeURIComponent(val) + '"');
        }
    }
    var query = getUrlVar("q");
    if (query != null && query != "") {
        Manager.widgets['search'].setQuery(decodeURIComponent(query));
    }

    Manager.doRequest();
  });

  $.fn.showIf = function (condition) {
    if (condition) {
      return this.show();
    }
    else {
      return this.hide();
    }
  }

}
