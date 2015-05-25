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
function Search(endpoint) {
    alert(9);
    var DEFAULT_CONFIGURATION = {
        widgets: [
            {type:'TagcloudWidget',label:'Text Wolke',id:'2134',field:'title',limit:'15',sort:'lexical',mappers:{'title':'Titel'}},
            {type:'TagcloudWidget',label:'Text2',id:'2135',field:'title',limit:'15',sort:'lexical',mappers:{'title':'Titel'}}
        ],
        results: {},
        text:{},
        schema:{}
    };

    var Manager;

    var _storeFunction = function(data,onsuccess,onfailure) {
        alert("Save-function is not defined");
        onsuccess();
    }

    var _loadFunction = function(onsuccess,onfailure) {
        alert("Load-function is not defined. Default values are loaded");
        onsuccess();
    }

    var widgetManager = new WidgetManager();
    var resultManager = new ResultManager();

    var configuration;

    function init() {

        //read the configuration from a specified backend
        function readSearchUIConfiguration() {
            _loadFunction(function(data){
                configuration = data;
                readSearchCoreConfiguration();
            },function(){
                //TODO alert("Can not load configuration for core. Maybe it does not exist yet.");
                configuration = DEFAULT_CONFIGURATION;
                readSearchCoreConfiguration();
            });
        }

        //read solr core configuration with luke request handler
        function readSearchCoreConfiguration() {
            //read core fields in internal model (like) ->var schema
            //http://labs.newmedialab.at/SKOS/solr/skos/admin/luke?show=schema
            configuration.schema = {};
            initManagers();
        }

        //initialize all managers
        function initManagers() {
            widgetManager.init(configuration);
            resultManager.init(configuration);

            //bind edit button
            $("#search_edit_button").click(function(){
                edit();
            });

            run();
        }
        readSearchUIConfiguration();
    }

    //initialize search manager and run search
    function run() {
        var params = {};

        params = widgetManager.setParams(params);
        params = resultManager.setParams(params);

        Manager = new AjaxSolr.Manager({
            solrUrl: endpoint
        });

        //clear old bindings
        //TODO this bindings must not been set twice !!
        //$("#searchbutton").unbind();
        //$("#sortResults").unbind();
        //$("#pageSize").unbind();
        //remove all Widgets from Manager

        //remove all Widgets from UI
        $("#widget_box_container").empty();

        //add all Widgets
        for(var i in widgetManager.getWidgets()) {
            var widget = widgetManager.getWidgets()[i];

            $("#widget_box_container").append(widget.getBox());
            Manager.addWidget(widget.getSolrWidget());
        }
        if(widgetManager.getWidgets().length==0) {
            var widget = new AbstractWidget();
            widget.init({label:"No widget defined"});
            $("#widget_box_container").append(widget.getBox());
        }

        //set current search widget
        Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
            id: 'currentsearch',
            target: '#selection',
            mappers: widgetManager.getMappers(),
            image: {"remove":"images/remove.png"}
        }));

        //init manager + all widgets
        Manager.init();

        for (var name in params) {
            Manager.store.addByValue(name, params[name]);
        }

        //set currentSearchResult mappers

        //run search
        Manager.doRequest();
    }

    function addWidgetTemplate(widget) {
        widgetManager.addWidgetTemplate(widget);
    }

    function addResultTemplate(template) {
        resultManager.addResultTemplate(template);
    }

    function edit() {
        //change button
        $("#search_edit_button").unbind();
        $("#search_edit_button").text("Save");
        $("#search_edit_button").click(function(){
            save();
        });
    }

    function save() {
        $("#search_edit_button").unbind();
        $("#search_edit_button").text("Edit");
        $("#search_edit_button").click(function(){
            edit();
        });

        //get properties from widgets

        //save to core
        _storeFunction(configuration,function(){
            alert("storing was successful");
            //hide edit mode
        },function(){
            alert("storing failed");
            //hide edit mode
        });
    }

    function setStoreConfigurationFunction(func) {
        _storeFunction = func;
    }

    function setLoadConfigurationFunction(func) {
        _loadFunction = func;
    }

    return {
        addWidgetTemplate:addWidgetTemplate,
        addResultTemplate:addResultTemplate,
        init:init,
        setLoadConfigurationFunction:setLoadConfigurationFunction,
        setStoreConfigurationFunction:setStoreConfigurationFunction
    }

}