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
package at.newmedialab.lmf.search.services.program;

import at.newmedialab.lmf.search.api.program.SolrProgramService;
import at.newmedialab.lmf.search.ldpath.model.transformers.LatLonTransformer;
import org.apache.marmotta.commons.sesame.model.Namespaces;
import org.apache.marmotta.ldpath.LDPath;
import org.apache.marmotta.ldpath.backend.sesame.SesameConnectionBackend;
import org.apache.marmotta.ldpath.exception.LDPathParseException;
import org.apache.marmotta.ldpath.model.programs.Program;
import org.apache.marmotta.ldpath.model.transformers.StringTransformer;
import org.apache.marmotta.ldpath.parser.Configuration;
import org.apache.marmotta.ldpath.parser.DefaultConfiguration;
import org.apache.marmotta.platform.core.api.triplestore.SesameService;
import org.apache.marmotta.platform.core.exception.MarmottaException;
import org.apache.marmotta.platform.ldpath.api.AutoRegisteredLDPathFunction;
import org.openrdf.model.Value;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.slf4j.Logger;

import javax.annotation.PostConstruct;
import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Add file description here!
 * <p/>
 * User: sschaffe
 */
@ApplicationScoped
public class SolrProgramServiceImpl implements SolrProgramService {

    @Inject
    private Logger                           log;

    @Inject
    private SesameService sesameService;

    private Configuration<Value> ldpathConfig;


    /**
     * A map mapping from XSD types to SOLR types.
     */
    public static final Map<String, String> xsdSolrTypeMap;
    static {
        Map<String, String> typeMap = new HashMap<String, String>();

        typeMap.put(Namespaces.NS_XSD + "decimal", "long");
        typeMap.put(Namespaces.NS_XSD + "integer", "int");
        typeMap.put(Namespaces.NS_XSD + "long", "long");
        typeMap.put(Namespaces.NS_XSD + "short", "int");
        typeMap.put(Namespaces.NS_XSD + "double", "double");
        typeMap.put(Namespaces.NS_XSD + "float", "float");
        typeMap.put(Namespaces.NS_XSD + "dateTime", "date");
        typeMap.put(Namespaces.NS_XSD + "date", "date");
        typeMap.put(Namespaces.NS_XSD + "time", "date");
        typeMap.put(Namespaces.NS_XSD + "boolean", "boolean");
        typeMap.put(Namespaces.NS_XSD + "anyURI", "uri");
        typeMap.put(Namespaces.NS_XSD + "string", "string");

        typeMap.put(Namespaces.NS_LMF_TYPES + "text", "text_generic");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_ar", "text_ar");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_bg", "text_bg");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_ca", "text_ca");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_cjk", "text_cjk");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_cz", "text_cz");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_da", "text_da");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_de", "text_de");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_el", "text_el");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_en", "text_en");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_es", "text_es");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_eu", "text_eu");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_fa", "text_fa");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_fi", "text_fi");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_fr", "text_fr");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_ga", "text_ga");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_gl", "text_gl");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_hi", "text_hi");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_hu", "text_hu");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_hy", "text_hy");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_id", "text_id");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_it", "text_it");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_ja", "text_ja");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_lv", "text_lv");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_nl", "text_nl");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_no", "text_no");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_pt", "text_pt");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_ro", "text_ro");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_ru", "text_ru");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_sv", "text_sv");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_th", "text_th");
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_tr", "text_tr");
        
        typeMap.put(Namespaces.NS_LMF_TYPES + "text_ws", "text_ws");

        typeMap.put(Namespaces.NS_LMF_TYPES + "position", "location");
        typeMap.put(Namespaces.NS_LMF_TYPES + "position_s", "location");
        typeMap.put(Namespaces.NS_LMF_TYPES + "location", "location");
        typeMap.put(Namespaces.NS_LMF_TYPES + "location_s", "location");

        typeMap.put(Namespaces.NS_LMF_TYPES + "geohash", "location_rpt");
        typeMap.put(Namespaces.NS_LMF_TYPES + "geohash_s", "location_rpt");

        typeMap.put(Namespaces.NS_LMF_TYPES + "color", "rgbColor");

        typeMap.put(Namespaces.NS_LMF_TYPES + "lower_string", "lower_string");
        typeMap.put(Namespaces.NS_LMF_TYPES + "reverse_path_ngrams", "reverse_path_ngrams");

        xsdSolrTypeMap = Collections.unmodifiableMap(typeMap);
    }


    @Inject @Any
    private Instance<AutoRegisteredLDPathFunction> functions;


    public SolrProgramServiceImpl() {

    }


    /**
     * loads programs and languages
     */
    @PostConstruct
    @Override
    public void initialize() {
        log.info("LMF SOLR Indexing Program Service starting up ...");

        ldpathConfig = new DefaultConfiguration<Value>();

        registerFunctions();
        registerTransformers();
    }


    /**
     * Register all available functions.
     * @see AutoRegisteredLDPathFunction
     */
    public void registerFunctions() {
        for(AutoRegisteredLDPathFunction function : functions) {
            ldpathConfig.addFunction(Namespaces.NS_LMF_FUNCS + function.getLocalName(), function);
        }
    }

    /**
     * Register the default transformers
     */
    public void registerTransformers() {
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_ar", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_bg", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_ca", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_cjk", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_cz", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_da", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_de", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_el", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_en", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_es", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_eu", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_fa", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_fi", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_fr", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_ga", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_gl", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_hi", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_hu", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_hy", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_id", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_it", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_ja", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_lv", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_nl", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_no", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_pt", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_ro", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_ru", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_sv", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_th", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_tr", new StringTransformer<Value>());

        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "text_ws", new StringTransformer<Value>());

        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "position", new LatLonTransformer());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "position_s", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "location", new LatLonTransformer());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "location_s", new StringTransformer<Value>());

        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "geohash", new LatLonTransformer());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "geohash_s", new StringTransformer<Value>());

        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "color", new StringTransformer<Value>());

        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "reverse_path_ngrams", new StringTransformer<Value>());
        ldpathConfig.addTransformer(Namespaces.NS_LMF_TYPES + "lower_string", new StringTransformer<Value>());
    }


    @Override
    public Program<Value> parseProgram(InputStream in) throws LDPathParseException {
        return parseProgram(new InputStreamReader(in));
    }

    @Override
    public Program<Value> parseProgram(Reader r) throws LDPathParseException {
        try {
            RepositoryConnection connection = sesameService.getConnection();
            try {
                connection.begin();
                SesameConnectionBackend backend = SesameConnectionBackend.withConnection(connection);

                LDPath<Value> ldpath = new LDPath<Value>(backend, ldpathConfig);
                return ldpath.parseProgram(r);
            } finally {
                connection.commit();
                connection.close();
            }
        } catch (RepositoryException e) {
            throw new LDPathParseException("could not parse because of an error in the backend", e);
        }
    }

    /**
     * Return the SOLR field type for the XSD type passed as argument. The xsdType needs to
     * be a fully qualified URI. If no field type is defined, will return null.
     *
     * @param xsdType a URI identifying the XML Schema datatype
     * @return
     */
    @Override
    public String getSolrFieldType(String xsdType) throws MarmottaException {
        String result = xsdSolrTypeMap.get(xsdType);
        if(result == null) throw new MarmottaException("could not find SOLR field type for type "+xsdType);
        else
            return result;
    }

}
