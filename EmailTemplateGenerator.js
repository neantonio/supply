class EmailTemplateGenerator{
    constructor(){}

    static generateOfficialHeader(info){
        return '';
    }

    static generateTable(records, header, dict){
        // генерируем заголовок таблицы
        let top = '';
        for (let field in header){
            top = top.concat('<td><b>'+header[field]+'</b></td>')
        }
        top = '<tr>'+top+'</tr>';
        // формируем основную часть
        let cells = '';
        for (let id in records){
            // собираем строку таблицы, подставляя поля в правильном порядке
            let row = '';
            for (let field in dict){
                row = row.concat('<td>'+records[id].fields[dict[field]]+'</td>');
            }
            cells = cells.concat('<tr>'+row+'</tr>');
        }
        // закрываем таблицу
        return '<table border="2">'+top+cells+'</table>';
    }

    static generateGreeting(){
        let greeting = `Добрый день!<br>`;
        return greeting;
    }

    static generateSignature(senderInfo){
        let signature = 'С уважением,'+'<br>'
            + (senderInfo.position ? senderInfo.position+'<br>' : '')
            + senderInfo.name + '<br>'
            + (senderInfo.email ? senderInfo.email + '<br>' : '')
            + (senderInfo.phone ? 'Контактный телефон: ' + senderInfo.phone : '');
        return signature;

    }
}

export {EmailTemplateGenerator as EmailTemplateGenerator};