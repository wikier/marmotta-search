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
SolrUI.ResultsComponent = SolrUI.AbstractComponent.extend({
options : {
        id : "results"
    },

    init : function(manager,options) {
        $.extend(this.options,options);
        manager.addWidget(new AjaxSolr.ResultWidget({
            id: this.options.id,
            target: this.options.resultListDiv
        }));
    },

    setEditable : function(mode) {
        var self = this;
        if(mode) {
            var button = $("<button></button>").text('edit').click(function(){
                var popup = new SolrUI.EditorPopupBuilder();
                popup.onStore = function(data) {
                    self.options.title = data.title;
                    self.options.description = data.description;
                    self.onUpdate();
                }
                popup.addField({id:"title",label:"Title",optional:false,value:self.options.fields.title});
                popup.addField({id:"description",label:"Description",optional:false,value:self.options.fields.description});
                popup.show("Edit Result Component");
            });
            $(this.options.editButtons).append(button);
        }
        else $(this.options.editButtons).empty();
    },

    getConfiguration : function() {
        return this.options;
    }
})