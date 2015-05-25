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
package at.newmedialab.lmf.search.ldpath.model.transformers;

import org.apache.marmotta.commons.sesame.model.Namespaces;
import org.apache.marmotta.ldpath.api.backend.RDFBackend;
import org.apache.marmotta.ldpath.api.transformers.NodeTransformer;
import org.apache.marmotta.ldpath.model.selectors.PropertySelector;
import org.apache.marmotta.ldpath.model.transformers.StringTransformer;
import org.apache.solr.schema.LatLonType;
import org.openrdf.model.URI;
import org.openrdf.model.Value;

import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Transforms a node into the external value for {@link LatLonType}.
 * 
 * @author Jakob Frank <jakob.frank@salzburgresearch.at>
 * 
 */
public class LatLonTransformer implements NodeTransformer<String,Value> {

    private static final String DEFAULT_LON_PROPERTY_URI = Namespaces.NS_GEO + "long",
            DEFAULT_LAT_PROPERTY_URI = Namespaces.NS_GEO + "lat";

    private static final StringTransformer<Value> stringer = new StringTransformer<Value>();

    final private String latPropertyUri, lonPropertyUri;
    private PropertySelector<Value> latProperty = null, lonProperty = null;

    public LatLonTransformer(String latUri, String lonUri) {
        latPropertyUri = latUri;
        lonPropertyUri = lonUri;
    }

    public LatLonTransformer(URI latProp, URI lonProp) {
        this(latProp.stringValue(), lonProp.stringValue());
        latProperty = new PropertySelector<Value>(latProp);
        lonProperty = new PropertySelector<Value>(lonProp);
    }

    public LatLonTransformer() {
        this(DEFAULT_LAT_PROPERTY_URI, DEFAULT_LON_PROPERTY_URI);
    }

    /**
     * Transform the node into the external value for {@link LatLonType}. This is done by retrieving
     * the lat/lon properties of the node from the tripleStore.
     * 
     * @return The external representation of a LatLon position.
     * @see LatLonType
     */
    @Override
    public String transform(RDFBackend<Value> backend, Value node, Map<String,String> configuration) throws IllegalArgumentException {
        if (latProperty == null || lonProperty == null) {
            final URI latUR = (URI)backend.createURI(latPropertyUri);
            final URI lonUR = (URI)backend.createURI(lonPropertyUri);
            if (latUR != null && lonUR != null) {
                latProperty = new PropertySelector<Value>(latUR);
                lonProperty = new PropertySelector<Value>(lonUR);
            }
        }
        if (latProperty == null || lonProperty == null) { throw new IllegalArgumentException("lat/lon properties not found in triplestore."); }

        try {
            Value lat = latProperty.select(backend, node,null,null).iterator().next(), lon = lonProperty.select(backend, node,null,null).iterator().next();

            // Using a StringTransformer here to avoid loosing precision.
            String latStr = stringer.transform(backend, lat, configuration), lonStr = stringer.transform(backend,lon, configuration);
            // Check for valid doubles
            Double.parseDouble(latStr);
            Double.parseDouble(lonStr);

            // That's the externalVal of LatLonType
            return latStr + "," + lonStr;
        } catch (NoSuchElementException e) {
            throw new IllegalArgumentException("cannot transform node without lat/lon property to LatLonType");
        }
    }

}
