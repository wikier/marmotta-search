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
/**
 * This store implements a cookie store
 */
SolrUI.AbstractStore = SolrUI.Class.extend({

    EXPIRE_DAYS : 1,

    BASE_COOKIE : "solrui_core",

    write : function(id,configuration,onsuccess,onfailure) {
        var exdate=new Date();
        exdate.setDate(exdate.getDate() + this.EXPIRE_DAYS);
        document.cookie=this.BASE_COOKIE+id + "=" + JSON.stringify(configuration) + "; expires="+exdate.toUTCString();
        onsuccess();
    },

    read : function(id,onsuccess,onfailure) {
        var data;
        var i,x,y,ARRcookies=document.cookie.split(";");
        for (i=0;i<ARRcookies.length;i++) {
            x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
            y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
            x=x.replace(/^\s+|\s+$/g,"");
            if (x==this.BASE_COOKIE+id) {
                data = JSON.parse(y);
            }
        }
        onsuccess(data);
    }

});