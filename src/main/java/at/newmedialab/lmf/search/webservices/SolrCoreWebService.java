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

import at.newmedialab.lmf.search.api.cores.SolrCoreService;
import at.newmedialab.lmf.search.api.indexing.SolrIndexingService;
import at.newmedialab.lmf.search.api.program.SolrProgramService;
import at.newmedialab.lmf.search.services.cores.SolrCoreConfiguration;
import com.google.common.base.Function;
import com.google.common.collect.Lists;
import com.google.common.io.CharStreams;
import org.apache.marmotta.commons.sesame.repository.ResourceUtils;
import org.apache.marmotta.ldpath.api.backend.RDFBackend;
import org.apache.marmotta.ldpath.backend.sesame.SesameConnectionBackend;
import org.apache.marmotta.ldpath.exception.LDPathParseException;
import org.apache.marmotta.ldpath.model.fields.FieldMapping;
import org.apache.marmotta.ldpath.model.programs.Program;
import org.apache.marmotta.platform.core.api.triplestore.ContextService;
import org.apache.marmotta.platform.core.api.triplestore.SesameService;
import org.openrdf.model.URI;
import org.openrdf.model.Value;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.slf4j.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import java.io.IOException;
import java.io.StringReader;
import java.util.*;

/**
 * Add file description here!
 * <p/>
 * User: sschaffe
 */
@ApplicationScoped
@Path("/solr/cores")
public class SolrCoreWebService {

    @Inject
    private Logger log;

    @Inject
    private SolrCoreService solrCoreService;

    @Inject
    private SolrProgramService programService;

    @Inject
    private SolrIndexingService solrIndexingService;

    @Inject
    private ContextService contextService;

    @Inject
    private SesameService sesameService;

    @POST
    @Path("/{name}")
    @Consumes("text/plain")
    public Response createCore(@PathParam("name") final String name, @Context HttpServletRequest request) {

        if (solrCoreService.hasSolrCore(name))
            // return 403 forbidden if the engine already exists
            return Response.status(Response.Status.FORBIDDEN).entity("engine with name " + name + " already exists; delete it first").build();
        else {
            try {
                final String programString = CharStreams.toString(request.getReader());

                // Check if the program is valid
                final Program<Value> program = programService.parseProgram(new StringReader(programString));

                Thread t = new Thread("Enhancement engine '" + name + "' create") {
                    @Override
                    public void run() {
                        try {
                            final SolrCoreConfiguration e = solrCoreService.createSolrCore(name, programString);
                        } catch (Exception e) {
                            log.error("exception while creating enhancement engine (should not happen, all cases checked before)",e);
                        }
                    };
                };
                t.setDaemon(true);
                t.start();

                return Response.ok().build();
            } catch (IOException ex) {
                log.error("error while uploading new enhancement program {}", name, ex);

                return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("error while uploading new enhancement program: " + ex.getMessage()).build();
            } catch (LDPathParseException e) {
                log.warn("invalid program for enhancer {}: {}. Core NOT changed", name, e.getMessage());
                return Response.status(Response.Status.BAD_REQUEST).entity("Could not parse program: " + e.getMessage()).build();
            }
        }
    }

