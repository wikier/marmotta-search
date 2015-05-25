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

import at.newmedialab.lmf.search.api.cores.SolrCoreService;
import com.google.common.io.ByteStreams;
import com.google.common.io.Files;
import org.apache.commons.io.IOUtils;
import org.apache.marmotta.platform.core.api.config.ConfigurationService;
import org.apache.marmotta.platform.core.api.modules.MarmottaHttpFilter;
import org.apache.marmotta.platform.core.util.CDIContext;
import org.apache.solr.core.CoreContainer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.naming.Reference;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.Charset;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;


/**
 * Add a filter that redirects to the SolrDispatchFilter
 * <p/>
 * User: sschaffe
 */
@ApplicationScoped
public class LMFSearchFilter implements MarmottaHttpFilter {

    private Logger               log       = LoggerFactory.getLogger(LMFSearchFilter.class);

    private Logger               searchLog = LoggerFactory.getLogger("search");

    @Inject
    private ConfigurationService configurationService;

    private LMFSolrDispatchFilter   solrDispatchFilter;

    /**
     * Return the pattern (regular expression) that a request URI (relative to the LMF base URI) has
     * to match
     * before triggering this filter.
     * 
     * @return
     */
    @Override
    public String getPattern() {
        return "^/solr/.*";
    }


    /**
     * Return the priority of the filter. Filters that need to be executed before anything else should return
     * PRIO_FIRST, filters that need to be executed last in the chain should return PRIO_LAST, all other filters
     * something inbetween (e.g. PRIO_MIDDLE).
     *
     * @return
     */
    @Override
    public int getPriority() {
        return PRIO_MIDDLE;
    }


    /**
     * Return the core container used by the SOLR dispatch filter. Returns null if the dispatch filter has not
     * yet been initialised.
     *
     * @return
     */
    public CoreContainer getCores() {
        if(solrDispatchFilter != null) return solrDispatchFilter.getCores();
        else
            return null;
    }


    @Override
    public void init(final FilterConfig filterConfig) throws ServletException {
        log.info("initialising SOLR filter for URL pattern {}", getPattern());

        initSolrJNDI();
        initSolrConfiguration();

        solrDispatchFilter = new LMFSolrDispatchFilter();

        final Map<String, String> params = new HashMap<String, String>();
        params.put("path-prefix", "/solr");

        FilterConfig solrFilterConfig = new FilterConfig() {
            @Override
            public String getFilterName() {
                return "SolrRequestFilter";
            }

            @Override
            public ServletContext getServletContext() {
                return filterConfig.getServletContext();
            }

            @Override
            public String getInitParameter(String name) {
                return params.get(name);
            }

            @Override
            public Enumeration<String> getInitParameterNames() {
                return Collections.enumeration(params.keySet());
            }
        };
        solrDispatchFilter.init(solrFilterConfig);

    }

    /**
     * Register the SolrHomeFactory in the JNDI context (requires a writable JNDI directory as provided by Apache Marmotta)
     */
    private void initSolrJNDI() {
        try {
            Context ctx_env = (Context)new InitialContext().lookup("java:comp/env");
            Context ctx_solr = ctx_env.createSubcontext("solr");
            ctx_solr.bind("home", new Reference("java.lang.String", "at.newmedialab.lmf.search.filters.SolrHomeFactory", null));
        } catch (NamingException e) {
            log.error("naming error while registering SOLR home",e);

            // TODO: throw an exception to stop the startup process
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        // ensure that the solr cores are initialised when a request to any /solr resource is made
        if (!configurationService.getRuntimeFlag("solr.initialized")) {
            // initialise core service
            SolrCoreService coreService = CDIContext.getInstance(SolrCoreService.class);

        }

        if (servletResponse instanceof HttpServletResponse) {
            HttpServletRequest req = (HttpServletRequest) request;
            HttpServletResponse resp = (HttpServletResponse) servletResponse;
            // Handle OPTIONS-Requests accordingly
            if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
                resp.resetBuffer();
                resp.setStatus(200);

                if (!resp.containsHeader("Access-Control-Allow-Origin")) {
                    resp.setHeader("Access-Control-Allow-Origin", configurationService.getStringConfiguration("kiwi.allow_origin", "*"));
                }
                if (!resp.containsHeader("Access-Control-Allow-Methods")) {
                    for (String method : "GET, POST".split(",")) {
                        resp.addHeader("Access-Control-Allow-Methods", method);
                    }
                }
                if (req.getHeader("Access-Control-Request-Headers") != null) {
                    String header = req.getHeader("Access-Control-Request-Headers");
                    String[] values = header.split(",");
                    for (String value : values) {
                        resp.addHeader("Access-Control-Allow-Headers", value.trim());
                    }
                }

                return;
            }
            else if ( req.getHeader("Origin") != null ) {
                if (!resp.containsHeader("Access-Control-Allow-Origin")) {
                    resp.setHeader("Access-Control-Allow-Origin", configurationService.getStringConfiguration("kiwi.allow_origin", "*"));
                }
            }
        }

        final long searchStart = System.nanoTime();
        solrDispatchFilter.doFilter(request, servletResponse, filterChain);
        logSearch(request, System.nanoTime() - searchStart);
    }

