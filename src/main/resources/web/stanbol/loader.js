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
(function(){
    // Load the script from url and when it's ready loading run the callback.
    function loadScript(url, callback) {
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.src = url;

        // Attach handlers for all browsers
        var done = false;
        script.onload = script.onreadystatechange = function()
        {
            if( !done && ( !this.readyState 
                || this.readyState == "loaded" 
                || this.readyState == "complete") )
            {
                done = true;

                // Continue your code
                callback();

                // Handle memory leak in IE
                script.onload = script.onreadystatechange = null;
                head.removeChild( script );
            }
        };

        head.appendChild(script);
    }

    // Load a list of scripts and run cb
    var loadScripts = function(scripts, cb) {
        var script, _i, _len, _results;
        if(scripts.length){
            script = scripts.shift();
            loadScript(script, function(){
                loadScripts(scripts.slice(0));
            });
        } else {
            console.info("all scripts loaded.");
        }
    };

    var loadStyles = function(csss) {
      var css, _i, _len, _results;
      for (_i = 0, _len = csss.length; _i < _len; _i++) {
        css = csss[_i];
        var e = document.createElement('link');
        e.setAttribute('rel','stylesheet');
        e.setAttribute('href', css);document.head.appendChild(e);
      }
    };
    function salt(){
        return Math.random().toString().substring(2);
    }
    var appRoot = window.bookmarkletConfig.appRoot;
    var loaderUri = window.bookmarkletConfig.loaderUri;
    // Loading style definitions
    loadStyles([
        loaderUri + "annotate.css",
        appRoot + "annotate.js/lib/jquery/jquery-ui.min.css",
        appRoot + "annotate.js/lib/Smoothness/jquery.ui.all.css"
    ]);
    // Loading the scripts
    loadScripts([
        appRoot + "annotate.js/lib/jquery-1.5.1.js",
        appRoot + "annotate.js/lib/jquery-ui.1.9m5.js",
        appRoot + "annotate.js/lib/underscore-min.js",
        appRoot + "annotate.js/lib/backbone.js",

        appRoot + "annotate.js/lib/hallo/hallo.js",
        appRoot + "annotate.js/lib/hallo/format.js",

        appRoot + "annotate.js/lib/jquery.rdfquery.debug.js",
        appRoot + "annotate.js/lib/vie/vie-latest.debug.js?" + salt(),

        appRoot + "annotate.js/lib/annotate.js?" + salt(),
        // be sure to load the correct activate.js - not from approot !!!
        loaderUri + "activate.js?"// + salt()
    ]);
    // Show spinner
    var e = document.createElement("div");
    e.setAttribute("class", "loadingDiv");
    e.innerHTML = "<img src='" + loaderUri + "spinner.gif'/>";
    document.body.appendChild(e);
    // Show button to trigger enhancement
    var b = document.createElement("div");
    b.setAttribute("class", "triggerButton");
    b.innerHTML = "<img src='" + loaderUri + "xhtml_wiz.png'/>";
    document.body.appendChild(b);
})();
