/*
 Действия, выполняемые при подключении модуля
 */
// подключаем модуль с апи гугла
import * as google from 'googleapis';
import * as fs from 'fs';
import * as readline from 'readline';
import {logger} from '../Logger/controller';
import {XMLHttpRequest} from 'xmlhttprequest';

class gdriveUpload{
    constructor(folderID = '0B3DmmaUhbgffQ05pN0RCWXU4dEE'){
        this.__drive;
        this.__folderID = folderID;
        this.__scopes = ['https://www.googleapis.com/auth/drive'];
        this.__tokenDir = './configs/.credentials/';
        this.__tokenPath = this.__tokenDir + 'drive-nodejs-quickstart.json';
        this.__oauth2Client;
        this.__token;
        this.__inited = false;
    }

    // Promise read File
    __readFile(filename){
        return new Promise((res, rej) => {
            // Load client secrets from a local file.
            fs.readFile(__dirname + "/" + filename, function processClientSecrets(err, content) {
                if (err) {
                    //console.log('Error loading client secret file: ' + err);
                    logger.write(`warning`, `Невозможно загрузить файл ${filename}.`, new Error());
                    rej(`Невозможно загрузить файл ${filename}.`);
                }
                // Authorize a client with the loaded credentials, then call the
                // Drive API.
                res(content);
            });
        });
    }

    async __readConfig(filename = './configs/gdrive_config.json'){
        logger.write(`debug`, __dirname);
        try {
            return JSON.parse(await this.__readFile(filename));
        }
        catch(e){
            logger.write(`error`, `Не получилось загрузить файл конфигурации для Google Drive.`, new Error());
            throw `Не получилось загрузить файл конфигурации для Google Drive.`;
        }
    }

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */
    __storeToken(token) {
        try {
            fs.mkdirSync(this.__tokenDir);
        } catch (err) {
            if (err.code != 'EEXIST') {
                throw err;
            }
        }
        fs.writeFile(this.__tokenPath, JSON.stringify(token));
        logger.write(`debug`, 'Token stored to ' + this.__tokenPath);
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     *
     * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback to call with the authorized
     *     client.
     */
    __getNewToken() {
        let self = this;
        return new Promise((res, rej) => {

            let authUrl;
            try {
                authUrl = self.__oauth2Client.generateAuthUrl({
                    access_type: 'offline',
                    scope: this.__scopes
                });
            }
            catch(e){
                console.log();
            }
            console.log('Authorize this app by visiting this url: ', authUrl);
            let rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question('Enter the code from that page here: ', function (code) {
                rl.close();
                self.__oauth2Client.getToken(code, function (err, token) {
                    if (err) {
                        console.log('Error while trying to retrieve access token', err);
                        rej('Error while trying to retrieve access token');
                        return;
                    }
                    self.__storeToken(token);
                    res(token);
                });
            });
        });
    }

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    async __auth(credentials){
        let {
            client_secret: clientSecret,
            client_id: clientID,
            redirect_uris: redirectUrls
        } = credentials.installed;
        /*let clientId = credentials.installed.client_id;
        var redirectUrl = credentials.installed.redirect_uris[0];
        var auth = new googleAuth();*/
        //let auth = new googleAuth();
        this.__oauth2Client = new google.auth.OAuth2(clientID, clientSecret, redirectUrls[0]);

        // Check if we have previously stored a token.
        let token;
        try {
            token = JSON.parse(await this.__readFile(this.__tokenPath));
        }
        catch(e){
            token = await this.__getNewToken();
        }
        this.__oauth2Client.credentials = token;
    }

    async init(){
        if(this.__inited)
            return;

        let config = await this.__readConfig();
        await this.__auth(config);
        try {
            this.__drive = google.drive({version: 'v3', auth: this.__oauth2Client});
        }
        catch(e){
            logger.write(`error`, `Invalid credentials for Google Drive.`, new Error());
            throw "Invalid credentials for Google Drive.";
        }
        this.__inited = true;
    }

    /**
     * Upload file to GDisk.
     * @param {sting} filename - name of file
     * @param {file} data - stream with data
     * return file id.
     *
     * */
    upload(filename, data) {
        let self = this;
        return new Promise((res, rej) => {
            self.__drive.files.create({
                    resource: {
                        name: filename,
                        parents: [self.__folderID]
                    },
                    media: {
                        body: data
                    }
                },
                function (err, ok) {
                    if (err) {
                        logger.write(`error`, `Ошибка при отправке файла на GoogleDrive.`, new Error());
                        rej(`Ошибка при отправке файла на GoogleDrive.`);
                    } else {
                        logger.write(`debug`, `Файл '${filename}' загружен. Ссылка: http://drive.google.com/file/d/${ok.id}/preview}.`, new Error());
                        res(ok.id);
                    }
                }
            );
        });
    }

    download(fileID) {
        let self = this;

        let file = this.__drive.files.get({
            fileId: fileID,
            alt: 'media'
        });
/**
 *
 xhr.open('GET', `https://www.googleapis.com/drive/v2/files/${fileID}?alt=media`);
 xhr.setRequestHeader('Authorization', `${self.__oauth2Client.credentials.token_type} ${self.__oauth2Client.credentials.access_token}`);

 * */
        let url = typeof file.url === "object" ? file.url.href : file.url;
//         if (url) {
            return new Promise((res, rej) => {
                !file;
                let xhr = new XMLHttpRequest();
                /*
                xhr.open('GET', url);
                xhr.setRequestHeader('Authorization', file.headers.Authorization);
                */
                xhr.open('GET', `https://www.googleapis.com/drive/v3/files/${fileID}?alt=media`);
                xhr.setRequestHeader('Authorization', `${self.__oauth2Client.credentials.token_type} ${self.__oauth2Client.credentials.access_token}`);
                xhr.onload = function() {
                    !self;
                    try{
                        let error = JSON.parse(xhr.responseText);
                        rej(error.errors[0].reason);
                    }
                    catch(e){}
                    res(xhr.responseText);
                };
                xhr.onerror = function(e) {
                    rej(`Can't load file from Google Disk.`);
                };
                xhr.send();
            })
        // } else {
        //     return Promise.reject(`Can't load file from Google Disk.`);
        // }
    }

    delete(fileID){
        //DELETE https://www.googleapis.com/drive/v3/files/fileId
        let self = this;
        let file = this.__drive.files.get({
            fileId: fileID
        });

        if (file.url) {
            return new Promise((res, rej) => {
                let xhr = new XMLHttpRequest();
                xhr.open('DELETE', file.url);
                xhr.setRequestHeader('Authorization', file.headers.Authorization);
                xhr.onload = function() {
                    res(fileID);
                };
                xhr.onerror = function(e) {
                    rej(`Can't load file from Google Disk.`);
                };
                xhr.send();
            })
        } else {
            return Promise.reject(`Can't load file from Google Disk.`);
        }
    }
}

let object = new gdriveUpload();
/*
object.init()
    .then(() => {
        return object.__getNewToken();
    }
)

*/
export {object as gdriveUpload};
