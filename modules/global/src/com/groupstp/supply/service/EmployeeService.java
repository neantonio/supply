package com.groupstp.supply.service;


import com.groupstp.supply.entity.Employee;

public interface EmployeeService {
    String NAME = "supply_EmployeeService";

    Employee getCurrentUserEmployee();
}