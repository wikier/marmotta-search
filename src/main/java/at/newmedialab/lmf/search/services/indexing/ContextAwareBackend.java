package at.newmedialab.lmf.search.services.indexing;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.apache.marmotta.ldpath.backend.sesame.SesameConnectionBackend;
import org.openrdf.model.Resource;
import org.openrdf.model.Statement;
import org.openrdf.model.URI;
import org.openrdf.model.Value;
import org.openrdf.model.ValueFactory;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.RepositoryResult;

/**
 * 
 * @author Jakob Frank <jakob.frank@salzburgresearch.at>
 * @deprecated will be replaced by {@link org.apache.marmotta.ldpath.backend.sesame.SesameConnectionBackend} in Marmotta 3.2.0.
 */
@Deprecated
public class ContextAwareBackend extends SesameConnectionBackend {

    private final URI[] contexts;

    public ContextAwareBackend(RepositoryConnection connection, URI... contexts) {
        super(connection);
        this.contexts = contexts;
    }
    
    public ContextAwareBackend(RepositoryConnection connection, Value... contexts) {
        this(connection, toURI(connection.getValueFactory(), contexts));
    }

    public ContextAwareBackend(RepositoryConnection connection, Set<Value> graphs) {
        this(connection, toURI(connection.getValueFactory(), graphs));
    }

    private final static URI[] toURI(ValueFactory valueFactory, Set<Value> graphs) {
        final ArrayList<URI> uris = new ArrayList<>();
        for (Value value: graphs) {
        if (value instanceof URI) {
                uris.add((URI) value);
            } else {
                uris.add(valueFactory.createURI(value.stringValue())); 
            }
        }
        return uris.toArray(new URI[uris.size()]);
    }

    private final static URI[] toURI(ValueFactory valueFactory, Value[] values) {
        final URI[] uris = new URI[values.length];
        for (int i = 0; i < values.length; i++) {
            if (values[i] instanceof URI) {
                uris[i] = (URI) values[i];
            } else {
                uris[i] = valueFactory.createURI(values[i].stringValue()); 
            }
        }
        return uris;
    }

    @Override
    protected Collection<Value> listObjectsInternal(
            RepositoryConnection connection, Resource subject, URI property)
            throws RepositoryException {
        final ValueFactory valueFactory = connection.getValueFactory();
        
        final Set<Value> result = new HashSet<Value>();
        RepositoryResult<Statement> qResult = connection.getStatements(merge(subject, valueFactory), merge(property, valueFactory), null, true, contexts);
        try {
        	while(qResult.hasNext()) {
        		result.add(qResult.next().getObject());
        	}
        } finally {
        	qResult.close();
        }
        return  result;
    }
    
    @Override
    protected Collection<Value> listSubjectsInternal(
            RepositoryConnection connection, URI property, Value object)
            throws RepositoryException {
        final ValueFactory valueFactory = connection.getValueFactory();
        
        final Set<Value> result = new HashSet<Value>();
        RepositoryResult<Statement> qResult = connection.getStatements(null, merge(property, valueFactory), merge(object, valueFactory), true, contexts);
        try {
        	while(qResult.hasNext()) {
        		result.add(qResult.next().getSubject());
        	}
        } finally {
        	qResult.close();
        }
        return  result;
    }
    
}
