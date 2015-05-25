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
(function($) {
    var BASE = location.protocol + "//" + location.host + location.pathname.replace(/[^\/]+\/[^\/]+$/, "");
    
    function lockStep(step, lock) {
        lock = lock!==undefined?lock:true;
        var sel = ".demo_step.step" + step;
        if (lock) {
            $(sel).addClass("locked");
        } else {
            // Step 5 ERROR
            $(sel).removeClass("locked");
            $("#next").has(sel).slideDown();
        }
        checkSequence();
    }
    function checkSequence() {
        if ($(".demo_step.current.locked").length > 0) {
            if ($("#sequence_error").length == 0) {
                $("div#head").append($("<div>", {
                    text : "Warning: Not all preconditions are fulfilled! Please complete the individual steps in the correct order.",
                    id : "sequence_error",
                    class : "error",
                    style : "display:hidden;"
                }).slideDown());
            }
        } else {
            $("#sequence_error").remove();
        }
    }
    /*
     * Step 1: true
     * Step 2: check for existence of l:553573403
     * Step 3: check for existence of skos:prefLabel
     * Step 4: check for existence of program "books"
     * Step 5: check for existence of search core "books"
     */
    function step1() {
        $(".demo_step.step1").addClass("done");
        lockStep(2, false);
    }
    function step2() {
        var lock = true;
        $.get(BASE + "resource/553573403", {}, function(data, textStatus, xhr) {
            $(".demo_step.step2").addClass("done");
            lock = false;
            $("button#import_data").attr("disabled", "disabled");
        }, "json").complete(function() { lockStep(3, lock)});
    }
    function step3() {
        var lock = true;
        // /LMF/ldpath/path?uri=<context-resource>&path=/path/selection
        $.get(BASE + "ldpath/path", {uri: BASE + "resource/fantasy", path: "<http://www.w3.org/2004/02/skos/core#prefLabel>"}, function(data) {
            if (data.length > 0) {
                $(".demo_step.step3").addClass("done");
//                lockStep(4, false);
                lock = false;
                $("button#create_thesaurus").attr("disabled", "disabled");
            }
        }, "json").complete(function() { lockStep(4, lock); });
    }
    function step4() {
        var lock = true;
        $.get(BASE + "reasoner/program/list", {}, function(data) {
            for (var i in data) {
                var p = data[i];
                if (p.name == "books") {
                    $(".demo_step.step4").addClass("done");
                    lock = false;
                    $("button#configure_reasoning").attr("disabled", "disabled");
                    break;
                }
            }
        }, "json").complete(function() { lockStep(5, lock); });
    }
    function step5() {
        var conf = false, core = false;
        function checkStep() {
            if (conf && core) {
                $(".demo_step.step5").addClass("done");
            }
            else {
                $(".demo_step.step5").removeClass("done");
            }
            lockStep(6, !(conf&&core));
            lockStep(7, !core);
        }
        $.get(BASE + "solr/cores/books").success(function() {
            $("button#create_core").attr("disabled", "disabled");
            core = true;
        }).complete(checkStep);
        // Check Config settings
        $.get(BASE + "config/list", {}, function(data) {
            var c = true;
            $("table#lmf_config tbody tr").each(function(i, row) {
                var td = $("td", row);
                var key = $(td[0]).text(), val = $(td[1]).text();
                if (!data[key] || data[key].value !== val) {
                    c = false;
                }
            });
            if (c) {
                $("button#set_config").attr("disabled", "disabled");
                conf = true;
            }
        }, "json").complete(checkStep);
    }
    function createLoader(button) {
        return $("<span>", {class: "loader"}).html('&nbsp;').insertAfter($(button).attr("disabled", "disabled"));
    }
    function enableBtn(button) {
        $(button).removeAttr("disabled");
    }
    
    $(function() {
        $("pre.curl").each(function(i, target) {
            var str = $(target).text();
            str=str.replace(/\$URL\/?/g, BASE);
            $(target).text(str);
        });
        
        function showRdfXml(src, target) {
            $.get(src, {}, function(data) {
                    var t = $(target).empty();
                    t.text(data.replace(/http:\/\/localhost:8080\/LMF\/?/g, BASE));
                    t.slideDown();
                }, "text");
        }
        $(".rdf_xml").click(function() {
            var target = $(".rdf_xml_display");
            var src = $(this).attr("href");
            showRdfXml(src, target);
            return false;
        });
        showRdfXml("data/lucys-books.rdf", $("pre#post_content_rdf"));
        showRdfXml("data/book-genres.n3", $("pre#post_content_thesaurus"));
        $.get("data/books-reasoning.txt", {}, function(data){
            $("pre#reasoning").text(data);
        }, "text");
        showRdfXml("data/books-core.txt", $("pre#books_core"));
                
        $("button#import_data").click(function() {
            var self = this;
            var loader = createLoader(self);
            var body = $("pre#post_content_rdf").text();
            $.ajax(BASE + "import/upload", {
                type: "POST",
                contentType: "application/rdf+xml",
                data: body,
                success: function() {
                    step2();
                },
                error: function() {
                    enableBtn(self);
                },
                complete: function() {
                    loader.remove();
                }
            });
        });
        $("button#create_thesaurus").click(function() {
            var self = this;
            var loader = createLoader(self);
            var body = $("pre#post_content_thesaurus").text();
            $.ajax(BASE + "import/upload", {
                type: "POST",
                contentType: "text/n3",
                data: body,
                success: function() {
                    step3();
                },
                error: function() {
                    enableBtn(self);
                },
                complete: function() {
                    loader.remove();
                }
            });
        });
        $("button#configure_reasoning").click(function() {
            var self = this;
            var loader = createLoader(self);
            var body = $("pre#reasoning").text();
            $.ajax(BASE + "reasoner/program/books", {
               type: "POST",
               contentType: "text/plain",
               data: body,
               success: function() {
                   step4();
               },
               error: function() {
                   enableBtn(self);
               },
               complete: function() {
                   loader.remove();
               }
            });
        });
        $("button#set_config").click(function() {
            var self = this;
            var loader = createLoader(self);
            var data = "{";
            $("table#lmf_config tbody tr").each(function(i, row) {
                var td = $("td", row);
                var key = $(td[0]).text(), val = $(td[1]).text();
                data += '"' + key + '":"' + val.replace(/"/g, '\\"') + '",';
            });
            data = data.replace(/,$/, "}");
            $.ajax(BASE + "config/list", {
                type: "POST",
                contentType: "application/json",
                data: data,
                success: function() {
                    step5();
                },
                error: function() {
                    enableBtn(self);
                },
                complete: function() {
                    loader.remove();
                }
            });
        });
        $("button#create_core").click(function() {
            var self = this;
            var loader = createLoader(self);
            var body = $("pre#books_core").text();
            $.ajax(BASE + "solr/cores/books", {
                type: "POST",
                contentType: "text/plain",
                data: body,
                success: function() {
                    step5();
                },
                error: function() {
                    enableBtn(self);
                },
                complete: function() {
                    loader.remove();
                }
             });            
        });
        
        /* Check which steps are already done */
        step1();
        step2();
        step3();
        step4();
        step5();
    });
})(jQuery);