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

import static org.apache.marmotta.commons.sesame.repository.ResourceUtils.getTypes;

import java.io.StringReader;
import java.net.*;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;

import com.google.common.base.Function;
import com.google.common.collect.Collections2;
import org.apache.marmotta.commons.sesame.repository.ResourceUtils;
import org.apache.marmotta.commons.sesame.transactions.model.TransactionData;
import org.apache.marmotta.kiwi.model.rdf.KiWiResource;
import org.apache.marmotta.kiwi.model.rdf.KiWiUriResource;
import org.apache.marmotta.ldpath.backend.sesame.ContextAwareSesameConnectionBackend;
import org.apache.marmotta.ldpath.backend.sesame.SesameConnectionBackend;
import org.apache.marmotta.ldpath.exception.LDPathParseException;
import org.apache.marmotta.ldpath.model.fields.FieldMapping;
import org.apache.marmotta.ldpath.model.programs.Program;
import org.apache.marmotta.platform.core.api.triplestore.SesameService;
import org.apache.marmotta.platform.core.events.SystemStartupEvent;
import org.apache.marmotta.platform.core.exception.MarmottaException;
import org.apache.marmotta.platform.core.qualifiers.event.Created;
import org.apache.marmotta.platform.core.qualifiers.event.Removed;
import org.apache.marmotta.platform.core.qualifiers.event.Updated;
import org.apache.marmotta.platform.core.qualifiers.event.transaction.AfterCommit;
import org.apache.solr.common.SolrInputDocument;
import org.openrdf.model.*;
import org.openrdf.model.URI;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.RepositoryResult;
import org.slf4j.Logger;

import at.newmedialab.lmf.search.api.cores.SolrCoreService;
import at.newmedialab.lmf.search.api.indexing.SolrIndexingService;
import at.newmedialab.lmf.search.api.program.SolrProgramService;
import at.newmedialab.lmf.search.services.cores.SolrCoreConfiguration;
import at.newmedialab.lmf.worker.services.WorkerRuntime;
import at.newmedialab.lmf.worker.services.WorkerServiceImpl;

/**
 * Add file description here!
 * <p/>
 * User: sschaffe
 */
@ApplicationScoped
public class SolrIndexingServiceImpl extends WorkerServiceImpl<SolrCoreRuntime,SolrCoreConfiguration> implements SolrIndexingService {

    @Inject
    private Logger log;

    @Inject
    private SesameService sesameService;

    @Inject
    private SolrCoreService solrCoreService;

    @Inject
    private SolrProgramService solrProgramService;


    public SolrIndexingServiceImpl() {
    }


    public void startupEvent(@Observes SystemStartupEvent e) {

    }


    /**
     * Return a name to identify this worker service implementation. Needs to be implemented by subclasses.
     *
     * @return
     */
    @Override
    public String getName() {
        return "SolrIndexingService";
    }

    /**
     * Create a worker runtime using the configuration passed as argument. Needs to be implemented by subclasses.
     *
     * @param config
     * @return
     */
    @Override
    public SolrCoreRuntime createWorker(SolrCoreConfiguration config) {
        return new SolrCoreRuntime(config, this);
    }

    /**
     * Return a list of all currently active worker configurations. Needs to be implemented by subclasses.
     *
     * @return
     */
    @Override
    public List<SolrCoreConfiguration> listWorkerConfigurations() {
        return solrCoreService.listSolrCores();
    }


    /**
     * This method is executed before rescheduling of resources in a configuration takes place. Can be used
     * to tun necessary cleanups before execution. By default, does nothing.
     * <p/>
     * For SOLR, in case of a complete reschedule of an engine we delete the existing index before rescheduling.
     *
     * @param config
     */
    @Override
    public void doBeforeReschedule(SolrCoreConfiguration config) {
        if(config.isClearBeforeReschedule() && runtimes.containsKey(config.getName())) {
            runtimes.get(config.getName()).clear();
        }
    }


    /**
     * Schedule all dependencies dependency tracking is enabled.
     * @param config
     * @param resource
     */
    @Override
    public void doAfterReschedule(SolrCoreConfiguration config, Resource resource) {
        // schedule all resources that depend on the resource ...
        if(config.isUpdateDependencies() && resource instanceof URI) {
            SolrCoreRuntime core = runtimes.get(config.getName());

            Collection<URI> dependencies = core.listDependent(sesameService.getRepository().getValueFactory(), (URI) resource);
            if(dependencies.size() > 0) {
                log.info("scheduling {} resources depending on {} ...",dependencies.size(),resource);
                for(URI dep : dependencies) {
                    core.schedule(dep);
                }
            }
        }
    }


