class utilityClass{
    static secTimer(sec){
        return new Promise((res, rej) => {
            setTimeout(res, sec*1000);
        })
    }

    static dateToStr(date){
        let d = (new Date(date)) || new Date();
        return d.getFullYear() + "-"+
            (d.getMonth() < 9 ? "0" : "") +(d.getMonth() + 1) + "-" +
            (d.getDate() < 9 ? "0" : "") +d.getDate() + " " +
            (d.getHours() < 9 ? "0" : "") +d.getHours() + ":" +
            (d.getMinutes() < 9 ? "0" : "") +d.getMinutes() + ":" +
            (d.getSeconds() < 9 ? "0" : "") +d.getSeconds() + "." +
            d.getMilliseconds()
    }

    static getFirstValueFromHash(hash){
        return hash && hash[Object.keys(hash)[0]] || null;
    }

    static getFieldValueByName(records, fieldName){
        for(let recordID in records){
            let currentFieldName = this.__getFirstValueFromHash(records[recordID].fields.fieldID).fields.description;
            if(fieldName === currentFieldName){
                return records[recordID].fields.valueOld;
            }
        }
    }
    
    static  getInnerFieldFromStructure(structure, field){
        let parts = field.split(".");
        let currentField = parts.shift();
        if(parts.length === 0){
            return [structure.fields[currentField]];
        }
        else{
            if(currentField === "ref"){
                let result = [];
                let refName = parts.shift();
                let refFieldName = parts.shift();
                for(let refID in structure.refs[refName]){
                    let fieldValue = structure.refs[refName][refID].fields[refFieldName];
                    if(!!fieldValue){
                        result.push(
                            utilityClass.getInnerFieldFromStructure(utilityClass.getFirstValueFromHash(fieldValue), parts.join("."))
                        );
                    }
                    else{
                        result.push(fieldValue);
                    }
                }
                return result;
            }
            else{
                if(!!structure.fields[currentField]) {
                    return utilityClass.getInnerFieldFromStructure(utilityClass.getFirstValueFromHash(structure.fields[currentField]), parts.join("."));
                }
                else{
                    return [null];
                }
            }
        }
    }

    static HTMLCellFromString(string){
        return "<td>" + string + "</td>";
    }

    static HTMLRowFromArray(array){
        return "<tr>" + array.map(utilityClass.HTMLCellFromString).join("") + "</tr>";
    }

    static HTMLTableFromArrays(arrays){
        return "<table border='1'><tbody>" + arrays.map(utilityClass.HTMLRowFromArray).join("\n") + "</tbody></table>";

    }
}

export {utilityClass as util}