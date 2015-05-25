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
SolrUI.InputComponent = SolrUI.AbstractComponent.extend({

    options : {
        id : "textfield"
    },

    init : function(manager,options) {
        $.extend(this.options,options);
        manager.addWidget(new AjaxSolr.TextWidget({
            id: this.options.id,
            input: this.options.textInputField,
            submit: this.options.runSearchButton,
            prefix : this.options.prefix,
	        postfix : this.options.postfix
        }));
    },

    setEditable : function(mode) {
        var self = this;
        if(mode) {
            var button = $("<button></button>").text('edit').click(function(){
                var popup = new SolrUI.EditorPopupBuilder();
                popup.onStore = function(data) {
                    self.options.prefix = data.prefix;
                    self.options.postfix = data.postfix;
                    self.onUpdate();
                }
                var x = function(x){
                    popup.removeField('postfix');
                    popup.renderBody();
                }
                popup.addField({type:"select",id:"prefix",label:"Prefix",optional:true,value:self.options.prefix,onchange:x,
                    options:[{label:"eins",value:"one"},{value:"two"}]
                });
                popup.addField({id:"postfix",label:"Postfix",optional:true,value:self.options.postfix});
                popup.show("Edit Input Component");
            });
            $(this.options.editButtons).append(button);
        }
        else $(this.options.editButtons).empty();
    },

    getConfiguration : function() {
        return this.options;
    }

});