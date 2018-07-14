package com.groupstp.supply.web.screens

import com.haulmont.cuba.gui.components.AbstractWindow
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
    String accessToken

    public void onTestClick() {
        login()
        testRest()
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
        def data =
                [type:"Nomenclature", extId:"1234567891", name:"child",parent:
                    [type:"Nomenclature", name:"parent", extId:"1234567890"],
                ]
        String json = new JSONObject([data:data]).toString();
        CloseableHttpClient httpclient = HttpClients.createDefault()
        try  {
            HttpPost post = new HttpPost('http://localhost:8000/app/rest/v2/services/supply_EntityImportService/createOrUpdateEntity');
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

}