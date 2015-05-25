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

import org.apache.solr.core.CoreContainer;
import org.apache.solr.servlet.SolrDispatchFilter;

/**
 * A custom subclass of the SolrDispatchFilter to access the core container defined in the filter, so we
 * can get direct access to the SOLR cores instead of requiring HTTP access.
 * <p/>
 * Author: Sebastian Schaffert
 */
public class LMFSolrDispatchFilter extends SolrDispatchFilter {

    public LMFSolrDispatchFilter() {
        super();
    }

    /**
     * Return the initialised core container of this dispatch filter.
     * @return
     */
    public CoreContainer getCores() {
        return cores;
    }
}
