package com.data2semantics.yasgui.client.queryform;

import java.util.HashMap;
import com.data2semantics.yasgui.client.View;
import com.data2semantics.yasgui.shared.Prefix;
import com.google.gwt.regexp.shared.MatchResult;
import com.google.gwt.regexp.shared.RegExp;
import com.google.gwt.user.client.ui.TextArea;
import com.smartgwt.client.widgets.Canvas;
import com.smartgwt.client.widgets.HTMLPane;
import com.smartgwt.client.widgets.form.DynamicForm;
import com.smartgwt.client.widgets.form.fields.TextItem;
import com.smartgwt.client.widgets.layout.VLayout;

public class QueryInterface extends VLayout {
	public static String QUERY_INPUT_ID = "queryInput";
	private static String DEFAULT_QUERY = "PREFIX aers: <http://aers.data2semantics.org/resource/> \n" +
			"SELECT * {?x ?f ?g} LIMIT 10";
//	"SELECT * {?d <http://aers.data2semantics.org/vocab/event_date> ?t} LIMIT 10";
	private static String DEFAULT_ENDPOINT = "http://eculture2.cs.vu.nl:5020/sparql/";
	private View view;
	private TextItem endpoint;
	private TextArea queryInput;
	private ToolBar toolBar;
	private ResultGrid queryTable;
	private VLayout queryResultContainer = new VLayout();
	private HashMap<String, Prefix> prefixes = new HashMap<String, Prefix>();

	public QueryInterface(View view) {
		setMargin(10);
		setWidth100();
		this.view = view;
		this.toolBar = new ToolBar(getView());
		addMember(this.toolBar);
		// Img img = new Img("xml.png");
		// addMember(img);
		HTMLPane queryInput = new HTMLPane();
		queryInput.setHeight("350px");
		queryInput.setContents(getTextArea());
		addMember(queryInput);
		DynamicForm endpointForm = new DynamicForm();
		endpoint = new TextItem();
		endpoint.setTitle("Endpoint");
		endpoint.setWidth(250);
		endpoint.setDefaultValue(DEFAULT_ENDPOINT);
		endpointForm.setFields(endpoint);
		addMember(endpointForm);
		addMember(queryResultContainer);


	}

	private String getTextArea() {
		String textArea = "" + "<textarea " + "id=\"" + QUERY_INPUT_ID + "\"" + ">" + DEFAULT_QUERY + "</textarea>";
		return textArea;

	}

	private ToolBar getToolBar() {
		return this.toolBar;
	}

	private View getView() {
		return this.view;
	}

	public static native void attachCodeMirror(String queryInputId) /*-{
		if ($doc.getElementById(queryInputId)) {
			$wnd.sparqlHighlight = $wnd.CodeMirror.fromTextArea($doc
					.getElementById(queryInputId), {
				mode : "application/x-sparql-query",
				tabMode : "indent",
				lineNumbers: true,
				matchBrackets : true
			});
		}
	}-*/;

	public static native String getQuery(String queryInputId) /*-{
		query = "";
		$wnd.sparqlHighlight.save();
		if ($doc.getElementById(queryInputId)) {
			if ($doc.getElementById(queryInputId).value) {
				query = $doc.getElementById(queryInputId).value;
			}
		}
		return query;
	}-*/;
	
	public void resetQueryResult() {
		Canvas[] members = queryResultContainer.getMembers();
		for (Canvas member: members) {
			queryResultContainer.removeMember(member);
		}
	}
	
	public void addQueryResult(Canvas member) {
		resetQueryResult();
		queryResultContainer.addMember(member);
	}
	
	public String getEndpoint() {
		return endpoint.getValueAsString();
	}
	
	public void storePrefixes() {
		String query = getQuery(QUERY_INPUT_ID);
		RegExp regExp = RegExp.compile("^\\s*PREFIX\\s*(\\w*):\\s*<(.*)>\\s*$", "gm");
		while (true) {
			MatchResult matcher = regExp.exec(query);
			if (matcher == null) break;
			prefixes.put(matcher.getGroup(2), new Prefix(matcher.getGroup(1), matcher.getGroup(2)));
	    }
	}
	
	public HashMap<String, Prefix> getPrefixes() {
		return this.prefixes;
	}
}