package at.newmedialab.lmf.search;

import at.newmedialab.lmf.search.api.cores.SolrCoreService;
import at.newmedialab.lmf.search.api.program.SolrProgramService;
import at.newmedialab.lmf.search.exception.CoreAlreadyExistsException;
import at.newmedialab.lmf.search.services.cores.SolrCoreConfiguration;
import at.newmedialab.lmf.search.services.program.SolrProgramServiceImpl;
import org.apache.marmotta.ldpath.exception.LDPathParseException;
import org.apache.marmotta.ldpath.model.programs.Program;
import org.apache.marmotta.platform.core.test.base.JettyMarmotta;
import org.hamcrest.CoreMatchers;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openrdf.model.Value;

import java.io.StringReader;

import static org.junit.Assert.*;

public class SolrTemplatesTest {

    private static final String CORE_NAME = "schema";
    private static JettyMarmotta lmf;
    private static SolrProgramService solrProgramService;
    private static SolrCoreService solrCoreService;
    
    @BeforeClass
    public static void setUpBeforeClass() throws Exception {
        lmf = new JettyMarmotta("/");
        solrProgramService = lmf.getService(SolrProgramService.class);
        solrCoreService = lmf.getService(SolrCoreService.class);
    }

    @AfterClass
    public static void tearDownAfterClass() throws Exception {
        lmf.shutdown();
    }

    /**
     * This Test builds an dummy search core which contains a field for each of the registered
     * types/transformer in {@link SolrProgramServiceImpl}.
     * This is to check that the schema-template.xml is valid and contains only valid configurations.
     */
    @Test
    public void testSchemaTemplate() throws CoreAlreadyExistsException {
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
            assertThat(solrCoreService.listSolrCores(), CoreMatchers.hasItem(engine));
            solrCoreService.removeSolrCore(engine);
            assertThat(solrCoreService.listSolrCores(), CoreMatchers.not(CoreMatchers.hasItem(engine)));
        } catch (LDPathParseException e) {
            fail("Invalid LDPath program");
        }
        
    }
    
    @Test
    public void testSolrconfigTemplate() {
        // nothing to do here
    }

}
