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
function AbstractWidget() {

    //definition of variables
    var _box;
    this.options =  {
        template:   '<div class="widget_box">' +
                    '   <input id="ac-1" name="accordion-1" type="checkbox" checked />  ' +
                    '   <label class="widget_label" for="ac-1"></label>  ' +
                    '   <nav class="ac-small"> ' +
                    '   <ul class="facet_list"> ' +
                    '       <div class="inner_box"></div>' +
                    '   </ul>' +
                    '   </nav>' +
                    '</div>',
        classes: {
            label:'widget_label',
            content: 'inner_box'
        }
    };

    //is done on initialisation
    this.init = function(options) {

        $.extend(this.options,options);

        if(!this.options.label) throw this.getName()+": label must not be undefined";
        if(!this.options.id) this.options.id = Math.floor(Math.random() * 10001);

        _box = $(this.options.template);
        _box.attr("id","box_"+this.options.id);
        _box.find("."+this.options.classes.label).text(this.options.label);
        _box.find("."+this.options.classes.content).attr("id",this.options.id);
        _box.find("#"+this.options.id).text(this.getName());
    }

    this.getBox = function() {
        return _box;
    }

    //to identify the implementation of the abstract widget
    this.getName = function() {
        return "AbstractWidget";
    }

    this.getSolrWidget = function() {
        return undefined;
    }

    //returns a list of (solr) 'types' which one are supported by the widget
    this.getFieldTypeClasses = function() {
        return [];
    }

    this.setParams = function(params) {
        return params;
    }

    this.getMapper = function() {
        return this.options.mappers ? this.options.mappers : {};
    }

}