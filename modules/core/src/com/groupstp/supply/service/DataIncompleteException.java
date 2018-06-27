package com.groupstp.supply.service;

/**
 * @author AntonLomako
 *
 */
public class DataIncompleteException extends RuntimeException {

    public DataIncompleteException(){
        super();
    }

    public DataIncompleteException(String description){
        super(description);
    }
}
