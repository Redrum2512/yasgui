(function(){
	this.Yasgui = this.Yasgui || {};
	//keep track, so we are able to cancel queries
	var executedQueries = {};
	var Sparql = function() {
		var corsEnabled = {};
		var checkCorsEnabled = function(endpoint) {
			//Only perform check if it hasnt been done already
			if (corsEnabled[endpoint] == null) {
				$.ajax({
					url : endpoint,
					data: {query: "ASK {?sub ?pred ?obj}"},
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
		};
		
		var acceptHeaders = {
			select: [
				{
					header: "application/sparql-results+json",
					extension: "json",
					name: "JSON",
				},
				{
					header: "application/sparql-results+xml",
					extension: "xml",
					name: "XML"
				},
				{
					header: "text/csv",
					extension: "csv",
					name: "CSV"
				},
				{
					header: "text/tab-separated-values",
					extension: ".tsv",
					name: "TSV"
				},
			],
			graph: [
				{
					header: "text/turtle",
					extension: "ttl",
					name: "Turtle"
				},
				{
					header: "application/rdf+xml",
					extension: "xml",
					name: "RDF/XML"
				},
				{
					header: "text/csv",
					extension: "csv",
					name: "CSV"
				},
				{
					header: "text/tab-separated-values",
					extension: "tsv",
					name: "TSV"
				}
				
			]
	
		};
		var getAcceptHeader = function(tabSettings) {
			var qType = Yasgui.tabs[tabSettings.id].cm.getQueryType();
			var acceptHeader;
			if (qType == "CONSTRUCT" || qType == "DESCRIBE") {
				//Change content type automatically for construct queries
				acceptHeader = tabSettings.contentTypeGraph;
			} else {
				acceptHeader = tabSettings.contentTypeSelect;
			}
			return acceptHeader + ",*/*;q=0.9";
		};
		
		
		var query = function(tabSettings) {
			Yasgui.tabs.getCurrentTab().cm.storeInSettings();
			if (tabSettings == undefined) {
				tabSettings = Yasgui.settings.getSelectedTab();
			}
			executionId = Math.random();
			executedQueries[executionId] = true;
			Session.set("queryStatus", "busy");
			Yasgui.tabs[tabSettings.id].results.clearResults();
			var method = tabSettings.requestMethod;
			var endpoint = tabSettings.endpoint;
			
			
			var options = {
					
					headers: {
						Accept: getAcceptHeader(tabSettings)
					}
				};
			var args = [{ name: "query", value: tabSettings.query }];
			var argsString = $.param(args);
			if (method == "GET") {
				options.query = argsString;
			} else {
				options.content = argsString;
				options.headers['Content-Type'] = "application/x-www-form-urlencoded";
			}
			
			var callback = function(error, result) {
				console.log(executedQueries);
				if (executionId in executedQueries) {
					deleteKey(executedQueries, executionId);
					if (error) {
						console.log("error1");
						console.log(error);
						Yasgui.errors.draw(getHtmlAsText(error.message));
					} else if (result.error) {
						console.log("result error");
						console.log(result.message);
						
						Yasgui.errors.draw(getHtmlAsText(result.message));
					} else {
						var parser = Yasgui.parsers.SparqlParserFactory(result.content);
						Yasgui.tabs[tabSettings.id].results.drawContent(parser);
					}
					Yasgui.tabs[tabSettings.id].cm.check();
				} else {
					console.log("cancelled query!");
				}
			};
			try {
				if (corsEnabled[endpoint]) {
					console.log("cors enabled");
					HTTP.call(method, endpoint, options, callback);
				} else {
					Meteor.call("query", method, endpoint, options, callback);
				}
				
			} catch (e) {
				Yasgui.tabs[tabSettings.id].cm.check();
				console.log("caught error", e);
			}
			
		};
		
		var cancelQueries = function() {
			executedQueries = {};
		};
		return {
			acceptHeaders: acceptHeaders,
			corsEnabled: corsEnabled,
			checkCorsEnabled: checkCorsEnabled,
			query: query,
			cancel: cancelQueries
		};
	};

	this.Yasgui.sparql = new Sparql();

})(this);
