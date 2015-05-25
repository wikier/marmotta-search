package at.newmedialab.lmf.search.exception;

/**
 * Add file description here!
 *
 * @author Sebastian Schaffert (sschaffert@apache.org)
 */
public class CoreAlreadyExistsException extends Exception {

    public CoreAlreadyExistsException() {
    }

    public CoreAlreadyExistsException(String message) {
        super(message);
    }

    public CoreAlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }

    public CoreAlreadyExistsException(Throwable cause) {
        super(cause);
    }
}
