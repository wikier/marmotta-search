package at.newmedialab.lmf.search.services.cores;

import at.newmedialab.lmf.worker.model.WorkerConfiguration;
import org.apache.marmotta.commons.sesame.filter.SesameFilter;
import org.apache.marmotta.commons.sesame.filter.resource.UriPrefixFilter;
import org.apache.marmotta.ldpath.model.programs.Program;
import org.apache.marmotta.platform.core.model.filter.MarmottaLocalFilter;
import org.apache.marmotta.platform.ldcache.model.filter.MarmottaNotCachedFilter;
import org.openrdf.model.Resource;
import org.openrdf.model.Value;

import java.util.Iterator;
import java.util.Set;

/**
 * Configuration for a SOLR core.
 *
 * @author Sebastian Schaffert (sschaffert@apache.org)
 */
public class SolrCoreConfiguration extends WorkerConfiguration {


    /**
     * Enable/disable dependency tracking, i.e. storing which other resource updates need to be triggered when a
     * resource is updated
     */
    private boolean                 updateDependencies = false;


    /**
     * Enable/disable clearing completely the index before a rescheduling of the core takes place.
     */
    private boolean                 clearBeforeReschedule = true;

    /**
     * The maximum idle time after which the SOLR core commits
     */
    private long timeout = 10000;

    /**
     * The LDPath program used to configure the core
     */
    private Program<Value>          program;

    /**
     * String representation of the program
     */
    private String programString;


    public SolrCoreConfiguration(String name) {
        super(name);
    }

    public SolrCoreConfiguration(String name, Set<SesameFilter<Resource>> filters) {
        super(name, filters);
    }

    public void setAcceptPrefixes(Set<String> acceptedPrefixes) {
        // remove old prefix filter
        Iterator<SesameFilter<Resource>> it = filters.iterator();
        while(it.hasNext()) {
            if(it.next() instanceof UriPrefixFilter) {
                it.remove();
            }
        }

        // add new uri prefix filter with new accept prefixes
        filters.add(new UriPrefixFilter(acceptedPrefixes));
    }

    @Override
    public String getType() {
        return "SOLR Core ("+getName()+")";
    }



    /**
     * The LDPath program used to configure the core
     */
    public Program<Value> getProgram() {
        return program;
    }

    /**
     * The LDPath program used to configure the core
     */
    public void setProgram(Program<Value> program) {
        this.program = program;
    }


    public String getProgramString() {
        return programString;
    }

    public void setProgramString(String programString) {
        this.programString = programString;
    }


    /**
     * Enable/disable dependency tracking, i.e. storing which other resource updates need to be triggered when a
     * resource is updated
     */
    public boolean isUpdateDependencies() {
        return updateDependencies;
    }

    /**
     * Enable/disable dependency tracking, i.e. storing which other resource updates need to be triggered when a
     * resource is updated
     */
    public void setUpdateDependencies(boolean updateDependencies) {
        this.updateDependencies = updateDependencies;
    }

    /**
     * Enable/disable clearing completely the index before a rescheduling of the core takes place.
     */
    public boolean isClearBeforeReschedule() {
        return clearBeforeReschedule;
    }

    /**
     * Enable/disable clearing completely the index before a rescheduling of the core takes place.
     */
    public void setClearBeforeReschedule(boolean clearBeforeReschedule) {
        this.clearBeforeReschedule = clearBeforeReschedule;
    }

    /**
     * Change the setting of the "local_only" parameter. Calling this method will either add a MarmottaLocalOnlyFilter
     * or remove it, depending on the boolean value passed as argument.
     * @param value
     */
    public void setLocalOnly(boolean value) {
        synchronized (filters) {
            if(value) {
                filters.add(MarmottaLocalFilter.getInstance());
            } else {
                // remove any existing localonly filters
                Iterator<SesameFilter<Resource>> it = filters.iterator();
                while(it.hasNext()) {
                    if(it.next() instanceof MarmottaLocalFilter) {
                        it.remove();
                    }
                }
            }
        }
    }

    /**
     * Change the setting of the "omit_cached" parameter. Calling this method will either add a MarmottaNotCachedFilter
     * or remove it, depending on the boolean value passed as argument.
     * @param value
     */
    public void setOmitCached(boolean value) {
        synchronized (filters) {
            if(value) {
                filters.add(MarmottaNotCachedFilter.getInstance());
            } else {
                // remove any existing localonly filters
                Iterator<SesameFilter<Resource>> it = filters.iterator();
                while(it.hasNext()) {
                    if(it.next() instanceof MarmottaNotCachedFilter) {
                        it.remove();
                    }
                }
            }
        }
    }

}