    /**
     * Rebuild the SOLR index from scratch, using the currently visible triples
     * in the triple store.
     */
    @Override
    public void rebuildIndex() {
        reschedule();
    }

    @Override
    public void rebuildIndex(Collection<String> coreNames) {
        for(String coreName : coreNames) {
            SolrCoreConfiguration engine = solrCoreService.getSolrCore(coreName);
            if(engine != null) {
                reschedule(engine);
            }
        }
    }

    @Override
    public void commit() {
        for(SolrCoreRuntime runtime : runtimes.values()) {
            runtime.commit();
        }
    }

    @Override
    public void indexResource(Resource resource, SolrCoreRuntime runtime) {
        Program<Value> program = runtime.getConfiguration().getProgram();
        if(program == null) {
            try {
                program = solrProgramService.parseProgram(new StringReader(runtime.getConfiguration().getProgramString()));
                runtime.getConfiguration().setProgram(program);
            } catch (LDPathParseException e) {
                log.error("error parsing path program for engine {}",runtime.getConfiguration().getName(),e);
                return;
            }
        }

        if (resource == null) return;
        final String coreName = runtime.getConfiguration().getName();
        final String rID = getResourceId(resource);

        try {
            final RepositoryConnection connection = sesameService.getConnection();
            try {
                connection.begin();

                //if (resource instanceof KiWiResource && ((KiWiResource) resource).isDeleted()) {
                //    runtime.queueDeletion(rID);
                //}
                //FIXME: find a proper way to do this with the new api
                boolean deleted = true;
                RepositoryResult<Statement> statements = connection.getStatements(resource, null, null, false);
                while (statements.hasNext()) {
                    if (!ResourceUtils.isDeleted(connection, statements.next())) {
                        deleted = false;
                        break;
                    }
                }
                if (deleted) {
                    runtime.queueDeletion(rID);
                }

                final Resource[] contexts;
                if (program.getGraphs().isEmpty()) {
                    contexts = new Resource[0];
                } else {
                    contexts = Collections2.transform(program.getGraphs(), new Function<java.net.URI, URI>() {
                        @Override
                        public URI apply(java.net.URI in) {
                            return connection.getValueFactory().createURI(in.toString());
                        }
                    }).toArray(new Resource[0]);
                }

                final SesameConnectionBackend backend = ContextAwareSesameConnectionBackend.withConnection(connection, contexts);
                if (program.getFilter() != null && !program.getFilter().apply(backend, resource, Collections.singleton((Value) resource))) {
                    if (log.isDebugEnabled()) {
                        log.debug("({}) <{}> does not match filter '{}', ignoring", coreName, resource, program.getFilter().getPathExpression(backend));
                    }
                    // Some resources might be still in the index, so delete it.
                    runtime.queueDeletion(rID);
                    connection.commit();
                    return;
                } else if (log.isTraceEnabled() && program.getFilter() != null) {
                    log.trace("({}) <{}> matches filter '{}', indexing...", coreName, resource, program.getFilter().getPathExpression(backend) );
                }

                SolrInputDocument doc = new SolrInputDocument();

                doc.addField("id", rID);
                doc.addField("lmf.indexed", new Date());
                if (resource instanceof KiWiUriResource) {
                    doc.addField("lmf.created", ((KiWiUriResource) resource).getCreated());
                }

                if (resource instanceof URI) {
                    URI r = (URI) resource;

                    doc.addField("lmf.uri", r.stringValue());
                } else if (resource instanceof BNode) {
                    BNode r = (BNode) resource;
                    doc.addField("lmf.anon_id", r.getID());
                } else {
                    // This should not happen, but never the less...
                    log.warn("Tried to index a Resource that is neither a URI nor BNode: {}", resource);
                    runtime.queueDeletion(rID);
                    connection.rollback();
                    return;
                }

                for (Resource type : getTypes(connection, resource)) {
                    if (type instanceof KiWiUriResource) {
                        doc.addField("lmf.type", type.stringValue());
                    }
                }

                // Set the document boost
                if (program.getBooster() != null) {
                    final Collection<Float> boostValues = program.getBooster().getValues(backend, resource);
                    if (boostValues.size() > 0) {
                        final Float docBoost = boostValues.iterator().next();
                        if (boostValues.size() > 1) {
                            log.warn("found more than one boostFactor for <{}>, using {}", resource, docBoost);
                        }
                        doc.setDocumentBoost(docBoost);
                    }
                }

                // set shortcut fields
                Set<Value> dependencies = new HashSet<Value>();
                for (FieldMapping<?, Value> rule : program.getFields()) {
                    Map<Value, List<Value>> paths = new HashMap<Value, List<Value>>();
                    Collection<?> values = rule.getValues(backend, resource, paths);
                    try {
                        final boolean isSinge = !isMultiValuedField(rule);
                        for (Object value : values) {
                            if (value != null) {
                                doc.addField(rule.getFieldName(), value);
                                if (isSinge) {
                                    break;
                                }
                            }
                        }
                        if (rule.getFieldConfig() != null) {
                            final String b = rule.getFieldConfig().get("boost");
                            try {
                                if (b != null) {
                                    doc.getField(rule.getFieldName()).setBoost(Float.parseFloat(b));
                                }
                            } catch (NumberFormatException e) {
                                throw new NumberFormatException("could not parse boost value: '" + b + "'");
                            }
                        }
                    } catch (Exception ex) {
                        log.error("({}) exception while building path indexes for <{}>, field {}: {}", coreName, resource, rule.getFieldName(), ex.getMessage() );
                        log.debug("(" + coreName + ") stacktrace", ex);
                    }
                    if (runtime.getConfiguration().isUpdateDependencies()) {
                        for (List<Value> path : paths.values()) {
                            dependencies.addAll(path);
                        }
                    }
                }

                if(runtime.getConfiguration().isUpdateDependencies()) {
                    for (Value dependency : dependencies) {
                        if (dependency instanceof URI && !dependency.equals(resource)) {
                            doc.addField("lmf.dependencies", dependency.stringValue());
                        }
                    }
                }

                runtime.queueInputDocument(doc);

                connection.commit();
            } finally {
                connection.close();
            }
        } catch (RepositoryException e) {
            log.warn("Could not build index document for " + resource.stringValue(), e);
        } catch (Throwable t) {
            log.error("unknown error while indexing document",t);
        }
    }

