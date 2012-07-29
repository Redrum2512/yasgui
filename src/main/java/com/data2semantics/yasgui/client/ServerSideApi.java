package com.data2semantics.yasgui.client;

import com.google.gwt.user.client.rpc.RemoteService;
import com.google.gwt.user.client.rpc.RemoteServiceRelativePath;

/**
 * The client side stub for the RPC service.
 */
@RemoteServiceRelativePath("api")
public interface ServerSideApi extends RemoteService {
  String greetServer(String name) throws IllegalArgumentException;
}