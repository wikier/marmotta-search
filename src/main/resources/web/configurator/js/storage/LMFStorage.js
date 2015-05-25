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
function LMFStorage(base) {

    function setCore(name,value,onsuccess,onfailure) {

        $.ajax({
            type:"POST",
            url:base+"config/data/search.config."+name,
            success: onsuccess,
            error: onfailure,
            data:JSON.stringify([value]),
            contentType:"application/json; charset=utf-8",
            dataType:"json"
        });
    }

    function getCore(name,onsuccess,onfailure) {
        $.ajax({
            url:base+"config/data/search.config."+name,
            success: function(data){
                onsuccess(JSON.parse(data['search.config.'+name]));
            },
            error: onfailure,
            dataType: "json"
        });
    }

    function deleteCore(name,onsuccess,onfailure) {
        $.ajax({
            type:"DELETE",
            url:base+"config/data/search.config."+name,
            success: onsuccess,
            error: onfailure
        });
    }

    var obj = {
        setCore : function(name,core,onsuccess,onfailure) {
            var data = JSON.stringify(core).replace(/"/g,"\"").replace(/,/g,"\\,");
            setCore(name,data,onsuccess,onfailure);
        },
        getCore : function(name,onsuccess,onfailure) {
            getCore(name,onsuccess,onfailure);
        },
        deleteCore: function(name,onsuccess,onfailure) {
            deleteCore(name,onsuccess,onfailure);
        }

    }

    return obj;

}