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

/*
 * Copyright (C) 2013 Salzburg Research.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//for external functions
var __search;
var __storage;

//default configuration (overloaded by webservice)
var __configuration = {
    "widgets" : [],
    "results" : {
        "title":"lmf.uri",
        "link":"lmf.uri",
        "author":"lmf.author",
        "description":"",
        "thumb":"",
        "created":"lmf.created"
    },
    "other" : {
        "sort":[{
            "field":"score",
            "order":"asc"
        }]
    }
}

function edit() {
    if($("#search_edit_button").attr("disabled")=="disabled") {
        new Alert("Initialization Error","No core defined! Add a corename to the url with #");return;
    }
    if($("body").hasClass("editing")) __search.save();
    else __search.edit();
}

function del() {
    new Confirm("Really?","Do you want to delete the core?",function(){
        __search.deleteCore();
    },function(){});

}


var SearchUI = {

    options : {

        setStorage : function(storage) {
            __storage = storage;
        },

        setConfiguration : function(configuration) {
            __configuration = configuration;
        }

    },

    create: function(base,core) {
        __search = new Search(base,core);
    }

}


var widgetCreatorFactory = new WidgetCreatorFactory();

function WidgetCreatorFactory() {

    var widgetTypes = ["text","color"];

    this.getTypes = function(){return widgetTypes};

    this.setTypes = function(types) {widgetTypes=types}

    this.createCreator = function(type,id) {
        switch(type) {
            case 'text': return new TextWidgetCreator(id);
            case 'color': return new ColorWidgetCreator(id);
            default: alert("Type is not supported");
        }
    }

}

function TextWidgetCreator(id) {

    this.save = function() {
        var name = $("#popup_widget_name").val();
        var field = $("#popup_widget_field").val();
        if (name == "" || field == "") {
            throw "name and field may not be empty";
        }
        var mapper = $("#popup_widget_mapper").val()==""?undefined:$("#popup_widget_mapper").val();
        var wgt = {};
        wgt.id = id ? id : Math.floor(Math.random() * 10001);
        wgt.name = name;
        wgt.field = field;
        wgt.type = "text";
        wgt.mapper = mapper;
        wgt.size = 10;

        if(id) {
            for(var i=0; i<__configuration.widgets.length;i++) {
                if(__configuration.widgets[i].id==id) __configuration.widgets[i]=wgt;
            }
        } else {
            __configuration.widgets.push(wgt);
        }
    }

    this.getValueTable = function() {
        var content1 = "<div><table>"
            +"<tr><td>Name</td><td><input id='popup_widget_name'></td></tr>"
            +"<tr><td>Field</td><td><select id='popup_widget_field'>";
        var content2 = "</select></td></tr>"
            +"<tr><td>Mapper(optional)</td><td><input id='popup_widget_mapper'></td></tr>"
            +"</table></div>";
        for(var i in __search.getFields()) {
            content1 += "<option>"+__search.getFields()[i].name+"</option>";
        }
        content1 += content2;

        var obj = $(content1);

        if(id) {
            var conf;
            for(var i=0; i<__configuration.widgets.length;i++) {
                if(__configuration.widgets[i].id==id) conf=__configuration.widgets[i];
            }
            if(conf) {
                obj.find("#popup_widget_name").val(conf.name);
                obj.find("#popup_widget_field").val(conf.field);
                if(conf.mapper) obj.find("#popup_widget_mapper").val(conf.mapper);
            }
        }

        return obj;
    }

}

function ColorWidgetCreator(id) {

    this.save = function() {
        var name = $("#popup_widget_name").val();
        var field = $("#popup_widget_field").val();
        if (name == "" || field == "") {
            throw "name and field may not be empty";
        }
        var mapper = $("#popup_widget_mapper").val()==""?undefined:$("#popup_widget_mapper").val();
        var wgt = {};
        wgt.id = id ? id : Math.floor(Math.random() * 10001);
        wgt.name = name;
        wgt.field = field;
        wgt.type = "color";
        wgt.mapper = mapper;
        wgt.size = 10;

        if(id) {
            for(var i=0; i<__configuration.widgets.length;i++) {
                if(__configuration.widgets[i].id==id) __configuration.widgets[i]=wgt;
            }
        } else {
            __configuration.widgets.push(wgt);
        }
    }

    this.getValueTable = function() {
        var content1 = "<div><table>"
            +"<tr><td>Name</td><td><input id='popup_widget_name'></td></tr>"
            +"<tr><td>Field</td><td><select id='popup_widget_field'>";
        var content2 = "</select></td></tr>"
            +"<tr><td>Mapper(optional)</td><td><input id='popup_widget_mapper'></td></tr>"
            +"</table></div>";
        for(var i in __search.getFields()) {
            //filter
            if(__search.getFields()[i].value.type=='rgbColor') content1 += "<option>"+__search.getFields()[i].name+"</option>";
        }
        content1 += content2;

        var obj = $(content1);

        if(id) {
            var conf;
            for(var i=0; i<__configuration.widgets.length;i++) {
                if(__configuration.widgets[i].id==id) conf=__configuration.widgets[i];
            }
            if(conf) {
                obj.find("#popup_widget_name").val(conf.name);
                obj.find("#popup_widget_field").val(conf.field);
                if(conf.mapper) obj.find("#popup_widget_mapper").val(conf.mapper);
            }
        }

        return obj;
    }

}

function Search(base,core) {

    var self = this;

    this.base = base;

    var fields;
    this.getFields = function(){
        return fields;
    }

    this.deleteCore = function() {
        __storage.deleteCore(core,function(){
            window.location.reload();
        },function(){
            new Alert("Sorry","Core cannot be delete!");
        });
    }

    this.addWidgetButtons = function() {
        var editWidget = $("<img>").addClass("widget_edit_button").attr("src","images/editor/edit.png").attr("title","edit widget").click(function(){
            _editWidget($(this).parent().attr("id").substring(4));
        });
        var addWidget = $("<img>").addClass("widget_add_button").attr("src","images/editor/add.png").attr("title","add widget").click(function(){
            _editWidget();
        });
        var removeWidget = $("<img>").addClass("widget_remove_button").attr("src","images/editor/remove.png").attr("title","remove widget").click(function(){
            _removeWidget($(this).parent().attr("id").substring(4));
        });

        $("body").addClass("editing");

        $(".widget_box").prepend(editWidget);
        //$(".widget_box").prepend(addWidget);
        $(".widget_box").prepend(removeWidget);
        //$("#box_not_define_widget").prepend(addWidget);
        $("#widget_box_container").append($("<div>", {id: "facade_add", click: function(){_editWidget();} }));

        function _editWidget (id) {

            var popup;
            if(id) popup = new Popup("Edit Widget");
            else popup = new Popup("Add Widget");

            var widgetConfig;
            if(id) {
                for(var i=0; i<__configuration.widgets.length;i++) {
                    if(__configuration.widgets[i].id==id) widgetConfig=__configuration.widgets[i];
                }
            }

            var template = "<div><table style='width:100%'>"
                +"<tr><td>Type</td><td><select id='select_widget_type'></select></td></tr>"
                +"</table></div>";

            var content = $("<div></div>");

            var close = $("<button></button>").text("Cancel").click(function(){
                popup.close();
            });
            var ok = $("<button></button>").text("OK").click(function(){
                alert("Select a type firsts");
            });

            popup.appendButton(close);
            popup.appendButton(ok);

            popup.appendContent($(template));
            popup.appendContent(content);

            //set types
            var types = widgetCreatorFactory.getTypes();
            $("#select_widget_type").append("<option></option>");
            for(var i=0; i<types.length;i++)  {
                $("#select_widget_type").append("<option>"+types[i]+"</option>");
            }

            var widgetCreator;


            $("#select_widget_type").change(function(){
                var type = $("#select_widget_type").val();
                content.empty();
                ok.unbind().click(function(){alert("Select a type firsts");});
                if(type=="") return;

                widgetCreator = widgetCreatorFactory.createCreator(type,id);
                ok.unbind().click(function(){try{widgetCreator.save();self.setManager(true);popup.close()}catch(e){alert(e)}});
                content.append(widgetCreator.getValueTable());
            });

            if(id) {
                $("#select_widget_type").val(widgetConfig.type);
                $("#select_widget_type").change();
            }

            popup.show();
        }

        function _removeWidget(id) {
            if(confirm("Delete widget?")) {
                for(var i=0; i<__configuration.widgets.length;i++) {
                    if(__configuration.widgets[i].id==id) {
                        __configuration.widgets.splice(i,1);
                        break;
                    }
                }
                self.setManager(true);
            }
        }
    }

    this.edit = function() {
        $('#editmode').replaceWith('<span id="safemode">Save your settings</span>');

        self.addWidgetButtons();

        var editText = $("<img>").attr("id","text_edit_button").attr("src","images/editor/edit.png").append("<p>asdsas</p>").attr("title","edit text search").click(function(){
            _editTextSearch();
        });
        $("#text_input_div").prepend(editText);

        var resultText = $("<img>").attr("id","result_edit_button").attr("src","images/editor/edit.png").attr("title","edit result theme").click(function(){
            _editResults();
        });
        $("#result_row").prepend(resultText);

        function _editTextSearch() {
            new Info("Unsupported Feature","Not implemented yet. The search by now uses all fields.");
            // TODO make configurable
        }

        function _editResults() {
            var popup = new Popup("Edit Results");

            var doc = $("<table>"
                +"<tr><td>Title</td><td><select id='result_conf_title' class='result_conf_field'></select></td></tr>"
                +"<tr><td>Link</td><td><select id='result_conf_link' class='result_conf_field'></select></td></tr>"
                +"<tr><td>Description</td><td><select id='result_conf_description' class='result_conf_field'></select></td></tr>"
                +"<tr><td>Author</td><td><select id='result_conf_author' class='result_conf_field'></select></td></tr>"
                +"<tr><td>Thumbnail</td><td><select id='result_conf_thumb' class='result_conf_field'></select></td></tr>"
                +"<tr><td>Created</td><td><select id='result_conf_created' class='result_conf_field'></select></td></tr>"
                +"</table>");

            //fill configuration
            popup.appendContent(doc);

            $(".result_conf_field").append("<option></option>")

            for (var i in __search.getFields()) {
                $(".result_conf_field").append("<option>"+__search.getFields()[i].name+"</option>")
            }
            $("#result_conf_title").val(__configuration.results.title);
            $("#result_conf_link").val(__configuration.results.link);
            $("#result_conf_author").val(__configuration.results.author);
            $("#result_conf_description").val(__configuration.results.description);
            $("#result_conf_thumb").val(__configuration.results.thumb);
            $("#result_conf_created").val(__configuration.results.created);

            var close = $("<button></button>").text("Cancel").click(function(){
                popup.close();
            });
            var ok = $("<button></button>").text("OK").click(function(){
                save();
            });

            popup.appendButton(close);
            popup.appendButton(ok);

            //set configuration
            function save() {
                __configuration.results.title =  $("#result_conf_title").val();
                __configuration.results.link =  $("#result_conf_link").val();
                __configuration.results.author =  $("#result_conf_author").val();
                __configuration.results.description =  $("#result_conf_description").val();
                __configuration.results.thumb =  $("#result_conf_thumb").val();
                __configuration.results.created =  $("#result_conf_created").val();
                self.setManager(true);
                popup.close();
            }

            popup.show();
        }
    }

    this.save = function() {
        $('#safemode').replaceWith('<span id="editmode">Enter the edit mode</span>');
        $("body").removeClass("editing");
        $(".widget_edit_button").remove();
        $(".widget_add_button").remove();
        $(".widget_remove_button").remove();
        $("#text_edit_button").remove();
        $("#result_edit_button").remove();
        $("#facade_add").remove();

        __storage.setCore(core,__configuration,function(){
            new Info("Good News","Stored configuration successfully!");
        },function(){
            new Alert("Error","Configuration data could not be stored!");
        });
    }

    function init() {
        self.setManager(false);
        //load core fields
        $.getJSON(self.base+"solr/"+core+"/admin/luke?show=schema&wt=json",function(data){
            //sort fields
            fields = [];

            var widget_types = ['text'];

            var color;

            for (var field in data.schema.fields) {
                fields.push({name:field, value:data.schema.fields[field]});
                //check field type
                if(data.schema.fields[field].type=='rgbColor') color=true;
            }
            if(color) widget_types.push('color');

            fields.sort(function(a, b) {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            });

            widgetCreatorFactory.setTypes(widget_types);
        })
    }

    this.setManager = function(edit) {
        setManager(__configuration,core);
        if(edit)self.addWidgetButtons();
    }

    //load configuration
    function getConfiguration(core) {
        __storage.getCore(core,function(data) {
            __configuration = data;
            init();
        },function() {
            init();
        });
    }

    //check if core exists
    $.getJSON(self.base+"solr/cores",function(data){
        var cores = "";
        for(var i=0;i<data.length;i++) {
            if(data[i]==core) {
                getConfiguration(core);
                $("#search_edit_button").removeAttr("disabled");
                break;
            }
            cores+=data[i];
            if(i==data.length-1) {
                new Info("Unsupported Core Name","Core does not exist. Select one of the following:<br>"+cores);
            } else {
                cores+=", ";
            }
        }
    });
}

function Alert(title,text) {
    var popup = new Popup(title,'alert');
    popup.appendContent("<p>"+text+"</p>");
    var close = $("<button></button>").text("OK").click(function(){
        popup.close();
    });
    popup.appendButton(close);
    popup.show();
}

function Confirm(title,text,oncommit,oncancel) {
    var popup = new Popup(title,'alert');
    popup.appendContent("<p>"+text+"</p>");
    var close = $("<button></button>").text("Cancel").click(function(){
        oncancel();
        popup.close();
    });
    var ok = $("<button></button>").text("OK").click(function(){
        oncommit();
        popup.close();
    });
    popup.appendButton(close);
    popup.appendButton(ok);
    popup.show();
}

function Info(title,text) {
    var popup = new Popup(title,'info');
    popup.appendContent("<p>"+text+"</p>");
    var close = $("<button></button>").text("OK").click(function(){
        popup.close();
    });
    popup.appendButton(close);
    popup.show();
}

function Popup(title,type) {

    if(!type) type="normal";

    var self = this;

    var template = "<div style='display:none' id='popup'><h1 id='popup_title' class='popup_title_"+type+"'>Test</h1><div id='popup_content'></div><div id='popup_buttons'></div></div>"

    $("#background-black").show();
    var box = $(template);
    $('body').append(box);
    $("#popup_title").text(title);

    this.appendContent = function(content) {
        $("#popup_content").append(content);
    }

    this.appendButton = function(button) {
        $("#popup_buttons").append(button);
    }

    this.close = function() {
        $("#popup").remove();
        $("#background-black").hide();
    }
    this.show = function() {
        box.show();
    }

}