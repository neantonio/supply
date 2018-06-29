package com.groupstp.supply.web.querypositionmovement;

import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.QueryPositionMovements;
import com.groupstp.supply.entity.Stages;
import com.groupstp.supply.service.QueryDaoService;
import com.haulmont.chile.core.datatypes.Datatype;
import com.haulmont.chile.core.datatypes.Datatypes;
import com.haulmont.cuba.core.app.keyvalue.KeyValueMetaClass;
import com.haulmont.cuba.core.app.keyvalue.KeyValueMetaProperty;
import com.haulmont.cuba.core.entity.KeyValueEntity;
import com.haulmont.cuba.core.global.AppBeans;
import com.haulmont.cuba.gui.data.impl.CustomCollectionDatasource;
import com.haulmont.cuba.gui.data.impl.CustomValueCollectionDatasource;
import com.sun.prism.PixelFormat;

import javax.inject.Inject;
import java.util.*;

/**
 * @author AntonLomako
 * возвращвет набор QueryPositionMovement, созданный с уникалными значениями Stage
 * нужен только для того чтобы отобразить все этапы строчками в таблице
 */
public class JustAllStagesDs extends CustomCollectionDatasource<QueryPositionMovements,UUID>
    {

       List<QueryPositionMovements> queryPositionMovementses=null;

        @Override
        protected Collection<QueryPositionMovements> getEntities(Map<String, Object> params){

            if(queryPositionMovementses!=null) return queryPositionMovementses;
                else {
                queryPositionMovementses=new ArrayList<>();
                Arrays.asList(Stages.values()).forEach(item->{
                    QueryPositionMovements qpm=new QueryPositionMovements();
                    qpm.setStage(item);
                    queryPositionMovementses.add(qpm);
                });
                return queryPositionMovementses;
            }

    }
}
