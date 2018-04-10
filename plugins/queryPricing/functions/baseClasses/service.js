export class service{
    async run(parameters, token){
        throw `Класс '${this.constructor.name}' не имеет определения метода запуска плагина.`;
    }
}