/*******************************************************************************
 * Copyright (c)  2012 Laurens Rietveld
 * 
 *  Permission is hereby granted, free of charge, to any person
 *  obtaining a copy of this software and associated documentation
 *  files (the "Software"), to deal in the Software without
 *  restriction, including without limitation the rights to use,
 *  copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the
 *  Software is furnished to do so, subject to the following
 *  conditions:
 * 
 *  The above copyright notice and this permission notice shall be
 *  included in all copies or substantial portions of the Software.
 * 
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 *  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 *  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 *  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 *  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 *  OTHER DEALINGS IN THE SOFTWARE.
 ******************************************************************************/
package com.data2semantics.yasgui.client.settings;

import java.util.ArrayList;
import java.util.Set;
import com.data2semantics.yasgui.shared.exceptions.SettingsException;
import com.google.gwt.json.client.JSONArray;
import com.google.gwt.json.client.JSONNumber;
import com.google.gwt.json.client.JSONObject;

public class Settings extends JSONObject {
	private ArrayList<TabSettings> tabArray = new ArrayList<TabSettings>();
	/**
	 * KEYS
	 */
	private static String SELECTED_TAB_NUMBER = "selectedTabNumber";
	public static String TAB_SETTINGS = "tabSettings";
	
	
	/**
	 * DEFAULTS
	 */
	public static int DEFAULT_SELECTED_TAB = 0;
	
	public Settings(){
		addTabSettings(new TabSettings());
		setSelectedTabNumber(DEFAULT_SELECTED_TAB);
	}
	
	public Settings(JSONObject jsonObject) {
		Set<String> keys = jsonObject.keySet();
		for (String key : keys) {
			if (key.equals(Settings.TAB_SETTINGS)) {
				JSONArray jsonArray = jsonObject.get(key).isArray();
				for (int i = 0; i < jsonArray.size(); i++) {
					//Add as TabSettings to tab arraylist
					tabArray.add(new TabSettings(jsonArray.get(i).isObject()));
				}
			} else {
				put(key, jsonObject.get(key));
			}
		}
		
	}
	
	public void setSelectedTabNumber(int selectedTabNumber) {
		put(SELECTED_TAB_NUMBER, new JSONNumber(selectedTabNumber));
	}
	
	public void addTabSettings(TabSettings tabSettings) {
		tabArray.add(tabSettings);
	}
	
	public ArrayList<TabSettings> getTabArray() {
		return tabArray;
	}
	
	
	public int getSelectedTabNumber() {
		int selectedTab = (int)get(SELECTED_TAB_NUMBER).isNumber().doubleValue();
		if (selectedTab >= tabArray.size()) {
			//Something is wrong, tab does not exist. take last tab
			selectedTab = tabArray.size()-1;
		}
		return selectedTab;
	}
	
	public void removeTabSettings(int index) {
		tabArray.remove(index);
	}
	
	public TabSettings getSelectedTabSettings() throws SettingsException {
		if (getSelectedTabNumber() >= 0) {
			return tabArray.get(getSelectedTabNumber());
		} else {
			return new TabSettings();
		}
	}
	
	/**
	 * Returns JSON representation of this object
	 */
	public String toString() {
		//First add TabSettings to the jsonobject
		JSONArray jsonArray = new JSONArray();
		for(int i = 0; i < tabArray.size(); i++) {
			jsonArray.set(i, (JSONObject)tabArray.get(i));
		}
		put(TAB_SETTINGS, jsonArray);
		
		return super.toString();
	}
}