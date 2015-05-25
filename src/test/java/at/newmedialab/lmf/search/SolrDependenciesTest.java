package at.newmedialab.lmf.search;

import at.newmedialab.lmf.search.api.cores.SolrCoreService;
import at.newmedialab.lmf.search.api.indexing.SolrIndexingService;
import at.newmedialab.lmf.search.api.program.SolrProgramService;
import at.newmedialab.lmf.search.exception.CoreAlreadyExistsException;
import at.newmedialab.lmf.search.filters.LMFSearchFilter;
import at.newmedialab.lmf.search.services.cores.SolrCoreConfiguration;
import org.apache.commons.io.IOUtils;
import org.apache.marmotta.commons.sesame.filter.SesameFilter;
import org.apache.marmotta.ldpath.exception.LDPathParseException;
import org.apache.marmotta.ldpath.model.programs.Program;
import org.apache.marmotta.platform.core.api.config.ConfigurationService;
import org.apache.marmotta.platform.core.api.importer.ImportService;
import org.apache.marmotta.platform.core.api.triplestore.SesameService;
import org.apache.marmotta.platform.core.exception.io.MarmottaImportException;
import org.apache.marmotta.platform.core.model.filter.MarmottaLocalFilter;
import org.apache.marmotta.platform.core.test.base.JettyMarmotta;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.embedded.EmbeddedSolrServer;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.openrdf.model.Resource;
import org.openrdf.model.URI;
import org.openrdf.model.Value;
import org.openrdf.model.vocabulary.RDFS;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;

import java.io.IOException;
import java.io.StringReader;
import java.util.Iterator;

import static org.hamcrest.CoreMatchers.hasItem;
import static org.junit.Assert.*;

/**
 * Add file description here!
 *
 * @author Sebastian Schaffert (sschaffert@apache.org)
 */
public class SolrDependenciesTest {

    private static final String CORE_NAME = "schema";
    private JettyMarmotta lmf;
    private SolrProgramService solrProgramService;
    private SolrCoreService solrCoreService;
    private SolrIndexingService solrIndexingService;
    private ConfigurationService configurationService;
    private SesameService sesameService;
    private ImportService importService;
    private LMFSearchFilter searchFilter;

    @Before
    public void setUp() throws Exception {
        lmf = new JettyMarmotta("/");
        solrProgramService = lmf.getService(SolrProgramService.class);
        solrCoreService = lmf.getService(SolrCoreService.class);
        configurationService = lmf.getService(ConfigurationService.class);
        importService = lmf.getService(ImportService.class);
        solrIndexingService = lmf.getService(SolrIndexingService.class);
        searchFilter = lmf.getService(LMFSearchFilter.class);
        sesameService = lmf.getService(SesameService.class);

        configurationService.setBooleanConfiguration("ldcache.enabled", false);
    }

    @After
    public void tearDown() throws Exception {
        lmf.shutdown();
    }


    /**
     * Create a sample core, import some data, wait until processing is finished, search for document.
     *
     * @throws at.newmedialab.lmf.search.exception.CoreAlreadyExistsException
     * @throws java.io.IOException
     */
    @Test
    public void testDependencies() throws CoreAlreadyExistsException, IOException, MarmottaImportException, InterruptedException, SolrServerException {
        String programString = IOUtils.toString(this.getClass().getResourceAsStream("books.ldpath"));

        try {
            // This should never fail
            final Program<Value> p = solrProgramService.parseProgram(new StringReader(programString));
            assertNotNull(p);

            // Here come the fun
            SolrCoreConfiguration engine = solrCoreService.createSolrCore(CORE_NAME, programString);
            assertThat(solrCoreService.listSolrCores(), hasItem(engine));
            assertTrue(solrCoreService.hasSolrCore(CORE_NAME));

            // change the local_only parameter of the new core, because the resources might not be considered local
            configurationService.setBooleanConfiguration("solr."+CORE_NAME+".local_only", false);
            configurationService.setBooleanConfiguration("solr." + CORE_NAME + ".update_dependencies", true);

            // check if local_only has been disabled as expected
            Iterator<SesameFilter<Resource>> it = engine.getFilters().iterator();
            while(it.hasNext()) {
                if(it.next() instanceof MarmottaLocalFilter) {
                    fail("local_only has not been disabled properly");
                }
            }

            // now import the rdf file and wait for the core to be finished
            importService.importData(this.getClass().getResourceAsStream("books.rdf"), "application/rdf+xml", null, null);

            Thread.sleep(1000);

            while(solrIndexingService.isRunning()) {
                Thread.sleep(1000);
            }
            solrIndexingService.commit();

            EmbeddedSolrServer server = new EmbeddedSolrServer(searchFilter.getCores(), CORE_NAME);

            // test if all 10 books have the dependencies field
            SolrQuery query1 = new SolrQuery("lmf.dependencies:\"http://localhost/resource/Book\"");
            QueryResponse resp1 = server.query(query1);
            assertEquals(10, resp1.getResults().getNumFound());


            // test if all 10 books have the type book
            SolrQuery query2 = new SolrQuery("type:\"Book\"");
            QueryResponse resp2 = server.query(query2);
            assertEquals(10, resp2.getResults().getNumFound());


            // rename the class "Book" to "Book Type" and check if the name is updated for all books
            RepositoryConnection con = sesameService.getConnection();
            try {
                con.begin();

                URI r = con.getValueFactory().createURI("http://localhost/resource/Book");


                con.remove(r, RDFS.LABEL, null);
                con.add(r, RDFS.LABEL, con.getValueFactory().createLiteral("Book Type"));

                con.commit();
            } finally {
                con.close();
            }

            Thread.sleep(1000);

            while(solrIndexingService.isRunning()) {
                Thread.sleep(1000);
            }
            solrIndexingService.commit();


            // test if all 10 books have been updated
            SolrQuery query3 = new SolrQuery("type:\"Book Type\"");
            QueryResponse resp3 = server.query(query3);
            assertEquals(10, resp3.getResults().getNumFound());


            solrCoreService.removeSolrCore(engine);
        } catch (LDPathParseException e) {
            fail("Invalid LDPath program");
        } catch (RepositoryException e) {
            fail("Cannot access RDF repository");
        }


    }

}
