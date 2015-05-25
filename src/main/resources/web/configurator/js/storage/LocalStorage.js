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
function LocalStorage() {

    var base_string = "solr_ui_search_core_configuration_"

    function setCore(name,value,onsuccess,onfailure) {
        localStorage.setItem(base_string+name,JSON.stringify(value));
        onsuccess();
    }

    function getCore(name,onsuccess,onfailure) {
        var data = localStorage.getItem(base_string+name);
        if(data != undefined) return onsuccess(JSON.parse(data));
        return onfailure();

    }

    function deleteCore(name,onsuccess,onfailure) {
        localStorage.removeItem(base_string+name);
        onsuccess();
    }

    var obj = {
        setCore : function(name,value,onsuccess,onfailure) {
            setCore(name,value,onsuccess,onfailure)
        },
        getCore : function(name,onsuccess,onfailure) {
            getCore(name,onsuccess,onfailure);
        },
        deleteCore: function(name,onsuccess,onfailure) {
            deleteCore(name,onsuccess,onfailure);
        }
    }

    if(typeof(Storage)!=="undefined") {
        return obj;
    } else {
        alert("Cores can be defined but not stored because local storage (HTML5) is not supported by this browser!");
    }

}