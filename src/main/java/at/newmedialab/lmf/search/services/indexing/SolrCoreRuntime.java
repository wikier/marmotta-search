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
package at.newmedialab.lmf.search.services.indexing;

import at.newmedialab.lmf.search.api.indexing.SolrIndexingService;
import at.newmedialab.lmf.search.filters.LMFSearchFilter;
import at.newmedialab.lmf.search.services.cores.SolrCoreConfiguration;
import at.newmedialab.lmf.worker.services.WorkerRuntime;
import org.apache.marmotta.kiwi.model.rdf.KiWiResource;
import org.apache.marmotta.platform.core.util.CDIContext;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServer;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.embedded.EmbeddedSolrServer;
import org.apache.solr.client.solrj.request.AbstractUpdateRequest.ACTION;
import org.apache.solr.client.solrj.request.UpdateRequest;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.apache.solr.common.SolrInputDocument;
import org.openrdf.model.Resource;
import org.openrdf.model.URI;
import org.openrdf.model.ValueFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.locks.ReentrantLock;

/**
 * A class bundling administrative information about a running SOLR core.
 * <p/>
 * Author: Sebastian Schaffert
 */
public final class SolrCoreRuntime extends WorkerRuntime<SolrCoreConfiguration> {

    private Logger                  log                    = LoggerFactory.getLogger(SolrCoreRuntime.class);


    /**
     * The connection to the SOLR server to be used when committing this core
     */
    private SolrServer              server;

    // used to ensure that the servers are initialised only by one thread
    private final ReentrantLock     serverLock;

    private SolrIndexingService parent;

    public SolrCoreRuntime(SolrCoreConfiguration configuration, SolrIndexingService parent) {
        super(configuration);

        this.parent = parent;

        serverLock = new ReentrantLock();

        LMFSearchFilter filter = CDIContext.getInstance(LMFSearchFilter.class);
        if (filter.getCores() == null) {
            log.warn("SOLR server not registered in this application, cannot index resources");
        } else {
            serverLock.lock();
            try {
                server = new EmbeddedSolrServer(filter.getCores(), config.getName());
                log.debug("({}) created embedded SolrServer", config.getName());
            } finally {
                serverLock.unlock();
            }
        }
    }

    @Override
    protected void execute(Resource resource) {
        parent.indexResource(resource,this);
    }



    /**
     * Ask the server to retrieve all documents that depend on the resource passed as argument; this
     * query is
     * carried out by querying the dependencies field of a document.
     * 
     * @param resource
     * @return
     */
    public Collection<URI> listDependent(ValueFactory valueFactory, URI resource) {
        SolrQuery query = new SolrQuery();
        query.setQuery("lmf.dependencies:\"" + resource.stringValue() + "\"");
        query.setFields("lmf.uri");
        query.setRows(Integer.MAX_VALUE);
        try {
            SolrDocumentList docs = server.query(query).getResults();

            Set<URI> result = new HashSet<URI>();
            for (SolrDocument doc : docs) {
                result.add(valueFactory.createURI((String) doc.getFirstValue("lmf.uri")));
            }
            return result;
        } catch (SolrServerException e) {
            return Collections.emptyList();
        }
    }

    /**
     * Queue the input document in the document queue of this SolrCoreRuntime and check whether it is
     * necessary to commit.
     * 
     * @param doc the document to be added to the Solr Core
     */
    public void queueInputDocument(SolrInputDocument doc) {
        if (doc != null) {
            serverLock.lock();
            try {
                final Object fv = doc.getFieldValue("id");
                if (fv != null) {
                    UpdateRequest update = new UpdateRequest();
                    update.setCommitWithin(10000);
                    update.add(doc);
                    //update.setAction(ACTION.COMMIT, false, false);
                    server.request(update);
                } else {
                    log.warn("({}) rejected document without 'id' for update", config.getName());
                }
            } catch (IOException e) {
                log.warn("I/O exception while adding SOLR document to index",e);
            } catch (SolrServerException e) {
                log.warn("server exception while adding SOLR document to index",e);
            } finally {
                serverLock.unlock();
            }
        }
    }

    /**
     * Queue the deletion of a document in the Solr Core and check whether it is necessary to
     * commit.
     * 
     * @param docId
     */
    public void queueDeletion(String docId) {
        serverLock.lock();
        try {
            UpdateRequest update = new UpdateRequest();
            update.setCommitWithin(10000);
            update.deleteById(docId);
            //update.setAction(ACTION.COMMIT, false, false);
            server.request(update);
        } catch (IOException e) {
            log.warn("I/O exception while removing SOLR document from index",e);
        } catch (SolrServerException e) {
            log.warn("server exception while removing SOLR document from index",e);
        } finally {
            serverLock.unlock();
        }

    }


    /**
     * Force a commit of the solr index managed by this runtime. Used e.g. in testing to ensure the data is commited
     * and available for searching.
     */
    public void commit() {
        serverLock.lock();
        try {
            server.commit();
        } catch (IOException e) {
            log.warn("I/O exception while removing SOLR document from index",e);
        } catch (SolrServerException e) {
            log.warn("server exception while removing SOLR document from index",e);
        } finally {
            serverLock.unlock();
        }
    }

    /**
     * Clear the index managed by this SolrCoreRuntime.
     */
    public void clear() {
        serverLock.lock();
        try {
            UpdateRequest request = new UpdateRequest();
            request.deleteByQuery("id:[* TO *]");
            request.setAction(ACTION.COMMIT, true, true);

            server.request(request);
        } catch (IOException e) {
            log.error("(" + config.getName() + ") could not clear search index: an I/O Exception occurred", e);
        } catch (SolrServerException e) {
            log.error("(" + config.getName() + ") could not clear search index: a SOLR Exception occurred (server not available?)", e);
        } catch (Exception e) {
            log.error("(" + config.getName() + ") index could not be cleared: a runtime Exception occurred (server sending invalid response?)", e);
        } finally {
            serverLock.unlock();
        }

    }

    /**
     * Shutdown the core and all associated threads and connections
     */
    public void shutdown() {
        super.shutdown();
    }


    @Override
    public boolean schedule(Resource resource) {
        if(!super.schedule(resource)) {
            queueDeletion(getResourceId(resource));
            return false;
        } else {
            return true;
        }
    }

    private static String getResourceId(Resource r) {
        if(r instanceof KiWiResource)
            return String.valueOf(((KiWiResource)r).getId());
        else
            return r.stringValue();
    }


}
