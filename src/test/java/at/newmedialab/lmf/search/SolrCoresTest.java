package at.newmedialab.lmf.search;

import at.newmedialab.lmf.search.api.cores.SolrCoreService;
import at.newmedialab.lmf.search.api.program.SolrProgramService;
import at.newmedialab.lmf.search.exception.CoreAlreadyExistsException;
import at.newmedialab.lmf.search.filters.LMFSearchFilter;
import at.newmedialab.lmf.search.services.cores.SolrCoreConfiguration;
import at.newmedialab.lmf.search.services.program.SolrProgramServiceImpl;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.marmotta.ldpath.exception.LDPathParseException;
import org.apache.marmotta.ldpath.model.fields.FieldMapping;
import org.apache.marmotta.ldpath.model.programs.Program;
import org.apache.marmotta.platform.core.api.config.ConfigurationService;
import org.apache.marmotta.platform.core.test.base.JettyMarmotta;
import org.apache.solr.core.CoreContainer;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openrdf.model.Value;

import java.io.File;
import java.io.IOException;
import java.io.StringReader;

import static org.hamcrest.CoreMatchers.hasItem;
import static org.hamcrest.CoreMatchers.not;
import static org.junit.Assert.*;

/**
 * This test verifies the functionality of creating/deleting solr cores and their configuration
 *
 * @author Sebastian Schaffert (sschaffert@apache.org)
 */
public class SolrCoresTest {

    private static final String CORE_NAME = "schema";
    private static JettyMarmotta lmf;
    private static SolrProgramService solrProgramService;
    private static SolrCoreService solrCoreService;
    private static ConfigurationService configurationService;
    private static LMFSearchFilter searchFilter;

    @BeforeClass
    public static void setUpBeforeClass() throws Exception {
        lmf = new JettyMarmotta("/");
        solrProgramService = lmf.getService(SolrProgramService.class);
        solrCoreService = lmf.getService(SolrCoreService.class);
        configurationService = lmf.getService(ConfigurationService.class);
        searchFilter = lmf.getService(LMFSearchFilter.class);
    }

    @AfterClass
    public static void tearDownAfterClass() throws Exception {
        lmf.shutdown();
    }

    /**
     * With an empty startup, the system should have initialised three cores: rdf, skos and dc.
     * Here, we test for their existance.
     */
    @Test
    public void testEmptyStartup() throws IOException {
        for(String name : new String[] { "rdf", "dc", "skos"}) {
            testCoreExists(name);
        }
    }

    /**
     * This Test builds an dummy search core which contains a field for each of the registered
     * types/transformer in {@link at.newmedialab.lmf.search.services.program.SolrProgramServiceImpl}.
     * This is to check that the schema-template.xml is valid and contains only valid configurations.
     */
    @Test
    public void testCreateCore() throws CoreAlreadyExistsException, IOException {
        // Generate LDPath for all mappings
        StringBuilder sb = new StringBuilder();
        for (String mp: SolrProgramServiceImpl.xsdSolrTypeMap.keySet()) {
            String fName = mp.substring(Math.max(mp.lastIndexOf('/'),mp.lastIndexOf('#'))+1);
            sb.append(String.format("%s = <http://example.com/> :: <%s> ;%n", fName, mp));
        }

        try {
            final String program = sb.toString();
            // This should never fail
            final Program<Value> p = solrProgramService.parseProgram(new StringReader(program));
            assertNotNull(p);

            // Here come the fun
            SolrCoreConfiguration engine = solrCoreService.createSolrCore(CORE_NAME, program);
            assertThat(solrCoreService.listSolrCores(), hasItem(engine));
            assertTrue(solrCoreService.hasSolrCore(CORE_NAME));

            testCoreExists(CORE_NAME);

            solrCoreService.removeSolrCore(engine);
            assertThat(solrCoreService.listSolrCores(), not(hasItem(engine)));

            testCoreNotExists(CORE_NAME);
        } catch (LDPathParseException e) {
            fail("Invalid LDPath program");
        }

    }


    private void testCoreExists(String coreName) throws IOException {
        String solrHomeName = configurationService.getStringConfiguration("solr.home");
        String coreHomeName = solrHomeName + File.separator + coreName;

        File coreHome = new File(coreHomeName);


        // Here come the fun
        SolrCoreConfiguration engine = solrCoreService.getSolrCore(coreName);

        // check for existance of relevant directories
        assertTrue(coreHome.exists());
        assertTrue(coreHome.isDirectory());

        // SOLR configuration directory
        File confDir = new File(coreHome,"conf");
        assertTrue(confDir.exists());

        // schema.xml and solrconfig.xml
        File schemaXml = new File(confDir, "schema.xml");
        File configXml = new File(confDir, "solrconfig.xml");

        assertTrue(schemaXml.exists());
        assertTrue(configXml.exists());

        // test if the schema file contains all the expected field definitions
        String schemaXmlContent = FileUtils.readFileToString(schemaXml);
        for (FieldMapping mapping : engine.getProgram().getFields()) {
            String fName = mapping.getFieldName();
            assertTrue(schemaXmlContent.contains((String.format("field name=\"%s\"", fName))));
        }

        // data directory
        File dataDir = new File(coreHome, "data");
        assertTrue(dataDir.exists());
        assertTrue(dataDir.isDirectory());

        File indexDir = new File(dataDir, "index");
        assertTrue(indexDir.exists());
        assertTrue(indexDir.list().length != 0);

        // test if the core is properly registered
        CoreContainer cores = searchFilter.getCores();
        assertNotNull(cores);
        assertThat(cores.getCoreNames(), hasItem(coreName));
    }


    private void testCoreNotExists(String coreName) {
        // test if the core is properly unregistered
        CoreContainer cores = searchFilter.getCores();

        assertThat(cores.getCoreNames(), not(hasItem(coreName)));

        // test if the core directory has properly been removed
        String solrHomeName = configurationService.getStringConfiguration("solr.home");
        String coreHomeName = solrHomeName + File.separator + coreName;

        File coreHome = new File(coreHomeName);

        assertFalse(coreHome.exists());
    }


    /**
     * Test if changing configuration options in configuration service properly updates the configuration and runtime objects.
     *
     * @throws Exception
     */
    @Test
    public void testCoreConfiguration() throws Exception {

        String programString = IOUtils.toString(this.getClass().getResourceAsStream("books.ldpath"));

        try {
            // This should never fail
            final Program<Value> p = solrProgramService.parseProgram(new StringReader(programString));
            assertNotNull(p);

            // Here come the fun
            SolrCoreConfiguration engine = solrCoreService.createSolrCore(CORE_NAME, programString);

            configurationService.setBooleanConfiguration("solr."+CORE_NAME+".update_dependencies", true);
            assertTrue(engine.isUpdateDependencies());

        } catch (LDPathParseException e) {
            fail("Invalid LDPath program");
        }
    }

}
