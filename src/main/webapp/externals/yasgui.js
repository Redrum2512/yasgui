var corsEnabled = {};
var proxy;
var sparqlHighlightHeight = {};
var sparqlHighlight = {};
var sparqlResponseHighlight = {};
var prefixes;
var queryRequest;

/*
 * CORS ajax calls and firefox are not a good match: firefox is buggy in this respect.
 * Use patch below to be able to get the content type
 * http://bugs.jquery.com/ticket/10338
 */
var _super = $.ajaxSettings.xhr;
$
		.ajaxSetup({
			xhr : function() {
				var xhr = _super();
				var getAllResponseHeaders = xhr.getAllResponseHeaders;

				xhr.getAllResponseHeaders = function() {
					var allHeaders = getAllResponseHeaders.call(xhr);
					if (allHeaders) {
						return allHeaders;
					}
					allHeaders = "";
					$(
							[ "Cache-Control", "Content-Language",
									"Content-Type", "Expires", "Last-Modified",
									"Pragma" ])
							.each(
									function(i, header_name) {
										if (xhr.getResponseHeader(header_name)) {
											allHeaders += header_name
													+ ": "
													+ xhr
															.getResponseHeader(header_name)
													+ "\n";
										}
									});
					return allHeaders;
				};
				return xhr;
			}
		});
function sparqlQueryJson(tabId, queryStr, endpoint, acceptHeader,
		argsJsonString, requestMethod, callback) {
	var ajaxData = {
		query : queryStr,
	};
	var uri;
	onQueryStart();
	if (corsEnabled[endpoint]) {
		uri = endpoint;
	} else {
		//query via proxy
		ajaxData['endpoint'] = endpoint;
		ajaxData['requestMethod'] = requestMethod;
		requestMethod = "POST"; //we stil want to use POST to access the servlet itself
		uri = proxy;
	}
	args = jQuery.parseJSON(argsJsonString);
	if (args != null) {
		for ( var key in args) {
			if (args.hasOwnProperty(key)) {
				ajaxData[key] = args[key];
			}
		}
	}
	queryRequest = $
			.ajax({
				url : uri,
				type : requestMethod,
				headers : {
					Accept : acceptHeader
				},
				dataType : 'text',//get as text, let gwt parse it to gwt json object. Want to retrieve json though, so use header setting above
				data : ajaxData,
				beforeSend : function(xhr) {
					//nothing
				},
				success : function(data, textStatus, jqXHR) {
					onQueryFinish();
					callback(tabId, data, jqXHR
							.getResponseHeader('Content-Type'));
				},
				error : function(jqXHR, textStatus, errorThrown) {
					if (textStatus != "abort") {
						//if user cancels query, textStatus will be 'abort'. No need to show error window than
						onQueryFinish();
						clearQueryResult();
						var errorMsg;
						if (jqXHR.status == 0 && errorThrown.length == 0) {
							errorMsg = "Error querying endpoint: empty response returned";
						} else {
							errorMsg = "Error querying endpoint: "
									+ jqXHR.status + " - " + errorThrown;
						}
						onQueryError(errorMsg);
					}
				},
			});
};

/**
 * Perform check to see if endpoint is cors enabled. Use this to decide where to send a query: via the proxy or directly
 * 
 * @param endpoint
 */
function checkCorsEnabled(endpoint) {
	//Only perform check if it hasnt been done already
	if (corsEnabled[endpoint] == null) {
		//Start off assuming it is not cors enabled
		$.ajax({
			url : endpoint,
			method : 'get',
			complete : function(xhr) {
				if (xhr.status != 0) { // CORS-enabled site
					corsEnabled[endpoint] = true;
				} else {
					corsEnabled[endpoint] = false;
				}
			}
		});
	}
}
$(document).keydown(function(e) {
	var code = (e.keyCode ? e.keyCode : e.which);
	if (code == 27) {//escape key
		cancelQuery();
	}

});
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
function getNextNonWsToken(cm, lineNumber, charNumber) {
	if (charNumber == undefined) charNumber = 1;
	token = cm.getTokenAt({line : lineNumber,ch : charNumber});
	if (token == null || token == undefined) {
		return null;
	}
	if (token.className == "sp-ws") {
		return getNextNonWsToken(cm, lineNumber, token.end+1);
	}
	return token;
}

/**
 * Check whether typed prefix is declared. If not, automatically add declaration using list from prefix.cc
 * @param cm
 */
function appendPrefixIfNeeded(cm) {
	var cur = cm.getCursor();
	var token = cm.getTokenAt(cur);
	if (token.className == "sp-prefixed" && endsWith(token.string, ":") && cur.ch == token.end) {
		//check previous token isnt PREFIX
		var firstToken = getNextNonWsToken(cm, cur.line);
		if (firstToken.string != "PREFIX") {
			//check whether it isnt defined already (saves us from looping through the array)
			var currentPrefix = token.string;
			var queryPrefixes = getPrefixesFromQuery(cm);
			if ($.inArray(currentPrefix, queryPrefixes) == -1) {
				for (var i = 0; i < prefixes.length; i++) {
					var prefix = prefixes[i].substring(0, currentPrefix.length);
					if (prefix == currentPrefix) {
						appendToPrefixes(cm, prefixes[i]);
						break;
					}
				}
			}
		}

	}
}


/**
 * Get defined prefixes from query as array, in format ["rdf:", "rdfs:"]
 * @param cm
 * @returns {Array}
 */
function getPrefixesFromQuery(cm) {
	var queryPrefixes = [];
	var numLines = cm.lineCount();
	for (var i = 0; i < numLines; i++) {
		var firstToken = getNextNonWsToken(cm, i);
		if (firstToken.string == "PREFIX") {
			var prefix = getNextNonWsToken(cm, i, firstToken.end + 1);
			if (prefix.string != ":") {
				queryPrefixes.push(prefix.string);
			}
		}
	}
	return queryPrefixes;
}

/**
 * Append prefix declaration to list of prefixes in query window.
 * @param cm
 * @param prefix
 */
function appendToPrefixes(cm, prefix) {
	var lastPrefix = null;
	var lastPrefixLine = 0;
	var numLines = cm.lineCount();
	for (var i = 0; i < numLines; i++) {
		var firstToken = getNextNonWsToken(cm, i);
		if (firstToken.string == "PREFIX" || firstToken.string == "BASE") {
			lastPrefix = firstToken;
			lastPrefixLine = i;
		}
	}
	if (lastPrefix == null) {
		cm.replaceRange("PREFIX " + prefix, {line: 0});
	} else {
		var previousIndent = getIndentFromLine(cm, lastPrefixLine);
		cm.replaceRange("\n" + previousIndent + "PREFIX " + prefix, {line: lastPrefixLine});
	}
	
}

/**
 * Get the used indentation for a certain line
 * @param cm
 * @param line
 * @param charNumber
 * @returns
 */
function getIndentFromLine(cm, line, charNumber) {
	if (charNumber == undefined) charNumber = 1;
	var token = cm.getTokenAt({line : line,ch : charNumber});
	if (token == null || token == undefined || token.className != "sp-ws") {
		return "";
	} else {
		return token.string + getIndentFromLine(cm, line, token.end+1);
	}
}
