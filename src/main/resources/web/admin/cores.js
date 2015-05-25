/*
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
/* CORE MANAGEMENT */
var cService = _SERVER_URL + 'solr/cores/';
$(function() {
    var editor = null;
	var chooser = $('select#coreChooser');
	var coreContainer = $("div#coreDisplay").hide();
	
	var statusTimeout;
	function tell(msg, css, autohide) {
		var status = $(".status", coreContainer);
		clearTimeout(statusTimeout);
		if (msg && msg !== '') {
			status.removeClass('ok error warning loading');
			status.text(msg);
			if (css) status.addClass(css);
			if (autohide > 0) statusTimeout = setTimeout(function() {tell();}, autohide);
			status.fadeIn();
		} else {
			status.fadeOut(function() {
				status.text('');
				status.removeClass('ok error warning loading');
			});
		}
	}
	
	function loadCoreNames() {
		$('#chooserStatus').addClass('loading').text('Loading...').show();
		var current = $(":selected", chooser).val();
		if (current == '') current = $(".cName", coreContainer).text();
		chooser.empty().append($('<option />').text('--').val(''));
		$.getJSON(cService, function(data) {
			for (i in data) {
				chooser.append($('<option />').val(data[i]).text(data[i]));
			}
			$('option[value="' + current + '"]', chooser).attr('selected', 'true');
			$('#chooserStatus').fadeOut(function() {
				$(this).removeClass('loading').text('');
			});
		});
	}
	function loadCore(core) {
		var head = $(".cName", coreContainer);
		var body = $(".cProgram", coreContainer);
		if (core !== "") {
			head.text(core).removeAttr("contenteditable");
			tell("Loading...", 'loading');
			$.get(cService + encodeURI(core), function(data) {
			    if (coreContainer.hasClass("editor_cm"))
			        createCodeMirror(data);
			    else
			        body.val(data);
			    tell("Loaded", 'ok', 2000);
			});
			$(".deleteBtn", coreContainer).removeAttr('disabled');
			coreContainer.slideDown();
		} else {
			coreContainer.slideUp();
		}
		if (editor) editor.refresh();
	}
	function checkCoreNameExists(name, handler) {
		$.getJSON(cService, function(coreList) {
			var exists = false;
			for (var i in coreList) {
				if (coreList[i] === name) {
					exists = true;
				}
			}
			if (handler) handler(exists);
		}).error(function(xhr) {
			if (handler) handler();
		});

	}
	function checkProgram(program, handler) {
		$.ajax(cService, {
			type: 'POST',
			data: program,
			contentType: "text/plain",
			success: function(data) {
				if (handler) handler(true, data)
			},
			error: function(xhr) {
				if (handler) handler(false, xhr.responseText);
			}
		});
	}
	function saveCore(method) {
	    if (editor) editor.save();
		method = method || 'PUT';
		tell("Saving core...", 'loading');
		var name = $(".cName",coreContainer).text();
		var program = $(".cProgram", coreContainer).val();
		checkProgram(program, function(valid, msg) {
			if (valid) {
				$.ajax(cService + encodeURI(name), {
					type: method,
					data: program,
					contentType: "text/plain",
					dataType: "text",
					success: function(data) {
						tell("Core saved", 'ok', 5000);
						$(".cName",coreContainer).removeAttr('contenteditable');
						$(".deleteBtn",coreContainer).removeAttr('disabled');
						loadCoreNames();
					},
					error: function(xhr) {
						tell("Failed: " + xhr.responseText, 'error');
					}
				});
			} else {
				tell("Syntax Error in Core Program: " + msg, 'error');
			}
		});
	}
	function createCore() {
	    if (editor) editor.save();
		tell("Sending new core...", 'loading');
		var name = $(".cName",coreContainer).text().trim();
		var program = $(".cProgram", coreContainer).val();
		// Check for valid name
		if (name == '') {
			tell("Core name required", 'error', 10000);
			return false;
		}
		checkCoreNameExists(name, function(exists){
			if (exists === false) {
				saveCore('POST');
			} else if (exists === true){
				tell('Core already exists', 'error', 10000);
			} else {
				tell('Could not check core name', 'error', 10000);
			}
		});
	}
	function debugCore(debugBtn) {
		var container;
		if (debugBtn) container = $(debugBtn).closest(".coreDebug");
		else container = $(".coreDebug");
		if (editor) editor.save();
		var program = $(".cProgram", coreContainer).val();
		
		var params = [];
		$("input[name=contextURI]", container).each(function() {
			var uri = $(this).val();
			$(this).closest(".coreDebug").attr('uri', uri);
			params.push(encodeURIComponent(uri));
		});
		$(".debugMsg", container).removeClass('ok error').addClass('loading').text('debugging program...');
		
		$.ajax(cService + "debug?context=" + params.join("&context="), {
			type: 'POST',
			data: program,
			contentType: "text/plain",
			success: function(data) {
				var tbl = $("table.debugResult tbody", container).empty();
				var boost = $(".docBoost", container).empty();
				var msg = $(".debugMsg", container).removeClass('loading').addClass('error').text("Not found");
				$(".coreDebug[uri]").each(function() {
					var c = $(this);
					var res = c.attr('uri');
					
					var msg = $(".debugMsg", c);
					var b = $(".docBoost", c);
					var t = $("table.debugResult tbody", c);
					
					var result = data[res];
					if (typeof result == 'string') {
						msg.removeClass('error').addClass(result.search('404')==0?'error':'ok').text(result);
					} else {
						for (var key in result) {
							if (key == '@boost') {
								b.text(result['@boost']);
							} else {
								var row = $("<tr>");
								var k = $("<td>").text(key).appendTo(row);
								var v = $("<td>").appendTo(row);
								if ($.isArray(result[key])) {
									for (var i in result[key]) {
										v.append($('<div class="fieldValue">').text(result[key][i]));
									}
								} else {
									v.text(result[key]);
								} 
								
								t.append(row);
							}
						}
						msg.removeClass('error').text('');
					}
				});
			},
			error: function(xhr) {
				$(".debugMsg", container).removeClass('loading').addClass('error').text(xhr.status + ': ' + xhr.statusText);
			}
		});
	}
	chooser.change(function() {
		var opt = $(':selected', $(this));
		var core = opt.val();
		loadCore(core);
	});
	
	$("#newCore").click(function() {
		$(".cName", coreContainer).text('Core Name').attr("contenteditable","true");
        if (coreContainer.hasClass("editor_cm"))
            createCodeMirror('');
        else
            $(".cProgram", coreContainer).val('');
		$(".deleteBtn", coreContainer).attr('disabled', 'disabled');
		$("option", chooser).first().attr('selected', 'true');
		tell();
		coreContainer.slideDown(function() {if (editor) editor.refresh()});
		return false;
	});
	$(".saveBtn", coreContainer).click(function() {
	    if (editor) editor.save();
	    if ($(".cName", coreContainer).is("[contenteditable=true]")) {
			// Name was editable, this is a new core!
			createCore();
		} else {
			saveCore();
		}
		return false;
	});
	$(".checkBtn", coreContainer).click(function() {
	    if (editor) editor.save();
		var name = $(".cName",coreContainer).text().trim();
		var program = $(".cProgram", coreContainer).val();
		function checkProgramHandler(valid, msg) {
			if (valid) {
				tell("Core seems to be valid!", 'ok', 10000);
			} else {
				tell("Syntax error: " + msg, 'error');
			}
		}
		tell("Checking program...", 'loading');
		if ($(".cName", coreContainer).is("[contenteditable=true]")) {
			// Name was editable, so check the name!
			if (name == '') {
				tell("Core name required", 'error', 10000);
				return false;
			}
			checkCoreNameExists(name, function(exists) {
				if (exists === false) {
					checkProgram(program, checkProgramHandler);
				} else if (exists === true){
					tell('Core already exists', 'error', 10000);
				} else {
					tell('Could not check core name', 'error', 10000);
				}
			});
		} else {
			checkProgram(program, checkProgramHandler);
		}
		return false;
	});
	$(".deleteBtn", coreContainer).click(function() {
	    if (editor) editor.save();
		var name = $(".cName", coreContainer).text().trim();
		$.ajax(cService + encodeURI(name), {
			type: 'DELETE',
			success: function(data) {
				tell("Core deleted", 'ok', 5000);
				loadCoreNames();
				$(".cName",coreContainer).attr('contenteditable', 'true');
			},
			error: function(xhr) {
				tell("Failed: " + xhr.responseText, 'error');
			}
		});
		return false;
	});
	$(".debugBtn", coreContainer).live('click', function() {
		debugCore($(this));
		return false;
	});
	$("button.addDebugEntry", coreContainer).click(function() {
		var nDbg = $(".coreDebug", coreContainer).first().clone().hide();
		$("input", nDbg).val('');
		$(".debugMsg", nDbg).removeClass('ok error loading').text('');
		$(".docBoost", nDbg).empty();
		$("table.debugResult tbody", nDbg).empty();
		nDbg.removeAttr('uri').insertAfter($(".coreDebug", coreContainer).last()).slideDown();
	});
	$("button.debugAll", coreContainer).click(function() {
		debugCore();
		return false;
	});
	
	function createCodeMirror(content) {
        if (editor) {
            removeCodeMirror();
        }
        var textarea = document.getElementById("ldpath");
        if (content !== undefined) {
            textarea.value = content;
        }
        coreContainer.removeClass("editor_plain").addClass("editor_cm");
        var defaultNamespaces = {}
        $.getJSON(_SERVER_URL + "ldpath/util/namespaces", function(data) {
            defaultNamespaces = data;
        }).complete(function() {
          editor = CodeMirror.fromTextArea(textarea, {
              lineNumbers : true,
              matchBrackets : true,
              extraKeys: {"Ctrl-Space": "ldpathAutocomplete"},
              mode : {
                name: "ldpath",
                baseURL: _SERVER_URL,
                namespaces: defaultNamespaces
              }
          });
        });
	}
	function removeCodeMirror() {
	    coreContainer.removeClass("editor_cm").addClass("editor_plain");
        if (editor) {
            editor.toTextArea();
            editor = null;
        }
	}
	$(".chooseEditor .editor_cm").click(function() {createCodeMirror(); return false; });
    $(".chooseEditor .editor_plain").click(function() {removeCodeMirror(); return false; });
    createCodeMirror();
	loadCoreNames();
});