    @PUT
    @Path("/{name}")
    @Consumes("text/plain")
    public Response updateCore(@PathParam("name") final String name, @Context HttpServletRequest request) {
        if (solrCoreService.hasSolrCore(name)) {
            try {
                final String newProgram = CharStreams.toString(request.getReader());
                final SolrCoreConfiguration engine = solrCoreService.getSolrCore(name);

                // Check if the program is valid
                engine.setProgram(programService.parseProgram(new StringReader(newProgram)));
                engine.setProgramString(newProgram);

                Thread t = new Thread("core '" + name + "' update") {
                    @Override
                    public void run() {
                        solrCoreService.updateSolrCore(engine);
                    };
                };
                t.setDaemon(true);
                t.start();
                return Response.ok().build();
            } catch (IOException e) {
                log.error("error while uploading new search program {}", name, e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("error while uploading new search program: " + e.getMessage()).build();
            } catch (LDPathParseException e) {
                log.warn("invalid replacement program for solr core {}: {}. Core NOT changed", name, e.getMessage());
                return Response.status(Response.Status.BAD_REQUEST).entity("Could not parse program: " + e.getMessage()).build();
            }
        }
        return Response.status(Response.Status.NOT_FOUND).entity("enhancer with name " + name + " does not exists").build();
    }

    @GET
    @Path("/{name}")
    public Response getProgram(@PathParam("name") String name) {
        try {
            if (solrCoreService.hasSolrCore(name)) {
                SolrCoreConfiguration engine = solrCoreService.getSolrCore(name);

                return Response.ok(engine.getProgramString(), "text/plain").build();
            } else
                return Response.status(Response.Status.NOT_FOUND).build();
        } catch (Exception e) {
            return Response.serverError().entity(e.getMessage()).build();
        }
    }

    @DELETE
    @Path("/{name}")
    public Response removeCore(@PathParam("name") String name) {
        if (!solrCoreService.hasSolrCore(name))
            // return 404 not found if core does not exist
            return Response.status(Response.Status.NOT_FOUND).entity("core with name " + name + " does not exists").build();
        else {
            SolrCoreConfiguration engine = solrCoreService.getSolrCore(name);
            solrCoreService.removeSolrCore(engine);
            return Response.ok("core " + name + " deleted").build();
        }
    }

    /**
     * Rebuild the SOLR index by iterating over all resources and storing the index documents for
     * each resource anew.
     * 
     * @return ok if successful, 500 if not
     * @HTTP 200 if SOLR index was rebuilt successfully
     * @HTTP 500 if there was an error while rebuilding the SOLR index (see log)
     */
    @POST
    @Path("/reinit")
    public Response reindexSolr() {
        log.info("Reindexing SOLR index after admin user request ...");
        try {
            Thread t = new Thread("SOLR reindexing :: resource scheduler") {
                @Override
                public void run() {
                    solrIndexingService.reschedule();
                };
            };
            t.setDaemon(true);
            t.start();

            return Response.ok().entity("SOLR index rebuilt successfully").build();
        } catch (Exception ex) {
            log.error("Error while rebuilding SOLR index ...", ex);
            return Response.status(Status.INTERNAL_SERVER_ERROR).entity("error while rebuilding SOLR index").build();
        }
    }

    @GET
    @Produces("application/json")
    public List<String> listActiveCores() {
        return new LinkedList<String>(
                Lists.transform(solrCoreService.listSolrCores(), new Function<SolrCoreConfiguration, String>() {
                    @Override
                    public String apply(SolrCoreConfiguration input) {
                        return input.getName();
                    }
                }));
    }

    @POST
    @Consumes("text/plain")
    @Produces("text/plain")
    public Response checkProgram(@Context HttpServletRequest request) {
        try {
            final Program<Value> program = programService.parseProgram(request.getReader());
            RepositoryConnection conn = sesameService.getConnection();
            try {
                conn.begin();
                SesameConnectionBackend backend = SesameConnectionBackend.withConnection(conn);

                return Response.ok().entity(program.getPathExpression(backend)).build();
            } finally {
                conn.commit();
                conn.close();
            }
        } catch (RepositoryException ex) {
            return Response.status(Status.INTERNAL_SERVER_ERROR).entity("Triple-Store Error: " + ex.getMessage()).build();
        } catch (IOException ex) {
            return Response.status(Status.INTERNAL_SERVER_ERROR).entity("error while uploading program: " + ex.getMessage()).build();
        } catch (LDPathParseException e) {
            return Response.status(Status.BAD_REQUEST).entity(e.getLocalizedMessage()).build();
        }
    }

    /**
     * Debug a search core. Parses the program and retrieves the index-fields for all provided resources.
     * @param contextURI URIs of the resources to execute the program with 
     * @param contextURIarr URIs of the resources to execute the program with (array-style param)
     * @param request
     * @return
     */
    @POST
    @Path("/debug")
    @Consumes("text/plain")
    @Produces("application/json")
    @SuppressWarnings("unchecked")
    public Response debugProgram(@QueryParam("context") String[] contextURI, @QueryParam("context[]") String[] contextURIarr, @Context HttpServletRequest request) {
        try {
            final String[] cs = contextURI != null ? contextURI : contextURIarr;
            log.debug("Debugging RdfPath program");
            final Program<Value> program = programService.parseProgram(request.getReader());
            log.trace("Program parsed, found {} fields", program.getFields().size());

            HashMap<String, Object> result = new HashMap<String, Object>();
            RepositoryConnection conn = sesameService.getConnection();
            try {
                conn.begin();
                SesameConnectionBackend backend = SesameConnectionBackend.withConnection(conn);

                for (String r : cs) {
                    if (!ResourceUtils.isSubject(conn, r)) {
                        log.info("Debug-Context <{}> not found", r);
                        result.put(r, "404: Not Found");
                        continue;
                    }
                    
                    final URI resource = conn.getValueFactory().createURI(r);
                    log.trace("Context loaded: <{}>", resource);
                    if (program.getFilter() != null && !program.getFilter().apply(backend, resource, Collections.singleton((Value) resource))) {
                        result.put(resource.toString(), "Does not pass @filter");
                        continue;
                    }

                    log.trace("Evaluating Program for <{}>.", resource);
                    HashMap<String, HashSet<String>> contextResult = new HashMap<String, HashSet<String>>();
                    if (program.getBooster() != null) {
                        selectValues(resource, contextResult, program.getBooster(), backend);
                    }
                    for (FieldMapping<?, Value> f : program.getFields()) {
                        selectValues(resource, contextResult, f, backend);
                    }
                    result.put(resource.toString(), contextResult);
                }

                log.trace("Returning {} results", result.size());
                return Response.ok().entity(result).build();
            } finally {
                conn.commit();
                conn.close();
            }
        } catch (RepositoryException ex) {
            return Response.status(Status.INTERNAL_SERVER_ERROR).entity("error while debugging program: " + ex.getMessage()).build();
        } catch (IOException ex) {
            return Response.status(Status.INTERNAL_SERVER_ERROR).entity("error while debugging program: " + ex.getMessage()).build();
        } catch (LDPathParseException e) {
            return Response.status(Status.BAD_REQUEST).entity((e.getCause() != null ? e.getCause() : e).getLocalizedMessage()).build();
        }
    }

    private void selectValues(final URI c, HashMap<String, HashSet<String>> result, FieldMapping<?, Value> f, RDFBackend<Value> backend) {
        log.trace("Getting '{}'-values for <{}>", f.getFieldName(), c);
        Collection<?> values = f.getValues(backend, c);
        HashSet<String> val = new HashSet<String>(values.size());
        for (Object object : values) {
            val.add(String.valueOf(object));
        }
        log.trace("Found {} values", val.size());
        result.put(f.getFieldName(), val);
    }

}
