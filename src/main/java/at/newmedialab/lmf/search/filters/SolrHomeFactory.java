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
package at.newmedialab.lmf.search.filters;

import org.apache.marmotta.platform.core.api.config.ConfigurationService;
import org.apache.marmotta.platform.core.util.CDIContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.naming.Context;
import javax.naming.Name;
import javax.naming.spi.ObjectFactory;
import java.util.Hashtable;

/**
 * Add file description here!
 * <p/>
 * Author: Sebastian Schaffert
 */
public class SolrHomeFactory implements ObjectFactory {

    private Logger log = LoggerFactory.getLogger(SolrHomeFactory.class);

    @Override
    public Object getObjectInstance(Object o, Name name, Context context, Hashtable<?, ?> hashtable) throws Exception {
        ConfigurationService configurationService = CDIContext.getInstance(ConfigurationService.class);

        log.info("JNDI: retrieving SOLR home: {}",configurationService.getStringConfiguration("solr.home"));

        return configurationService.getStringConfiguration("solr.home");
    }
}
