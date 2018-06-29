package com.groupstp.supply.web.screens;

import com.haulmont.cuba.core.app.EmailService;
import com.haulmont.cuba.core.global.EmailInfo;
import com.haulmont.cuba.gui.components.AbstractWindow;
import com.haulmont.cuba.gui.components.Label;
import com.haulmont.cuba.gui.components.TextField;

import javax.inject.Inject;
import java.util.List;
import java.util.Map;

/**
 * @author AntonLomako
 * окно со спискос получателей, инпутом для темы и текста, кнопками отправить и отмена
 * получатели передаются списком в парамерте receiver
 */
public class Sendemail extends AbstractWindow {

    @Inject
    private Label receivers;

    @Inject
    private EmailService emailService;

    @Inject
    private TextField themeArea;

    @Inject
    private TextField contentArea;

    private List<String> addresses;

    @Override
    public void init(Map<String, Object> params) {
        List<String> addresses= (List<String>) params.get("receivers");
        this.addresses=addresses;
        if(addresses!=null){
            String allAddresses="";
            for(String address:addresses){
                allAddresses=allAddresses+address+"; ";
            }
            receivers.setValue(allAddresses);
        }
    }

    /**
     * отправка сообщения всем адресатам. тема и содержание берутся из textArea
     */
    public void onSend(){
        if(addresses!=null){
            addresses.forEach(item->{
                EmailInfo emailInfo = new EmailInfo(
                        item,
                        themeArea.getValue(),
                        null,
                        contentArea.getValue(),
                        null
                );
                emailService.sendEmailAsync(emailInfo);
            });

            close("send");
            if(addresses.size()>1)showNotification(messages.getMainMessage("message_send"));
            else showNotification(messages.getMainMessage("messages_send"));
        }
    }

    public void onCancel(){
        close("close");
    }
}