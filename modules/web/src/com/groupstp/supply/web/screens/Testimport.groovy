package com.groupstp.supply.web.screens

import com.groupstp.supply.entity.QueriesPosition
import com.groupstp.supply.service.ImportControllerService
import com.groupstp.supply.service.SuggestionService
import com.haulmont.cuba.gui.components.AbstractWindow
import com.haulmont.cuba.gui.components.Label
import com.haulmont.cuba.gui.components.Link
import com.haulmont.cuba.gui.components.Table
import com.haulmont.cuba.gui.components.TextField
import com.haulmont.cuba.gui.data.CollectionDatasource
import com.haulmont.cuba.gui.settings.Settings
import com.vaadin.event.ItemClickEvent
import org.apache.http.HttpEntity
import org.apache.http.HttpResponse
import org.apache.http.client.ClientProtocolException
import org.apache.http.client.ResponseHandler
import org.apache.http.client.entity.UrlEncodedFormEntity
import org.apache.http.client.methods.HttpPost
import org.apache.http.entity.ContentType
import org.apache.http.entity.StringEntity
import org.apache.http.impl.client.CloseableHttpClient
import org.apache.http.impl.client.HttpClients
import org.apache.http.message.BasicNameValuePair
import org.apache.http.util.EntityUtils
import org.json.JSONObject
import org.omg.CORBA.NameValuePair
import org.slf4j.Logger

import javax.inject.Inject

class Testimport extends AbstractWindow {
    @Inject
    private Logger log;
    String accessToken;

    @Inject
    private TextField txtPass;

    @Inject
    private TextField txtToken;

    @Inject
    private TextField txtLink;

    @Inject
    private Table<QueriesPosition> positionTable;

    @Inject
    private Label tokenLabel;

    @Inject
    private Link webFormLink;

    @Inject
    private SuggestionService suggestionService;

    @Inject
    CollectionDatasource<QueriesPosition,UUID> queriesPositionsDs;

    @Inject
    private ImportControllerService importControllerService;

    @Override
    public void init(Map<String, Object> params) {

        com.vaadin.ui.Table vTable = positionTable.unwrap(com.vaadin.ui.Table.class);
        vTable.addItemClickListener(new ItemClickEvent.ItemClickListener() {
            @Override
            void itemClick(ItemClickEvent event) {

                //напрямую выбранный элемент не получить. достаем его по id
                QueriesPosition qp=queriesPositionsDs.getItem(UUID.fromString(event.getItemId().toString()));

                //сюда попадает прошлое выделение, поэтому его надо обрабатывать
                Collection<QueriesPosition> qpCollection=new ArrayList<QueriesPosition>();
                if(event.isCtrlKey()){
                    qpCollection.addAll(positionTable.getSelected());
                    if(qpCollection.contains(qp))qpCollection.remove(qp);
                    else qpCollection.add(qp);
                }
                else qpCollection.add(qp);


                tokenLabel.setValue(suggestionService.makeTokenForPositions(qpCollection))
                webFormLink.setUrl(txtLink.getRawValue()+tokenLabel.getRawValue());
                webFormLink.setCaption(txtLink.getRawValue()+tokenLabel.getRawValue())
            }
        })
        ;
    }

    public void onTestClick() {
        login()
        testRest()
    }

    public void onTestSyncClick() throws Exception {
        importControllerService.importNomenclature1C("http://stpserver.groupstp.ru:1805/accnt2016/", txtPass.getRawValue());
       // importControllerService.importNomenclature1C("http://stpserver.groupstp.ru:1805/accnt2016/", txtPass.getRawValue());
    }

    private void login() throws IOException {
        CloseableHttpClient httpclient = HttpClients.createDefault()
        try {
            HttpPost post = new HttpPost("http://localhost:8000/app/rest/v2/oauth/token")

            // see cuba.rest.client.id and cuba.rest.client.secret application properties
            String credentials = Base64.getEncoder().encodeToString("client:secret".getBytes("UTF-8"));
            post.setHeader("Authorization", "Basic " + credentials);

            // user credentials
            List<NameValuePair> params = new ArrayList<>()
            params.add(new BasicNameValuePair("grant_type", "password"));
            params.add(new BasicNameValuePair("username", "admin"));
            params.add(new BasicNameValuePair("password", "admin"));
            post.setEntity(new UrlEncodedFormEntity(params));

            System.out.println("Executing request " + post.getRequestLine());

            String json = httpclient.execute(post, new StringResponseHandler());
            JSONObject jsonObject = new JSONObject(json);
            accessToken = jsonObject.getString("access_token");

            System.out.println("Logged in, session id: " + accessToken);
        }
        finally {
            System.out.print("No Luck!")
        }
    }

    private void testRest()
    {
//        def data =
//                [type:"Nomenclature", extId:"1234567891", name:"child",parent:
//                    [type:"Nomenclature", name:"parent", extId:"1234567890"],
//                ]
        String json = new JSONObject([token:txtToken.getRawValue()]).toString();
        CloseableHttpClient httpclient = HttpClients.createDefault()
        try  {
            HttpPost post = new HttpPost('http://localhost:8000/app/rest/v2/services/supply_SuggestionService/getPositionsForToken');
            post.setHeader("Authorization", "Bearer " + accessToken);

            StringEntity stringEntity = new StringEntity(json, ContentType.APPLICATION_JSON);
            post.setEntity(stringEntity);

            System.out.println("Executing request " + post.getRequestLine());

            String response = httpclient.execute(post, new StringResponseHandler());

            throw new Exception(response)
        }
        finally {
            println("No Luck")
        }
    }

    private static class StringResponseHandler implements ResponseHandler<String> {
        @Override
        public String handleResponse(HttpResponse response) throws IOException {
            int status = response.getStatusLine().getStatusCode();
            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
                return entity != null ? EntityUtils.toString(entity) : null;
            } else {
                throw new ClientProtocolException("Unexpected response status: " + status);
            }
        }
    }
    @Override
    public void saveSettings() {
        org.dom4j.Element x = getSettings().get(this.getId());
        x.addAttribute("value", txtPass.getRawValue());
        getSettings().setModified(true);
        super.saveSettings();
    }

    /**
     * This method is called when the screen is opened to restore settings saved in the database for the current user.
     * <p>You can override it to restore custom settings.
     * <p>For example:
     * <pre>
     * public void applySettings(Settings settings) {
     *     super.applySettings(settings);
     *     String visible = settings.get(hintBox.getId()).attributeValue("visible");
     *     if (visible != null)
     *         hintBox.setVisible(Boolean.valueOf(visible));
     * }
     * </pre>
     *
     * @param settings settings object loaded from the database for the current user
     */
    @Override
    public void applySettings(Settings settings) {
        super.applySettings(settings);
        txtPass.setValue(settings.get(this.getId()).attributeValue("value"));
    }

}