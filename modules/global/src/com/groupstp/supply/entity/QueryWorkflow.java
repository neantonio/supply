package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import com.haulmont.chile.core.annotations.Composition;
import com.haulmont.cuba.core.entity.annotation.OnDelete;
import com.haulmont.cuba.core.global.DeletePolicy;
import java.util.List;
import javax.persistence.Column;
import javax.persistence.OneToMany;
import javax.validation.constraints.NotNull;
import com.haulmont.cuba.core.entity.StandardEntity;
import com.haulmont.chile.core.annotations.NamePattern;

@NamePattern("%s|name")
@Table(name = "SUPPLY_QUERY_WORKFLOW")
@Entity(name = "supply$QueryWorkflow")
public class QueryWorkflow extends StandardEntity {
    private static final long serialVersionUID = -2076066366376207200L;

    @NotNull
    @Column(name = "NAME", nullable = false, length = 50)
    protected String name;

    @Composition
    @OnDelete(DeletePolicy.CASCADE)
    @OneToMany(mappedBy = "queryWorkflow")
    protected List<QueryWorkflowDetail> details;

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setDetails(List<QueryWorkflowDetail> details) {
        this.details = details;
    }

    public List<QueryWorkflowDetail> getDetails() {
        return details;
    }


}