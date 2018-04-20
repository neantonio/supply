import {sender} from "./baseClasses/sendClass";
import {util} from "./baseClasses/utilityClass";
import {service} from "./baseClasses/service";

class pluginClass extends service{
    constructor(){
        super(name);
        this.name = name;
    }

    //получение последней цены
    static __getLastPriceForProduct(record) {
        let lastDate, lastPrice = 0;
        for(let productPriceID in record.refs.product_prices){
            let price = record.refs.product_prices[productPriceID].fields;
            let currentDate = new Date(price.date);
            if(!lastDate || lastDate < currentDate){
                lastDate = currentDate;
                lastPrice = 1.0 * price.price / price.quantity;
            }
        }
        return lastPrice;
    }

    //обновление цены в позиции заявки
    static __processQueryPosition(position) {
        let {ID, quantity} = position.fields;
        let result = {
            ID: ID,
            price: 0
        };
        if(position.fields.productID) {
            let lastPrice = pluginClass.__getLastPriceForProduct(util.getFirstValueFromHash(position.fields.productID));
            if(lastPrice > 0) {
                result.price = quantity * lastPrice;
                sender.send({
                    object: "supply.query_position",
                    method: "update",
                    parameters: {
                        filter: this.__getFilterById(ID),
                        values: [{calculatedCost: result.price}]
                    }
                });
            }
        }
        return result;
    }

    //обновление сумм в заявке
    static __updateQueryCost(queryID, price) {
        return sender.send({
            object: "supply.query",
            method: "update",
            parameters: {
                filter: this.__getFilterById(queryID),
                values: [{calculatedCost: price}]
            }
        });
    }

    async run(parameters, token){
        let records = await sender.send({
            object: "supply.query",
            method: "get",
            parameters: {
                filter: parameters.filter || {},
                fields: [
                    "ref.query_position.quantity",
                    "ref.query_position.productID.ID",
                    "ref.query_position.productID.description",
                    "ref.query_position.productID.ref.product_prices.price",
                    "ref.query_position.productID.ref.product_prices.quantity",
                    "ref.query_position.productID.ref.product_prices.date"
                ]
            }
        }, token);

        let updatePromises = [];
        for(let queryID in records){
            let queryRecord = records[queryID];
            let allPositionsWithLastPrice = true;
            let sum = 0;
            for(let positionID in queryRecord.refs.query_position){
                let positionResult = pluginClass.__processQueryPosition(queryRecord.refs.query_position[positionID]);
                if(positionResult.price === 0){
                    allPositionsWithLastPrice = false;
                }
                else{
                    records[queryID].refs.query_position[positionID].fields.calculatedCost = positionResult.price;
                    sum += positionResult.price;
                }
            }
            if(allPositionsWithLastPrice){
                records[queryID].fields.calculatedCost = sum;
                updatePromises.push(pluginClass.__updateQueryCost(queryID, sum));
            }
        }

        await Promise.all(updatePromises);
        return {
            records: records
        };
    }
}

let name = "queryPricing";
let plugin = new pluginClass();

export {
    plugin as plugin,
    name as name
}