    protected void logSearch(ServletRequest request, long durationInNanos) throws MalformedURLException, UnsupportedEncodingException {
        if(searchLog.isDebugEnabled() || searchLog.isInfoEnabled()) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            URL url = new URL(httpRequest.getRequestURL().toString());
            String prefix = httpRequest.getContextPath();
            String path = null;
            if(url.getPath().startsWith(prefix)) {
                path = url.getPath().substring(prefix.length());

                String[] components = path.split("/");

                if (components[components.length-1].equals("select")) {
                    String remoteHost = httpRequest.getRemoteAddr();
                    String coreName   = components[components.length-2];
                    String query      = httpRequest.getParameter("q") != null ? URLDecoder.decode(httpRequest.getParameter("q"),"utf-8") : "";
                    // dateboosted querys have the query-term in parameter qq
                    if (query.contains("$qq")) {
                        query = httpRequest.getParameter("q") != null ? URLDecoder.decode(httpRequest.getParameter("qq"), "utf-8") : "";
                    }
                    // the fq-param might occur multiple times
                    final String[] facets = httpRequest.getParameterValues("fq") != null ? httpRequest.getParameterValues("fq") : new String[0];
                    for (int i = 0; i < facets.length; i++) {
                        facets[i] = "'" + URLDecoder.decode(facets[i], "utf-8") + "'";
                    }
                    String session = httpRequest.getParameter("sid") != null ? URLDecoder.decode(httpRequest.getParameter("sid"), "utf-8") : "";

                    if (searchLog.isInfoEnabled()) {
                        searchLog.info("CLIENT={} CORE={} QUERY='{}' FACETS={} SESSION={} MS={}", new Object[] { remoteHost, coreName, query,
                                facets,
                                session, durationInNanos / 1000000d });
                    }
                }
                if (searchLog.isDebugEnabled()) {
                    searchLog.debug("{} {}", path, httpRequest.getQueryString());
                }
            }
        }
    }

    @Override
    public void destroy() {
        solrDispatchFilter.destroy();
    }

    /**
     * Copied from {@link org.apache.marmotta.platform.core.services.config.ConfigurationServiceImpl}
     */
    private void initSolrConfiguration() {

        String solrHome = null;
        if (configurationService.isConfigurationSet("solr.home")) {
            // in this way the solr can use relative and absolute
            // path.
            final File solrHomeConf = new File(configurationService.getStringConfiguration("solr.home"));
            final File realPath;
            if (solrHomeConf.isAbsolute()) {
                realPath = solrHomeConf;
            } else {
                realPath = new File(System.getProperty("user.dir"), solrHomeConf.getPath());
            }
            solrHome = realPath.getAbsolutePath();
            //System.setProperty("solr.solr.home", realPath.getAbsolutePath());
        } else {
            solrHome = new File(configurationService.getHome(), "solr").getAbsolutePath();
            //System.setProperty("solr.solr.home", configurationService.getWorkDir() + "/solr");
        }

        //System.setProperty("solr.data.dir", System.getProperty("solr.solr.home") + "/data");
        configurationService.setConfiguration("solr.home",solrHome);

        // check whether the directory already exists and which configuration version it is

        try {
            //final String solrHome = System.getProperty("solr.solr.home");
            final File f_solrHome = new File(solrHome);
            if (f_solrHome.exists() && f_solrHome.isDirectory()) {
                // check readability and version
                if (!(f_solrHome.canRead() && f_solrHome.canWrite())) {
                    log.warn("SOLR home is not readable/writeable; please check the permissions in the file system");
                }
                File f_version = new File(f_solrHome, "VERSION");

                if (f_version.exists() && f_version.canRead()) {
                    String version = Files.toString(f_version, Charset.defaultCharset());

                    if (!version.equals(configurationService.getStringConfiguration("kiwi.version"))) {
                        // update required
                        unpackSolrHome(f_solrHome);
                    }

                    log.info("SOLR home directory exists and has the right version; no update required");
                } else {
                    // no version file, update required
                    unpackSolrHome(f_solrHome);
                }

            } else {
                // SOLR home does not exist, so we create it
                if (f_solrHome.mkdirs()) {
                    unpackSolrHome(f_solrHome);
                } else {
                    log.error("could not create SOLR home directory; SOLR will not work properly");
                }
            }
        } catch (IOException e) {
            log.error("error while trying to setup SOLR home directory: {}", e.getMessage());
        }

    }

    /**
     * This method takes as argument a File representing the SOLR home directory and unpacks the
     * kiwi-solr-data zip
     * file that is contained in the kiwi-core.jar file into this directory. It also creates the
     * version information
     * file to determine the KiWi version used for setting up the KiWi home directory.
     * 
     * TODO: the method should afterwards trigger a reindexing of the SOLR index
     * 
     * @param directory
     * @throws IOException
     */
    private void unpackSolrHome(File directory) throws IOException {
        String version = configurationService.getStringConfiguration("kiwi.version");

        InputStream zip_is = LMFSearchFilter.class.getResourceAsStream("/lmf-solr-data.zip");

        if (zip_is  != null) {
            File tmp_zip = File.createTempFile("lmf-solr-data", ".zip");

            IOUtils.copy(zip_is, new FileOutputStream(tmp_zip));

            ZipFile zipFile = new ZipFile(tmp_zip);

            Enumeration<? extends ZipEntry> entries = zipFile.entries();

            while (entries.hasMoreElements()) {
                ZipEntry entry = entries.nextElement();

                if (entry.isDirectory()) {
                    log.info("creating SOLR directory: {}", entry.getName());
                    // This is not robust, just for demonstration purposes.

                    File dir = new File(directory, entry.getName());

                    dir.mkdirs();

                    continue;
                }

                log.info("extracting SOLR configuration file: {}", entry.getName());

                File file = new File(directory, entry.getName());
                ByteStreams.copy(zipFile.getInputStream(entry), new FileOutputStream(file));

            }

            zipFile.close();
            tmp_zip.delete();

            Files.write(version, new File(directory, "VERSION"), Charset.defaultCharset());
        } else {
            log.error("could not find SOLR directory structure (lmf-solr-data.zip) in classpath; SOLR will not work properly");
        }
    }

}
