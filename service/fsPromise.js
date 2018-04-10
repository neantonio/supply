import * as fs from "fs";
import {logger} from "../Logger/controller";
'use strict';

let promiseReadDir =  (path) => {
    logger.write("debug", `Чтение списка файлов в директории ${path}.`);
    return new Promise((res, rej) => {
        fs.readdir(path, (err, items) => {
            if(err) {
                logger.write("warning", `Ошибка чтения директории ${path}`, new Error());
                rej(items);
            }
            res(items)
        });
    })
};

let promiseReadFile = (path) => {
    return new Promise((res, rej) => {
        fs.open(path, 'r', (e, fd) => {
            if(e) {
                logger.write(`warning`, `Ошибка открытия файла ${path}`, new Error());
                rej(e);
            }
            fs.readFile(fd, (e, data) => {
                if (e) {
                    logger.write(`warning`, `Ошибка чтения файла ${path}`, new Error());
                    rej(e);
                }
                fs.close(fd, (e) => {
                    if (e) {
                        logger.write(`warning`, `Ошибка закрытия файла ${path}`, new Error());
                        rej(e);
                    }
                    res(data)

                })
            });
        })
    });

};

let promiseFileExists = (path) => {
    if(fs.existsSync())
        return Promise.resolve();
    else
        return Promise.reject();
};

let promiseCreateAndWriteToFile = (path, object) => {
    return new Promise((res, rej) => {
        logger.write(`debug`, `Создание файла ${path}.`);
        fs.open(path, 'w', (e, fd) => {
            if(e) {
                logger.write(`warning`, `Ошибка открытия файла ${path}`, new Error());
                rej(e);
            }
            fs.write(fd, JSON.stringify(object), (e, data) => {
                if (e) {
                    logger.write(`warning`, `Ошибка чтения файла ${path}`, new Error());
                    rej(e);
                }
                fs.close(fd, (e) => {
                    if (e) {
                        logger.write(`warning`, `Ошибка закрытия файла ${path}`, new Error());
                        rej(e);
                    }
                    res();
                })
            });
        })
    });
    /*try {
        let file = fs.createWriteStream(path);
        file.write(new Buffer(JSON.stringify(object)));
        fs.close(file);
    }
    catch(e){
        logger.write(`warning`,`Невозможно произвести действие с файлом.`, new Error());
        logger.write(`debug`,`Объект ошибки: ${e}`);
        return Promise.reject(`Ошибка при записи в файл ${path}`);
    }
    return Promise.resolve();*/
};


export {promiseReadDir, promiseReadFile, promiseFileExists, promiseCreateAndWriteToFile};