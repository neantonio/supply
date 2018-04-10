let _ = require("lodash");

class dataFormatter{
    constructor(records){
        this.suppliers = {};
        this.organizations = {};
        this.positions = [];
        this.errorPositions = [];
        this.__parseData(records);
    }

    __getFirstValueFromHash(hash){
        return hash && hash[Object.keys(hash)[0]] || null;
    }

    __getMainContact(supplier){
        for(let supplierID in supplier.refs.supplier_contacts){
            let contact = supplier.refs.supplier_contacts[supplierID];
            if(contact.fields.mainContact && contact.fields.email){
                return {
                    name: contact.fields.description,
                    email: contact.fields.email
                }
            }
        }
        throw 'У поставщика нет ни одного контакта, указанного в качестве основного.'
    }

    __processOffer(offer){
        let supplier = this.__getFirstValueFromHash(offer.fields.supplier);
        if(!this.suppliers[supplier.fields.ID]) {
            let contacts = this.__getMainContact(supplier);
            this.suppliers[supplier.fields.ID] = {
                description: supplier.fields.description,
                contact: {
                    name: contacts.description,
                    email: contacts.email
                }
            }
        }
        return {
            supplierID: supplier.fields.ID,
            requestReceived: offer.fields.requestReceived,
            comment: offer.fields.commentary
        };
    }

    __processOffers(offers){
        let processedOffers = {}, errorOffers = [];
        for(let offerID in offers){
            try {
                let offerInfo = this.__processOffer(offers[offerID]);
                if(!processedOffers[offerID]){
                    processedOffers[offerID] = [];
                }
                processedOffers[offerID].push(offerInfo);
            }
            catch(e){
                errorOffers.push(offerID);
            }
        }
        if(errorOffers.length > 0){
            throw errorOffers;
        }
        return processedOffers;
    }

    __processOrganization(organization){
        if(!this.organizations[organization.fields.ID]){
            this.organizations[organization.fields.ID] = organization.fields;
        }
    }

    __getCommentaryForPositionBySupplier(offers, positionID, supplierID){
        for(let offerID in offers){
            let offer = offers[offerID].fields;
            if(offer.initialOfferID === positionID && offer.supplier[supplierID]){
                return offer.commentary || "";
            }
        }
        return "";
    }

    __processPosition(position, organizationID, subdivisionID, stockID, nomenclature, unit){

        let preparedPosition = {
            ID: position.fields.ID,
            comment: position.fields.commentary || "",
            description: nomenclature.fields.description,
            date: new Date(position.fields.date),
            article: nomenclature.fields.article,
            quantity: position.fields.quantity,
            shortUnit: unit.fields.description,
            fullUnit: unit.fields.full_name,
            organizationID: organizationID,
            subdivisionID: subdivisionID,
            stockID: stockID
        };
        let processedPositions = [];
        let errorPositions = {};
        try{
            let offers = this.__processOffers(position.refs.stages_initialOffer_offers);
            for(let offerID in offers){
                for(let offerInfo of offers[offerID]) {
                    // ToDo: вот тут доделать
                    if(!offerInfo.requestReceived) {
                        let posCopy = _.clone(preparedPosition);
                        posCopy.offerID = offerID;
                        posCopy.supplierID = offerInfo.supplierID;
                        posCopy.offerComment = offerInfo.comment;
                        this.positions.push(posCopy);
                    }
                }
            }
        }
        catch(e){
            for(let offerID of e){
                this.errorPositions.push({
                    ID: offerID,
                    commentary: position.refs.stages_initialOffer_offers[offerID].fields.commentary || ""
                })
            }
        }
        return {
            error: errorPositions
        }
    }

