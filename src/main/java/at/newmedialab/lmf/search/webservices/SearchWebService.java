/**
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
package at.newmedialab.lmf.search.webservices;

import org.apache.marmotta.platform.core.api.config.ConfigurationService;
import org.slf4j.Logger;

import javax.annotation.PostConstruct;
import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.Set;

/**
 * This webservice processes requests to the SOLR query service and resolves all queries to RDF properties by querying
 * the triple store. It performs the following rewritings:
 * <ul>
 * <li>for each query of the form <code>PREFIX:PROPERTY:QUERY</code> (e.g. <code>rdfs:comment:KiWi</code>), the
 *     namespace of the query is looked up in the triple store and PREFIX:PROPERTY in the query is replaced by
 *    the URI of the property and the filter continues with step 2 </li>
 * <li>for each query of the form <code>URI:QUERY</code> (e.g. <code>http://www.w3.org/2000/01/rdf-schema#comment:KiWi</code>),
 *    the URI is mapped to the internal field names of the KiWi index depending on type; the type can be specified as part
 *    of the QUERY in the form QSTRING^^TYPE and can be one of "text", "literal", "int" or "double"; if no type is given,
 *    the type defaults to text.
 * </li>
 * </ul>
 * Generische Suche (solr und sparql)

url:
	baseURL/lmf/search/select
queryParameter:
	q = queryString (MANDATORY)
	lang = language (only relevant for solr)
	qt = 'kiwi' or 'sparql' (queryType)
	wt = 'json' or 'xml' (returnType)
Ergebis:
	redirect to service

generic SOLR:
url:
	baseURL/lmf/search/solr/select
queryParameter:
	q = s.o.
	lang = s.o.
	wt =  s.o.
Ergebnis:
	redirect to service

sprachspezifisch SOLR:
url:
	baseURL/lmf/solr/{core}/select
queryParameter:
	q = s.o.
	lang = s.o.
	wt =  s.o.
Ergebnis:
	result

SPARQL:
url:
	baseURL/lmf/query/sparql
queryParameter:
	q = s.o.
	wt =  s.o.
Ergebnis:
	result
 * <p/>
 * See also: https://code.google.com/p/lmf/wiki/ModuleSemanticSearch
 * User: Sebastian Schaffert
 */
@ApplicationScoped
@Path("/search")
public class SearchWebService {

    public static final String DEFAULT_QT = "solr";
    public static final String DEFAULT_WT = "json";

    @Inject
    private Logger log;

    @Inject
    private ConfigurationService configurationService;

    private Set<String> languages;

    @PostConstruct
    public void initialize() {
        languages = new HashSet<String>(configurationService.getListConfiguration("solr.cores"));

        log.info("Starting SOLR Querying WebService for languages {}",languages);
    }

    @GET
    @Path("/select")
    public Response search(@Context HttpServletRequest request,
            @QueryParam("qt")@DefaultValue(DEFAULT_QT) String queryType,
            @QueryParam("lang") String language,
            @QueryParam("q") String q,
            @QueryParam("wt")@DefaultValue(DEFAULT_WT) String returnType) throws URISyntaxException, UnsupportedEncodingException {

        //SOLR
        if(queryType.equals("kiwi")) {
            String core;
            if(language == null) {
                core = configurationService.getStringConfiguration("solr.core.generic");
            } else {
                //remove from queryString
                if(!languages.contains(language)) {
                    log.warn("language {} not supported; reverting to generic SOLR index",language);
                    language = "generic";
                }
                core = configurationService.getStringConfiguration("solr.core."+language);
            }
            return Response.seeOther(new URI(configurationService.getServerUri() + "solr/" + core + "/select?" + request.getQueryString())).build();
            //return Response.seeOther(new URI(configurationService.getServerUri()+"search/solr/select")).build();
        }

        //SPARQL
        if(queryType.equals("sparql")) return Response.seeOther(new URI(configurationService.getServerUri()+"sparql/select")).build();
        return Response.status(400).entity("QueryType "+queryType+" is not supported").build();
    }


}
