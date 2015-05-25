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
package at.newmedialab.lmf.search.api.program;


import org.apache.marmotta.ldpath.exception.LDPathParseException;
import org.apache.marmotta.ldpath.model.programs.Program;
import org.apache.marmotta.platform.core.exception.MarmottaException;
import org.openrdf.model.Value;

import java.io.InputStream;
import java.io.Reader;

/**
 * This service manages the LMF SOLR programs currently used when indexing the content.
 * <p/>
 * User: sschaffe
 */
public interface SolrProgramService {

	/**
	 * loads programs and languages
	 */
	public void initialize() throws LDPathParseException;


	public Program<Value> parseProgram(InputStream program) throws LDPathParseException;
	public Program<Value> parseProgram(Reader program) throws LDPathParseException;


	/**
	 * Return the SOLR field type for the XSD type passed as argument. The xsdType needs to
	 * be a fully qualified URI. If no field type is defined, will return null.
	 *
	 * @param xsdType a URI identifying the XML Schema datatype
	 * @return
	 */
	public String getSolrFieldType(String xsdType) throws MarmottaException;



}
