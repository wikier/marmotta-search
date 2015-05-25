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
 * Script for generic web search annotation
 * utilizing LMF & Stanbol
 */
$(document).ready(function(){
	/**
	 * Specify the default namespace to use - DCTerms as default
	 * @TODO: provide configuration 
	 */
	var defaultNamespace = "http://labs.newmedialab.at/ontology/";

	/**
	 * Store the provided configuration from the bookmarklet
	 */
    var appConfig = window.bookmarkletConfig;
    /**
     * The selector: identifies element to enhance 
     */
    var selector = appConfig.defaultCssSelector;
    /**
     * Possibility to "ask" for the selector elements
     * @deprecated
     */
    if(appConfig.cssPopup){
        appConfig.defaultCssSelector = selector = prompt("CSS selector for the annotation (e.g. p, body, div#content...)", appConfig.defaultCssSelector);
    }
    /**
     * Insert the required scripts & visual elements:
     * - loadingDiv: shows the activity 
     * - triggerButton: allows manually activating stanbol
     */
    $("head")[0]
    	.insertBefore($("<script>window.bookmarkletConfig = " + JSON.stringify(appConfig) + "</script>")[0], $("head").children()[0]);
    $('.loadingDiv')
	    .hide()  // hide it initially
	    .ajaxStart(function() {
	        $(this).show();
	    })
	    .ajaxStop(function() {
	        $(this).hide();
	    });
    $('.triggerButton')
    	.show() // show it initially
    	.click(function () {
    		callStanbol();
    	})
    	.ajaxStart(function() {
    		$(this).hide();
    	})
	    .ajaxStop(function() {
	        $(this).show();
	    });

    /**
     * Return the actual content of the web page
     * @deprecated
     */
    function getHtml(){
        $(":IKS-hallo").trigger("blur");
        return $("html").html();
    }
    function getText(){
        $(":IKS-hallo").trigger("blur");
        return $("html").text();
    }
    /**
     * Post the content to the provided uri
     * @see storeHtml 
     */
    function createResource(uri){
        $.ajax({
            url: uri,
            type: "POST",
            statusCode: {
                300: function(){
                    console.info("300:", arguments);
                    storeHtml(uri);
                },
                302: function(){
                    console.info("302:", arguments);
                    storeHtml(uri);
                }
            },

            success: function() {
                console.info("createResource:", arguments);
                storeHtml(uri);
            },
            error: function() {
                console.error("createResource:", arguments);
            }
        });
    }
    /**
     * Stores the HTML content along with the resource
     * @deprecated 
     */
    function storeHtml(url){
        var baseUri = appConfig.lmfBaseUri;
    	if ( baseUri.charAt(baseUri.length) == "/" ) {
    		baseUri = baseUri.substring(0, baseUri.length-1);
    	}
        var resourceUri = baseUri + "/resource?uri=" + url;
    	
        $.ajax({
            url: resourceUri,
            type: "PUT",
            data: getHtml(),
            beforeSend: function(xhr){
                xhr.setRequestHeader("Content-Type", "text/html;rel=content");
            },
            success: function() {
                console.info("storeHtml:", arguments);
            },
            error: function() {
                console.error("storeHtml:", arguments);
            }
        });
    } 
    /**
     * Method to retrieve the stored meta data for a given resource.
     * The meta data is returned as JSON object - no content is
     * requested
     */
    function getMetaData(url) {
        var baseUri = appConfig.lmfBaseUri;
    	if ( baseUri.charAt(baseUri.length) == "/" ) {
    		baseUri = baseUri.substring(0, baseUri.length-1);
    	}
        var resourceUri = baseUri + "/resource?uri=" + url;
    	$.ajax({
    		url: resourceUri,
    		type : "GET",
    		headers : {"Accept": "application/json;rel=meta"},
    		dataType : "json",
    		success: function(data) {
    			console.info("get meta ", arguments);
    			// data found
    			return data;
    		},
    		error: function() {
    			console.info("get meta failed", arguments);
    		},
       	});
    }
    /**
     * Helper method to remove all suggestions from a given text element
     * 
     */
	function stripSpan(textToStrip) {
		$(textToStrip).contents().each(function(index, element){
			if ($(element).is("span") ) {
				$(element).replaceWith($(this).text());
			}
		});
		return textToStrip;
	}
    
	function htmlEscape(str) {
	    return String(str)
	            .replace(/&/g, '&amp;')
	            .replace(/"/g, '&quot;')
	            .replace(/'/g, '&#39;')
	            .replace(/</g, '&lt;')
	            .replace(/>/g, '&gt;');
	}
    /**
     * Helper method to execute a sparql update. This method is 
     * used to add a new relation to a given target Uri
     * @param sparqlUrl: The LMF SPARQL endpoint
     * @param resUri: The resource URI (as stored in the LMF)
     * @param relation: the relation (relatedPlace, relatedPerson etc.)
     * @param targetUri: the target of the relation
     */
    function sparqlInsert(sparqlUrl, resUri, relation, targetUri) {
        var sparql = "PREFIX lmf: <" +defaultNamespace+ "> INSERT DATA { <" + 
        	resUri + "> " + relation + "  <" + targetUri + "> } ";
		console.info("sparql command:", sparql);
		$.ajax({
		    url: sparqlUrl,
		    type: "POST",
		    contentType: "",
		    data: sparql,
		    success: function() {
		        console.info("sparql update:", arguments);
		    },
		    error: function() {
		        console.error("sparql update:", arguments);
		    }
		});
    	
    }
    /**
     * Helper method to execute a sparql delete. This 
     * method is used to delete a relation to a given target Uri
     * @param sparqlUrl: The LMF SPARQL endpoint
     * @param resUri: The resource URI (as stored in the LMF)
     * @param relation: the relation (relatedPlace, relatedPerson etc.)
     * @param targetUri: the target of the relation     * 
     */
    function sparqlDelete(sparqlUrl, resUri, relation, targetUri) {
        var sparql = "PREFIX lmf: <" +defaultNamespace+ "> DELETE DATA { <" + 
        	resUri + "> " + relation + "  <" + targetUri + "> } ";
		console.info("sparql command:", sparql);
		$.ajax({
		    url: sparqlUrl,
		    type: "POST",
		    contentType: "",
		    data: sparql,
		    success: function() {
		        console.info("sparql update:", arguments);
		    },
		    error: function() {
		        console.error("sparql update:", arguments);
		    }
		});
    	
    }
    function sparqlSetContent(sparqlUrl, resUri, title ) {
    	// store the content
    	// upate metadata
    	var sparql = "PREFIX dc: <http://purl.org/dc/terms/> " +
    				 "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
    				 "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> " + 
    				 "PREFIX foaf: <http://xmlns.com/foaf/0.1/>" +
    				 "DELETE { <"+ resUri +"> dc:title ?title . " +
    				 "         <"+ resUri +"> dc:created ?old  " +
    				 " } " +
    				 "INSERT { <"+ resUri +"> dc:title '"+title+"'  . " +
    				 "         <"+ resUri +"> dc:created ?ndate . " +
    				 "         <"+ resUri +"> rdf:type <http://xmlns.com/foaf/0.1/Document> . " +
    				 "         <"+ resUri +"> rdf:type <http://labs.newmedialab.at/ontology/doctypes/WebDocument> " +
    				 " } " +
    				 " WHERE { " +
    				 " BIND (now() as ?ndate)  " +
    				 " }";
		console.info("sparql command:", sparql);
		$.ajax({
		    url: sparqlUrl,
		    type: "POST",
		    contentType: "",
		    data: sparql,
		    success: function() {
		        console.info("sparql update:", arguments);
		    },
		    error: function() {
		        console.error("sparql update:", arguments);
		    }
		});
        storeHtml(resourceUri);

    }
    /**
     * Method to enable editing for all 
     * selectors
     */
    function makeEditable() {
        $(selector)
        .hallo({
            plugins: {
              'halloformat': {}
            },
            editable: true
        });
    }
    /**
     * call stanbol for each selector
     */
    function callStanbol() {
    	$(selector).each(function(){
            $(this)
            .annotate('enable', function(success){
                console.info("success:", success);
            });
        });
    }
    var z = new VIE();
    z.use(new z.StanbolService({url : appConfig.stanbolUri, proxyDisabled: true}));
    // make the content element editable
    console.log("analyzing", selector, $(selector));
    var baseUri = appConfig.lmfBaseUri;
	if ( baseUri.charAt(baseUri.length) == "/" ) {
		baseUri = baseUri.substring(0, baseUri.length-1);
	}
    var resourceUri = document.URL;
    //
    var storedData = getMetaData(resourceUri);
    
    makeEditable();
    
    $(selector).annotate({
        vie: z,
        vieServices: ["stanbol"],
        debug: true,
        /*
         * Does whatever DECLINE should do - close the popup
         */
        decline: function(event, ui){
            console.info('decline event', event, ui);
        },
        /**
         * method to store the "accepted" annotation. Based
         * on the type of suggestion the relation is stored
         * via SPARQL INSERT DATA   
         * 
         *  
         */
        select: function(event, ui){
            console.info('select event', event, ui);
            // obtain the text content for each selector 
            //var content = stripSpan(selector).clone());
            var content = htmlEscape(getText());
            // configurable lmfBaseUri!!!
            var baseUri = appConfig.lmfBaseUri;
			if ( baseUri.charAt(baseUri.length) == "/" ) {
				baseUri = baseUri.substring(0, baseUri.length-1);
			}
			
//            var baseUri = "http://lmf.newmedialab.at/LMF";

            var sparqlUrl = baseUri + "/sparql/update";
            var relation = "lmf:related";
//            var textAnnotationType = ui.textEnhancement._enhancement.get("dc:type").replace(/^<|>$/g, "");
//            var entityAnnotationType;
//            if (ui.entityEnhancement && ui.entityEnhancement._enhancement){
//            	entityAnnotationType = ui.entityEnhancement._enhancement.get("dc:type").replace(/^<|>$/g, "");
//            }
//            var enhTypes = textAnnotationType.concat(entityAnnotationType);
//            if (enhTypes.indexOf("<http://dbpedia.org/ontology/Place>") != -1){
//            	relation = "lmf:relatedLocation";
//            } else if (enhTypes.indexOf("<http://dbpedia.org/ontology/Organisation>") != -1){
//            	relation = "lmf:relatedOrganisation";
//            } else if (enhTypes.indexOf("<http://dbpedia.org/ontology/Person>") != -1){
//            	relation = "lmf:relatedPerson";
//            } 
            if (ui.entityEnhancement && ui.entityEnhancement._enhancement){
                var enhancementType = ui.entityEnhancement._enhancement.get("enhancer:entity-type");
                if (enhancementType && enhancementType.indexOf("<http://dbpedia.org/ontology/Place>") != -1){
                	relation = "lmf:relatedLocation";
                } else if (enhancementType && enhancementType.indexOf("<http://dbpedia.org/ontology/Organisation>") != -1){
                	relation = "lmf:relatedOrganisation";
                } else if (enhancementType && enhancementType.indexOf("<http://dbpedia.org/ontology/Person>") != -1){
                	relation = "lmf:relatedPerson";
                } 
            }
            
            var targetUri = ui.entityEnhancement.getUri().replace(/^<|>$/g, "");
            //
            sparqlInsert(sparqlUrl, resourceUri, relation, targetUri);
            // sparqlSet(sparqlUrl, resUri, "lmf:inhalt", content.html());
            
            sparqlSetContent(sparqlUrl, resourceUri, document.title);

            console.info("entityEnhancement:", ui.entityEnhancement._enhancement.as("JSON"));
            console.info("entity uri:", ui.entityEnhancement.getUri());
        },
        remove: function(event, ui){
            console.info('remove event', event, ui);
            var baseUri = appConfig.lmfBaseUri;
			if ( baseUri.charAt(baseUri.length) == "/" ) {
				baseUri = baseUri.substring(0, baseUri.length-1);
			}
			

            var sparqlUrl = baseUri + "/sparql/update";
            
            var relation = "lmf:related";
//            var textAnnotationType = ui.textEnhancement._enhancement.get("dc:type").replace(/^<|>$/g, "");
//            var entityAnnotationType;
//            if (ui.entityEnhancement && ui.entityEnhancement._enhancement){
//            	entityAnnotationType = ui.entityEnhancement._enhancement.get("dc:type").replace(/^<|>$/g, "");
//            }
//            var enhTypes = textAnnotationType.concat(entityAnnotationType);
//            if (enhTypes.indexOf("<http://dbpedia.org/ontology/Place>") != -1){
//            	relation = "lmf:relatedLocation";
//            } else if (enhTypes.indexOf("<http://dbpedia.org/ontology/Organisation>") != -1){
//            	relation = "lmf:relatedOrganisation";
//            } else if (enhTypes.indexOf("<http://dbpedia.org/ontology/Person>") != -1){
//            	relation = "lmf:relatedPerson";
//            } 

            if (ui.entityEnhancement && ui.entityEnhancement._enhancement){
                var enhancementType = ui.entityEnhancement._enhancement.get("enhancer:entity-type");
                if (enhancementType && enhancementType.indexOf("<http://dbpedia.org/ontology/Place>") != -1){
                	relation = "lmf:relatedLocation";
                } else if (enhancementType && enhancementType.indexOf("<http://dbpedia.org/ontology/Organisation>") != -1){
                	relation = "lmf:relatedOrganisation";
                } else if (enhancementType && enhancementType.indexOf("<http://dbpedia.org/ontology/Person>") != -1){
                	relation = "lmf:relatedPerson";
                } 
            }            
            var targetUri = ui.entityEnhancement.getUri().replace(/^<|>$/g, "");

            sparqlDelete(sparqlUrl, resourceUri, relation, targetUri);
            sparqlSetContent(sparqlUrl, resourceUri, document.title);

            // USE SKOS:RELATED (dc:related is unknown)
            console.info("entity uri:", ui.entityEnhancement.getUri());
            
        }

    })
    // enable by default 
    .each(function(){
        $(this)
        .annotate('enable', function(success){
            console.info("success:", success);
        });
    });
});

