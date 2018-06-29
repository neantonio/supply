package com.groupstp.supply.entity;

import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Column;
import javax.persistence.Lob;
import javax.validation.constraints.NotNull;
import com.haulmont.cuba.core.entity.StandardEntity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

@Table(name = "SUPPLY_QUERY_WORKFLOW_DETAIL")
@Entity(name = "supply$QueryWorkflowDetail")
public class QueryWorkflowDetail extends StandardEntity {
    private static final long serialVersionUID = 5361735365821122269L;

    @NotNull
    @Column(name = "SOURCE_STAGE", nullable = false)
    protected String sourceStage;

    @NotNull
    @Column(name = "DEST_STAGE", nullable = false)
    protected String destStage;

    @Column(name = "PRIORITY")
    protected Integer priority;

    @Lob
    @Column(name = "VALIDATION")
    protected String validation;

    @Lob
    @Column(name = "VALIDATION_SCRIPT")
    protected String validationScript;

    @Lob
    @Column(name = "CONDITIONS")
    protected String conditions;

    @Lob
    @Column(name = "SCRIPT")
    protected String script;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUERY_WORKFLOW_ID")
    protected QueryWorkflow queryWorkflow;

    public void setValidation(String validation) {
        this.validation = validation;
    }

    public String getValidation() {
        return validation;
    }

    public void setValidationScript(String validationScript) {
        this.validationScript = validationScript;
    }

    public String getValidationScript() {
        return validationScript;
    }


    public void setQueryWorkflow(QueryWorkflow queryWorkflow) {
        this.queryWorkflow = queryWorkflow;
    }

    public QueryWorkflow getQueryWorkflow() {
        return queryWorkflow;
    }


    public void setSourceStage(Stages sourceStage) {
        this.sourceStage = sourceStage == null ? null : sourceStage.getId();
    }

    public Stages getSourceStage() {
        return sourceStage == null ? null : Stages.fromId(sourceStage);
    }

    public void setDestStage(Stages destStage) {
        this.destStage = destStage == null ? null : destStage.getId();
    }

    public Stages getDestStage() {
        return destStage == null ? null : Stages.fromId(destStage);
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setConditions(String conditions) {
        this.conditions = conditions;
    }

    public String getConditions() {
        return conditions;
    }

    public void setScript(String script) {
        this.script = script;
    }

    public String getScript() {
        return script;
    }


}