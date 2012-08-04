package com.data2semantics.yasgui.client;

import com.data2semantics.yasgui.shared.ResultSetContainer;
import com.google.gwt.user.client.rpc.RemoteService;
import com.google.gwt.user.client.rpc.RemoteServiceRelativePath;

/**
 * The client side stub for the RPC service.
 */
@RemoteServiceRelativePath("YasguiService")
public interface YasguiService extends RemoteService {
  String queryGetJson(String endpoint, String query) throws IllegalArgumentException;
  ResultSetContainer queryGetObject(String endpoint, String query) throws IllegalArgumentException;
  
  
}