    private boolean isMultiValuedField(FieldMapping<?, Value> rule) {
        try {
            // Field type location is always single
            if ("location".equals(solrProgramService.getSolrFieldType(rule.getFieldType().toString()))) return false;
        } catch (MarmottaException e) {
            // ignore
        }
        // If defined for the field
        if (rule.getFieldConfig() != null && rule.getFieldConfig().containsKey("multiValued"))
            return Boolean.parseBoolean(rule.getFieldConfig().get("multiValued"));

        // We use multiValued=true as default.
        return true;
    }

    /**
     * Return an appropriate resource id, depending on which backend implementation is used.
     *
     * @param r
     * @return
     */
    private static String getResourceId(Resource r) {
        if(r instanceof KiWiResource)
            return String.valueOf(((KiWiResource)r).getId());
        else
            return r.stringValue();
    }


    /**
     * Return when none of the indexers are performing actions (i.e. all are waiting for resources).
     * @return
     */
    @Override
    public boolean isRunning() {
        for(WorkerRuntime<?> runtime : runtimes.values()) {
            if(runtime.isRunning()) return true;
        }
        return false;
    }


    @Override
    public void notifyTransactionCommit(@Observes @AfterCommit TransactionData data) {
        if (!configurationService.getBooleanConfiguration("solr.enabled")) {
            return;
        }

        super.notifyTransactionCommit(data);
    }

    @Override
    public void notifyEngineAdd(@Observes @Created SolrCoreConfiguration engine) {
        super.notifyEngineAdd(engine);
    }

    @Override
    public void notifyEngineUpdate(@Observes @Updated SolrCoreConfiguration engine) {
        super.notifyEngineUpdate(engine);
    }

    @Override
    public void notifyEngineRemove(@Observes @Removed SolrCoreConfiguration engine) {
        super.notifyEngineRemove(engine);
    }
}
