package com.groupstp.supply.service;

import com.groupstp.supply.entity.Employee;
import com.haulmont.cuba.core.global.*;
import com.haulmont.cuba.security.app.UserSessions;
import com.haulmont.cuba.security.entity.User;
import com.haulmont.cuba.security.global.UserSession;
import org.springframework.stereotype.Service;

import javax.inject.Inject;

import org.springframework.stereotype.Service;

@Service(EmployeeService.NAME)
public class EmployeeServiceBean implements EmployeeService {
    @Inject
    private DataManager dataManager;

    @Inject
    private Metadata metadata;

    @Override
    public Employee getCurrentUserEmployee() {
        User u = AppBeans.get(UserSessionSource.class).getUserSession().getUser();
        LoadContext<Employee> lc = new LoadContext<>(Employee.class);
        lc.setQueryString("select e from supply$Employee e where e.user.id=:user").
                setParameter("user", u.getId());
        Employee  e = dataManager.load(lc);
//        if(e!=null)
//            return e;
//        e = metadata.create(Employee.class);
//        e.setUser(u);
//        e.setName(u.getLastName()+" "+u.getFirstName()+" "+u.getMiddleName());
//        dataManager.commit(e);
        return e;
    }

}