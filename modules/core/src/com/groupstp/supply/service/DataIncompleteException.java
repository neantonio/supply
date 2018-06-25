package com.groupstp.supply.service;

/**
 * Created by 79167 on 23.06.2018.
 */
public class DataIncompleteException extends RuntimeException {

    public DataIncompleteException(){
        super();
    }

    public DataIncompleteException(String description){
        super(description);
    }
}
