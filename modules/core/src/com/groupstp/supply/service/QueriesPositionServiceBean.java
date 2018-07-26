package com.groupstp.supply.service;

import com.groupstp.supply.entity.Company;
import com.groupstp.supply.entity.QueriesPosition;
import com.groupstp.supply.entity.Stages;
import com.groupstp.supply.entity.Suppliers;
import com.haulmont.chile.core.model.MetaProperty;
import com.haulmont.cuba.core.app.EmailService;
import com.haulmont.cuba.core.global.DataManager;
import com.haulmont.cuba.core.global.EmailInfo;
import com.haulmont.cuba.core.global.Metadata;
import org.springframework.stereotype.Service;

import javax.inject.Inject;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service(QueriesPositionService.NAME)
public class QueriesPositionServiceBean implements QueriesPositionService {

    @Inject
    private Metadata metadata;
    @Inject
    private DataManager dataManager;
    @Inject
    private WorkflowService workflowService;
    @Inject
    private EmailService emailService;

    @Inject
    private VoteService voteService;


    /**
     * Копирует текущую позицию
     *
     * @param position позиция для копирования
     * @return новую позицию
     */
    @Override
    public QueriesPosition copyPosition(QueriesPosition position) {
        QueriesPosition src = dataManager.reload(position, "full");
        QueriesPosition copy = metadata.create(QueriesPosition.class);
        Collection<MetaProperty> properties = position.getMetaClass().getProperties();
        for (MetaProperty property : properties) {
            if (property.getDeclaringClass() != position.getMetaClass().getJavaClass())
                continue;
            String name = property.getName();
            copy.setValue(name, src.getValue(name));
        }
        return copy;
    }

    @Override
    public QueriesPosition splitPosition(QueriesPosition position) {
        if (position.getPosition() != null) {
            position = position.getPosition();
        }
        QueriesPosition copy = copyPosition(position);
        copy.setPosition(position);
        if (Stages.StoreControl.equals(position.getCurrentStage()))
            position.setCurrentStage(Stages.Divided);

        return copy;
    }

    @Override
    public void movePositionsToCancelStage(Set<QueriesPosition> positions) {
        for (QueriesPosition position : positions) {
            workflowService.movePositionTo(position, Stages.Abortion);
        }
    }


    @Override
    public void movePositions(Set<QueriesPosition> positions) throws Exception {
        for (QueriesPosition position : positions) {
            workflowService.movePosition(position);
        }
    }

    @Override
    public void sendEmail(Set<QueriesPosition> setPosition) {
        //Шаблоны
        String emailHeader = "To Supplier: %s \n" +
                "From Company: %s \n\n";

        String emailBody = "Nomenclature: %s \n" +
                "Quantity: %10.2f \n" +
                "Price: %10.2f \n\n";

        //Группировка по заказчику, компании
        Map<Suppliers, Map<Company, List<QueriesPosition>>> groupedBySupAndCompMap = setPosition.stream()
                .collect(Collectors.groupingBy(t -> t.getVoteResult().getPosSup().getSupplier(),
                        Collectors.groupingBy(b -> b.getQuery().getCompany())));

        groupedBySupAndCompMap.forEach((s, m) -> {

            m.forEach((c, l) -> {

                String emailHeaderToSend = String.format(emailHeader, s.getName(), c.getName());
                StringBuilder emailBodyToSend = new StringBuilder();
                l.forEach(q -> {
                    String emailBodyPosition = String.format(emailBody, q.getNomenclature().getName(), q.getVoteResult().getQuantity(), q.getVoteResult().getPrice());
                    emailBodyToSend.append(emailBodyPosition);
                });

                EmailInfo emailInfo = new EmailInfo(
                        "piratovi@gmail.com", // recipients
                        "TestTema", // subject
                        emailHeaderToSend.concat(emailBodyToSend.toString())
                );

                emailService.sendEmailAsync(emailInfo);

            });
        });
    }


    @Override
    public void setVote(Set<QueriesPosition> positions) throws Exception {
        for (QueriesPosition position : positions) {
            workflowService.movePosition(position);
            voteService.setVoteForPosition(position);
        }
    }
}

