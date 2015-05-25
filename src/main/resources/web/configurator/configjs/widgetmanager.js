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
function WidgetManager(options) {

    var widgets = {};
    var _box;

    var activeWidgets = [];

    this.init = function(configuration) {
        for(var i in configuration.widgets) {
            for(var template in widgets) {
                if(template == configuration.widgets[i].type) {
                    var w = {};
                    $.extend(w,widgets[template]);
                    w.init(configuration.widgets[i]);
                    activeWidgets.push(w);
                    break;
                }
            }
        }
        for(var i in activeWidgets) {
            console.log(activeWidgets[i].options);
        }
    }

    /*
    this.run = function() {
        _box.empty();
        for(var i in widgets) {
            _box.append(widgets[i].getBox());
            //console.log(widgets[i].getFieldTypeClasses());
        }
        if(widgets.length==0) {
            var widget = new AbstractWidget();
            widget.init({label:"No widget defined"});
            _box.append(widget.getBox());
        }
    }

    this.clear = function() {
        _box.empty();
    }
    */
    this.getWidgets = function() {
        return activeWidgets;
    }

    this.addWidgetTemplate = function(widget) {
        widgets[widget.getName()] = widget;
    }

    this.removeWidget = function(id,onsuccess,onfailure) {
        for(var i in activeWidgets) {
            if(activeWidgets[i].id==id) {
                activeWidgets.slice(i,1);
                onsuccess();
                return;
            }
        }
        onfailure();
    }

    this.editWidget = function(id,onsuccess,onfailure) {
        //open widget creator
    }

    this.createWidget = function(onsuccess,onfailure) {
        //open widget creator
    }

    //return solr params (fields etc.);
    this.setParams = function(params) {
        for (var i in activeWidgets) {
            params = activeWidgets[i].setParams(params);
        }

       var obj = {
            'facet': true,
            'facet.sort':'count',
            'facet.limit': 10,
            'facet.mincount': 1,
            'json.nl': 'map'
       }
       params = $.extend(params,obj);

        return params;
    }

    this.getMappers = function() {
        var mappers = {};
        for(var i in activeWidgets) {
            $.extend(mappers,activeWidgets[i].getMapper());
        }
        return mappers;
    }
}