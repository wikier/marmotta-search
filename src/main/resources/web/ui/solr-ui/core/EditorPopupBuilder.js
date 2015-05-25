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
SolrUI.EditorPopupBuilder = SolrUI.Class.extend({

    background : 'popup_background',

    popup : 'popup',

    formFields : {},

    coreFields : {},

    init : function(fields) {
        //TODO get fields
        this.coreFields = fields;
    },

    removeField : function(id) {
        delete this.formFields[id];
    },

    addField : function(options) {

        //test options
        if(!isValid(options)) throw "Cannot add field, options are not valid!";
        function isValid(options) {
            if(!options.id) return false;
            if(!options.label) return false;
            return true;
        }

        function TextInput(options) {
            var input = $("<input>");

            if(options.onchange) input.change(function(){options.onchange(input.val())});

            var optional = options.optional ? "(optional)" : "";
            if(options.value) input.val(options.value);

            this.getDomElement = function() {
                return $("<tr></tr>")
                        .append($("<td></td>").text(options.label+" "+optional))
                        .append($("<td></td>").append(input));
            }

            this.getData = function() {
                if(!options.optional) {
                    if(input.val()=="") throw "Value '"+options.label+"' my not be empty!";
                }
                return input.val()=="" ? undefined : input.val();
            }
        }

        function FieldSelector(options) {
            var select = $("<select></select>");

            if(options.onchange) select.change(function(){options.onchange(select.val())});

            var optional = "";
            if(options.optional) {
                select.append("<option value=''>-</option>");
                optional = "(optional)";
            }

            for (var i = 0; i < options.options.length; i++) {
                var opt = options.options[i];
                opt.label = opt.label ? opt.label : opt.value;
                $("<option></option>").text(opt.label).attr('value',opt.value).appendTo(select);
            }

            if(options.value) select.val(options.value);

            this.getDomElement = function() {
                return $("<tr></tr>")
                        .append($("<td></td>").text(options.label+" "+optional))
                        .append($("<td></td>").append(select));
            }

            this.getData = function() {
                if(!options.optional) {
                    if(select.val()=="") throw "Value '"+options.label+"' my not be empty!";
                }
                return select.val()=="" ? undefined : select.val();
            }
        }

        try {
            switch(options.type) {
                case 'text': this.formFields[options.id] = new TextInput(options);break;
                case 'select': this.formFields[options.id] = new FieldSelector(options);break
                default: this.formFields[options.id] = new TextInput(options);
            }
        } catch (e) {
            throw "Cannot add field: "+e;
        }
    },

    renderBody : function() {
        var table = $('.'+this.popup+'_table','#'+this.popup).empty();

        //append fields
        for(var i in this.formFields) {
            table.append(this.formFields[i].getDomElement());
        }
    },

    show : function(title) {
        var self = this;

        $('body').append("<div id='"+this.background+"'></div>");

        $('body').append("<div id='"+this.popup+"'><h1 class='"+this.popup+"_title'>"+title+"</h1><div class='"+this.popup+"_body'><table class='"+this.popup+"_table'></table></div><div class='"+this.popup+"_buttons'></div></div>");

        this.renderBody();

        //append buttons
        $("<button></button>").text('Cancel').click(function(){
            self.hide();
        }).appendTo($('.'+this.popup+'_buttons','#'+this.popup));

        $("<button></button>").text('Apply').click(function(){
            self.store();
        }).appendTo($('.'+this.popup+'_buttons','#'+this.popup));

        $("#"+this.popup).show();
    },

    hide : function() {
        $("#"+this.popup).remove();
        $("#"+this.background).remove();
    },

    store : function() {
        try {
            var data = {};
            for(var property in this.formFields) {
                data[property] = this.formFields[property].getData();
            }
            this.onStore(data);
            this.hide();
        } catch(e) {
            alert(e);
        }
    },

    onStore : function(data) {
        //TODO should be overwritten by user
        alert(data);
    }

})