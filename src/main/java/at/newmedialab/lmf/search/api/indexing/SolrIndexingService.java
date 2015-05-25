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
package at.newmedialab.lmf.search.api.indexing;

import at.newmedialab.lmf.search.services.cores.SolrCoreConfiguration;
import at.newmedialab.lmf.search.services.indexing.SolrCoreRuntime;
import at.newmedialab.lmf.worker.api.WorkerService;
import org.openrdf.model.Resource;

import java.util.Collection;

/**
 * The SOLR indexing service is used to index the data that is stored in the KiWi system for efficient full-text
 * search using SOLR. The SOLR system is accessed using a local webservice call to the SOLR servlet, which is
 * mounted under the /solr subdirectory of the application context. Indexing takes place at the @AfterCommit event
 * triggered by the transaction management.
 *
 * <p/>
 * User: sschaffe
 */
public interface SolrIndexingService extends WorkerService<SolrCoreRuntime, SolrCoreConfiguration> {



    /**
     * Rebuild the SOLR index from scratch, using the currently visible triples in the triple store.
     */
    public void rebuildIndex();


    /**
     * Rebuild the SOLR index for the core given as argument.
     * The old index will be droped before.
     * 
     * @param coreNames
     */
    public void rebuildIndex(Collection<String> coreNames);

    /**
     * Return when none of the indexers are performing actions (i.e. all are waiting for resources).
     * @return
     */
    boolean isRunning();

    void indexResource(Resource resource, SolrCoreRuntime runtime);


    /**
     * Force-commit all runtimes to make sure that the data is available for searching. Used by the tests.
     */
    public void commit();
}