    __parseData(records){
        let errorPositions = {};
        for(let positionID in records){
            let record = records[positionID];

            let queryPosition = this.__getFirstValueFromHash(record.fields.positionID);
            let query = queryPosition.fields.queryID;

            let organization = this.__getFirstValueFromHash(query.organization);
            let subdivisionID = this.__getFirstValueFromHash(query.subdivision);
            subdivisionID = subdivisionID && subdivisionID.fields.ID || subdivisionID;
            let stockID = this.__getFirstValueFromHash(query.stock);
            stockID = stockID && stockID.fields.ID || stockID;

            let nomenclature = this.__getFirstValueFromHash(queryPosition.fields.productID);
            let unit = this.__getFirstValueFromHash(nomenclature.fields.unitID);

            this.__processOrganization(organization);
            this.__processPosition(record, organization.fields.ID, subdivisionID, stockID, nomenclature, unit);
        }
    }

    __formLetterTitle(organization){
        /**
         * АСМ
         Общество с ограниченной ответственностью "АнгарскСтройМеханизация"
         ИНН: 3801993892; КПП: 380101001
         * */
        let shortName="",
            fullName = organization.fullName ? `\n${organization.fullName}` : "",
            INN = organization.INN ? `ИНН: ${organization.INN}` : "",
            KPP = organization.KPP ? `КПП: ${organization.KPP}` : "";

        if(!organization.description){
            throw "У организации не указано сокращенное наименование."
        }

        return`
            <div id="title">
                <div id="short_name">
                    <b>${organization.description}</b>
                </div>
                ${fullName}
                <hr>
                ${[INN, KPP].join("; ")}
            </div>`;

    }

    __formTableRow(cells){
        return "<tr>" + cells.map(cell => `<td>${cell}</td>`).join("") + "</tr>";
    }

    __formContentTable(positions){
        let columns = [
            ["Наименование", "description"],
            ["Количество", "quantity"],
            ["Единица измерения", "shortUnit"],
            ["Артикул", "article"]
        ];

        let tableRows = [];
        tableRows.push(this.__formTableRow(columns.map(column => `<b>${column[0]}</b>`)));

        positions.forEach(position => {
            tableRows.push(this.__formTableRow(columns.map(column => position[column[1]])));
        });

        return `
            <table border="1">
                <tbody>
                    ${tableRows.join("")}
                </tbody>
            </table>
        `;
    }

    __formSignature(owner){
        return `
            <div id="signature">
                С уважением, ${owner.name}!
            </div>
        `;
    }

    __formLetter(positions, owner){
        let supplier = this.suppliers[positions[0].supplierID];
        let organization = this.organizations[positions[0].organizationID];
        let letter = {
            from: owner.email,
            to: supplier.contact.email,
            description: "Запрос информации",
            body: this.__formLetterTitle(organization)
        };

        letter.body +=
            `<div id="content">
                Здравствуйте${supplier.contact.name ? ", " + supplier.contact.name : "!"}
                <br><br>
                Пожалуйста, уточните наличие и цену данных позиций ${false ? "Ссылка на ЛК" : "."}
                <br>
                ${this.__formContentTable(positions)}
            </div>`;

        // letter.body += this.__formContentTable(positions);

        letter.body += this.__formSignature(owner);

        return letter;
    }

    __filterByOrganizationSubdivisionSupplier(position, unique){
        return (position.organizationID === unique.organizationID) && (position.subdivisionID === unique.subdivisionID) && (position.supplierID === unique.supplierID);
    }

    __formLettersGroups(positions, owner){
        let self = this;
        let uniq = _.uniqBy(positions, (v) => {
            return JSON.stringify({o: v.organizationID, s: v.subdivisionID, su: v.supplierID});
        });

        let groups = uniq.map(u => {
           return positions.filter(position => {
               return self.__filterByOrganizationSubdivisionSupplier(position, u);
           });
        });

        return groups.map(group => self.__formLetter(group, owner));
    }

    /**
     * Формат ответной структуры:
     * [
     *  {
     *      from: адрес отправителя,
     *      to:   адрес получателя,
     *      body: текст письма
     *  }
     * ]
     * */
    formLetters(owners){
        let self = this;
        let letters = [];
        for(let ownerID in owners){
            letters = letters.concat(
                self.__formLettersGroups(self.positions.filter(x => owners[ownerID].offerIDs.indexOf(x.offerID) >= 0), owners[ownerID])
            );
        }
        return letters;
    }
}

module.exports = dataFormatter;