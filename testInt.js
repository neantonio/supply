require('chromedriver');
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

webdriver.promise.controlFlow().on('uncaughtException', function (e) {
    console.log('\nОшибка: ' + e.message);
});

let driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();
let countBefore = 0;
let countAfter = 0;
driver.get('http://localhost:63342/client/public/')
    .then(
        success => {
            driver.findElement(By.name('user')).sendKeys('admin');
            driver.findElement(By.name('pswd')).sendKeys('eugeneRoot');
            driver.findElement(By.id('authButton')).click();
            return driver.wait(until.elementLocated(By.linkText('Документы')), 15000);
        }
    )
    .then(
        elem => {
            console.log('Авторизация пройдена');
            elem.click();
            driver.findElement(By.id('topMenu_doc-qu')).click();
            return driver.wait(until.elementLocated(By.name('ref-query-grid-listForm')), 10000);
        },
        error => {
            console.log('Ошибка авторизации', error.message);
        }
    )
    .then(
        elem => {
            console.log('Таблица загружена!');
            return driver.executeScript(function () {
                return window.w2ui['ref-query-grid-listForm'].total;
            })
        },
        error => {
            console.log('Ошибка при загрузке справочника: ', error.message);
        }
    )
    .then(
        result => {
            countBefore = result;
            driver.findElement(By.id('tb_ref-query-grid-listForm_toolbar_item_add')).click();
            return driver.wait(until.elementLocated(By.id('ref-query-description-field')), 9000);
        }
    )
    .then(
        elem => {
            console.log('Форма добавления загружена');
            driver.findElement(By.id('ref-query-description-field')).sendKeys('Тестовая заявка ' + Math.random());
            driver.findElement(By.id('ref-query-date-field')).sendKeys('12.09.2017');
            driver.findElement(By.linkText('Позиции заявки')).click();
            driver.sleep(2000);
            return driver.executeScript(function () {
                return window.w2ui['ref-query-grid-listForm'].total;
            });
        },
        error => {
            console.log('Ошибка при загрузке формы добавления: ', error.message);
        }
    )
    .then(
        result => {
            countAfter = result;
            console.log((countAfter - countBefore === 1 ? "Успешно добавлена заявка" : "Добавление прошло неуспешно"));
            driver.wait(until.elementIsVisible(driver.findElement(By.id('tb_ref-query-refs-position-grid-listForm_toolbar_item_add'))), 500).click();
            return driver.wait(until.elementLocated(By.id('ref-query-refs-position-description-field')), 9000);
        }
    )
    .then(
        elem => {
            console.log('Форма добавления в ТЧ открыта');
            elem.sendKeys('Тест');
            driver.findElement(By.id('ref-query-refs-position-productID-button-more')).click();
            return driver.wait(until.elementLocated(By.name('ref-product-grid-chooseForm')), 9000);
        },
        error => {
            console.log('Ошибка при загрузке формы добавления: ', error.message);
        }
    )
    .then(
        elem => {
            console.log('Форма выбора открыта');
            driver.findElement(By.id('grid_ref-product-grid-chooseForm_cell_0_select')).click();
            driver.findElement(By.id('ref-product-button-chooseForm-chooseRecord')).click();
            return driver.findElement(By.name('productID[]'));
        },
        error => {
            console.log('Ошибка при открытии формы выбора: ', error.message);
        }
    )
    .then(
        elem => {
            console.log('Выбрана позиция в форме выбора');
            return driver.executeScript(function () {
                return window.w2ui['ref-query-refs-position-grid-listForm'].total;
            });


        },
        error => {
            console.log('Ошибка выбора в форме выбора: ', error.message);
        }
    )
    .then(
        result => {
            countBefore = result;
            driver.wait(until.elementIsVisible(driver.findElement(By.xpath('.//*[@href="#ref-query-refs-position-refs-posref-tab-elementForm"]'))), 500).click();
            driver.sleep(2000);
            return driver.executeScript(function () {
                return window.w2ui['ref-query-refs-position-grid-listForm'].total;
            });
        }
    )
    .then(
        result => {
            countAfter = result;
            console.log((countAfter - countBefore === 1 ? "Успешно добавлено в ТЧ" : "Добавление прошло неуспешно"));
            driver.wait(until.elementIsVisible(driver.findElement(By.id('tb_ref-query-refs-position-refs-posref-grid-listForm_toolbar_item_add'))), 500).click();
            driver.wait(until.elementLocated(By.id('ref-query-refs-position-refs-posref-description-field')), 9000).sendKeys('Тест');
        }
    )
    .then(
        elem => {
            console.log('Открыта форма добавления ТЧ в ТЧ');
            return driver.executeScript(function () {
                return window.w2ui['ref-query-refs-position-refs-posref-grid-listForm'].total;
            });
        },
        error => {
            console.log('Ошибка при при открытии формы на добавлении ТЧ для ТЧ: ', error.message);
        }
    )
    .then(
        result=>{
            countBefore = result;
            driver.findElement(By.id('ref-query-refs-position-refs-posref-button-elementForm-saveandclose')).click();
            driver.sleep(2000);
            return driver.executeScript(function () {
                return window.w2ui['ref-query-refs-position-refs-posref-grid-listForm'].total;
            });
        }
    )
    .then(
        result=>{
            countAfter = result;
            console.log((countAfter - countBefore === 1 ? "Успешно добавлено в ТЧ ТЧ" : "Добавление прошло неуспешно"));
            driver.wait(until.elementIsVisible(driver.findElement(By.id('ref-query-refs-position-button-elementForm-close'))), 900).click();
            driver.wait(until.elementIsVisible(driver.findElement(By.id('ref-query-button-elementForm-close'))), 900).click();
            console.log('Тест закончен!');
        }
    )
/*//driver.findElement(By.name('q')).sendKeys('webdriver');
 driver.findElement(By.id('google')).click();
 driver.wait(until.titleIs('webdriver - Google Search'), 1000);*/

driver.quit();