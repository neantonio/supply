import {adapter} from './reference_pg';
import _ from "lodash";
import {EmailTemplateGenerator} from "../EmailTemplateGenerator";
import {EntityParserUtil} from "../src/main/util/entityParserUtil";


class quotationRequest_pg extends adapter {

    constructor(...args) {
        super(...args)
    }

    async init() {
        await super.init();
    }

    /**
     * Ужасный костыльный метод ужасного костыльного объекта.
     * Генерирует письма поставщикам по позициям, ушедшим с этапа ПОДБОР ПОСТАВЩИКОВ.
     * В values приходят id позиций и данные пользователя;
     * Этот метод берёт id позиций и по ним получаем всю информацию, делая запрос к этапу ПЕРВИЧНОЕ ПРЕДЛОЖЕНИЕ
     * Метод использует информацию о наименовании товарной номенклатуры, название единицы измерения, количество,
     * мыло поставщика.
     * Данные о том, какой поставщик относится к какой позиции сгруппированы по позициям, метод переформатирует
     * данные, упорядочивая их наоборот - по поставщикам, чтобы правильно сформировать письма на отправку.
     * Метод парсит результат запроса к этапу, дополнят информацию, формирует структуру на отправку в виде
     * Поставщик1: {поз1, поз2...поз3}, Поставщик2: {поз4, поз5...поз6}.
     * @param values Данные для вставки в справочник учета отправленных писем.
     * @returns {Promise.<{records: {}}>}
     */
    async insert(values, parameters) {
        let user = values[0].user;
        let email = values[0].email;
        let toReturn = {records: {}};
        // дергаем данные из stages_initialOffer
        let mailingList = {};
        // создаём и заполняем фильтр, чтобы получить позиции с анализа предложений
        let ids = [];
        // фильтр для отбора позиций с этапа
        let filter = {
            comparisons: {
                'ID': {
                    left: {type: 'field', value: 'positionID'},
                    right: {type: 'value', value: []},
                    sign: 'in'
                }
            },
            tree: {'and': ['ID']}
        };
        // фильтр для отбора отправленных писем по позициям
        let filterForMailer = {
            comparisons: {
                'ID': {
                    left: {type: 'field', value: 'positionID'},
                    right: {type: 'value', value: []},
                    sign: 'in'
                }
            },
            tree: {'and': ['ID']}
        };
        // фильтр для получения подробной информации по поставщикам
        let supFilter = {
            comparisons: {
                'ID': {
                    left: {type: 'field', value: 'ID'},
                    right: {type: 'value', value: []},
                    sign: 'in'
                }
            },
            tree: {'and': ['ID']}
        };
        // фильтр для получения подробной информации по позициям
        let posFilter = _.cloneDeep(supFilter);
        // сгребаем IDшники позиций из values, чтобы засунуть их в фильтр
        for (let v of values) {
            ids.push(v['positionID']);
        }
        // переносим массив IDшников в фильтры, которые работают с позициями
        filter.comparisons['ID'].right.value = ids;
        filterForMailer.comparisons['ID'].right.value = ids;
        posFilter.comparisons['ID'].right.value = ids;
        // получаем записи с этапа
        let allFields = [
            'positionID.quantity',
            'positionID.productID.description',
            'positionID.productID.unitID.description',
            'ref.stages_initialOffer_offers.supplier.description',
            'ref.stages_initialOffer_offers.supplier.ref.supplier_contacts.email',
            'ref.stages_initialOffer_offers.supplier.ref.supplier_contacts.mainContact'
        ];
        let recFromStage = EntityParserUtil.parse(await this.parent.query('stages_initialOffer', 'get', {fields: allFields}));
        // получаем записи с mailer'а, чтобы проверить, отправляли мы такое-то письмо или нет
        let sentMails1 = EntityParserUtil.parse(await this.parent.query('quotationRequest', 'get', {
            filter: _.cloneDeep(filterForMailer),
            fields: ['ref.quotationRequest_suppliers.supplier']
        }));
        let sentMails = (await this.parent.query('quotationRequest', 'get', {
            filter: _.cloneDeep(filterForMailer),
            fields: ['ref.quotationRequest_suppliers.supplier']
        })).records;
        let errorSupliers = [];
        // перебираем результат выборки с этапа, формируем структуру для отправки писем
        for (let id in recFromStage) {
            // если нет данных в тч, пропускаем запись
            // по-хорошему, такого быть не должно, т.к. без поставщиков позиция на этот этап не попадёт, но пусть будет
            if (!recFromStage[id].refs['stages_initialOffer_offers'] || !Object.keys(recFromStage[id].refs['stages_initialOffer_offers']).length) {
                continue;
            }
            // перебор поставщиков для позиции
            for (let refid in recFromStage[id].refs['stages_initialOffer_offers']) {
                try{
                    if(recFromStage[id].refs['stages_initialOffer_offers'][refid].fields['supplier'].refs['supplier_contacts'].length === 0){
                        throw ``;
                    }
                }
                catch(e){
                    errorSupliers.push(recFromStage[id].refs['stages_initialOffer_offers'][refid].fields['supplier'].fields['description']);
                    continue;
                }
                // получем ID поставщика
                let supID = recFromStage[id].refs['stages_initialOffer_offers'][refid].fields['supplier'].fields['ID'];
                // если такого поставщика ещё не в структуре
                if (!mailingList[supID]) {
                    // то добавляем его
                    mailingList[supID] = {
                        positions: {},
                        supEmail: recFromStage[id].refs['stages_initialOffer_offers'][refid].fields['supplier'].refs['supplier_contacts'][0].fields['email']
                    }
                }
                // проверяем, есть ли у поставщика такая позиция, чтобы не засылать письмо дважды
                // для этого лезем в выборку sentMails, хранящую инфу об отправленных письмах по позициям
                let posKey = _.findKey(sentMails, (o) => {
                    return o.fields['positionID'] === recFromStage[id].fields['positionID'].fields['ID']
                });
                if (posKey && _.findKey(sentMails[posKey].refs['quotationRequest_suppliers'], (o) => {
                        return o.fields['supplier'] === supID
                    })) {
                    // пропускаем запись, если такому поставщику уже отправляли письмо по этой позиции
                    continue;
                }
                // записываем позицию на отправку
                let posID = recFromStage[id].fields['positionID'].fields['ID'];
                let product = recFromStage[id].fields['positionID'].fields['productID'].fields['description'];
                // если единица измерения не прицеплена, заменяем на пустую строку
                let unit =
                    recFromStage[id].fields['positionID'].fields['productID'].fields['unitID'] ?
                        recFromStage[id].fields['positionID'].fields['productID'].fields['unitID'].fields['description'] :
                        '';
                let quantity = recFromStage[id].fields['positionID'].fields['quantity'];
                mailingList[supID].positions[posID] = {
                    fields: {
                        product: product,
                        quantity: quantity,
                        unit: unit
                    }
                };
            }
            // конец перебора тч с поставщиками
        }
        // конец перебора записей с этапа
        // структура на отправку создана
        // генерируем письма поставщикам
        // сюда будем записывать что отправлено
        let inserted = {};
        // перебираем поставщиков-адресатов, отправляем письма
        for (let addressee in mailingList) {
            // генерируем текст письма
            let newMail = this.__generateQuotationRequest(mailingList[addressee], user, email);
            // отправляем сгенерированное письмо
            try {
                await this.parent.query('emailSender', 'insert', {values: [newMail]});
            } catch (e) {
                console.log(e);
            }
            // буферная переменная, в которую будем писать вставляемые значения, используется
            // в разных вставках, следите за руками
            let toInsert;
            // перебираем позиции поставщика
            for (let posID in mailingList[addressee].positions) {
                // Смотрим, есть ли у нас такая позиция в inserted
                if (!inserted[posID]) {
                    // формируем values для вставки: posID у нас есть, мыло и юзера берём в начале
                    toInsert = {positionID: posID, user: user, email: email};
                    let resInsert = (await super.insert([toInsert])).records;
                    // закидываем результат вставки в inserted по ключу позиции
                    inserted[posID] = Object.values(resInsert)[0][0]['ID'];
                    // если toReturn пустой, то присваиваем результат инсерта туда
                    // иначе вливаем в него результат
                    if (Object.keys(toReturn.records).length) {
                        _.assign(toReturn.records, resInsert.records);
                    } else {
                        toReturn = _.cloneDeep(resInsert);
                    }
                }
                // формируем values для вставки в табличную часть
                toInsert = {
                    quotationRequestID: inserted[posID],
                    supplier: addressee
                };
                // вставляем в табличную часть значения, собранные из ID из основного справочника и ID поставщика
                await this.parent.query('quotationRequest_suppliers', 'insert', {values: [toInsert]});
            }
        }
        if(errorSupliers.length > 0){
            throw `Не указаны контакты для поставщиков: ${errorSupliers.map(r => `'${r}'`).join(",")}`;
        }
        return toReturn;
    }


    __generateQuotationRequest(toSend, user, email) {
        let text = EmailTemplateGenerator.generateOfficialHeader()
            + EmailTemplateGenerator.generateGreeting()
            + '<br>Уточните наличие и цену данных позиций:<br>'
            + EmailTemplateGenerator.generateTable(
                toSend.positions,
                ['Наименование', 'Количество', 'Ед. изм.'],
                ['product', 'quantity', 'unit'])
            + EmailTemplateGenerator.generateSignature({name: user});
        return {
            from: email,
            to: toSend.supEmail,
            date: new Date(),
            description: 'Запрос информации',
            body: text
        };
    }
}

export {quotationRequest_pg as adapter};