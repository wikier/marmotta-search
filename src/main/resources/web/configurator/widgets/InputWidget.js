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

AjaxSolr.InputWidget = AjaxSolr.AbstractWidget.extend({

    button : undefined,
    suggestions : undefined,
    minQuerySize:1,
    suggestionHandler:"suggest",
    maxPerField:"5",

    init: function () {

        var self = this;

        function drawSuggestions(suggestions) {
            $(self.suggestions).empty().show();
            for(var facet in suggestions) {
                $("<li></li>").addClass("suggestion_header").text(facet).appendTo(self.suggestions);
                var i = 0;
                for(var value in suggestions[facet]) {

                    if(i == self.maxPerField) break;
                    i++;

                    var count = suggestions[facet][value];
                    $("<li></li>")
                        .html("<span class='suggestion_value'>"+value+"</span><span class='suggestion_count'>"+count+"</span>")
                        .addClass("suggestion_facet")
                        .click((function(f,v){
                            return function() {
                                //set fq
                                $(self.target).val("");
                                self.manager.store.remove('fq');
                                self.manager.store.addByValue("q","*:*");
                                self.manager.store.addByValue('fq', f + ':' + AjaxSolr.Parameter.escapeValue(v));
                                self.manager.doRequest();
                                return false;
                            }
                        })(facet,value))
                        .appendTo(self.suggestions)
                }
            }
        }

        function autocomplete(query) {

            $.getJSON(self.manager.solrUrl+self.suggestionHandler+"?wt=json&q="+encodeURIComponent(query),function(data){
                if(data.suggestions.suggestion_count == 0) {
                    $(self.suggestions).hide().empty();
                } else {
                    drawSuggestions(data.suggestions.suggestion_facets);
                }
            });

        }

        //bind search and autocomplete
        $(this.target).keydown(function(event){
            if(event.which == 13) {
                $(self.button).click();
                return false;
            }

            //up
            if(event.which == 38 && $(self.suggestions).is(':visible')) {
                if($(".suggestion_current").length > 0) {
                    var current = $(".suggestion_current");
                    current.removeClass("suggestion_current");
                    if(current.prev().hasClass("suggestion_header")) current = current.prev();

                    if(current.prev().length > 0) {
                        current.prev().addClass("suggestion_current");
                    }
                }
                return false;
            }

            //down
            if(event.which == 40 && $(self.suggestions).is(':visible')) {
                if($(".suggestion_current").length > 0) {
                    if($(".suggestion_current").next().length > 0) {
                        var current = $(".suggestion_current");
                        current.removeClass("suggestion_current");
                        if(current.next().hasClass("suggestion_header")) current = current.next();
                        current.next().addClass("suggestion_current");
                    }
                } else {
                    if($(self.suggestions).children().length > 0) {
                        $(self.suggestions).children().first().next().addClass("suggestion_current");
                    }
                }
                return false;
            }
        })

        $(this.target).keyup(function(event){

            if(event.which==13 || event.which==38 || event.which==40) {
                return false;
            }

            if($(self.target).val().trim().length >= self.minQuerySize) {
                autocomplete($(self.target).val().trim());
            } else {
                $(self.suggestions).hide().empty();
            }
            return false;
        });

        $(this.button).click(function(event) {
            if ($(".suggestion_current").length > 0) {
                $(".suggestion_current").click();
            } else {
                if($(self.target).val().trim() == "") {
                    self.manager.store.addByValue("q","*:*");
                } else {
                    self.manager.store.addByValue("q",AjaxSolr.Parameter.escapeValue($(self.target).val().trim()));
                }
                self.manager.doRequest();
            }
            return false;
        });

    },
    beforeRequest: function() {
        //nothing to do
    },
    afterRequest: function() {
        $(this.suggestions).hide();
    },
    setQuery: function(query) {
        $(this.target).val(query);
    }
});

