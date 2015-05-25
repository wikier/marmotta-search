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
function TagcloudWidget() {

    var _field_type_classes = ['org.apache.solr.schema.TextField'];

    this.getName = function() {
        return "TagcloudWidget";
    }

    this.getFieldTypeClasses = function() {
        return _field_type_classes;
    }

    this.getSolrWidget = function() {
        var widget = new AjaxSolr.TagcloudWidget({
            id: this.options.id,
            target: '#' + this.options.id,
            field: this.options.field
        })
        if(this.options.sort=='lexical') widget.sorted = true;
        return widget;
    }

    this.setParams = function(params) {
        if(params['facet.field']) {
            params['facet.field'].push(this.options.field)
        } else {
            params['facet.field'] = [];
            params['facet.field'].push(this.options.field);
        }

        if(this.options.limit) {
            params['f.'+this.options.field+'.facet.limit']=this.options.limit;
        }

        return params;
    }
}
