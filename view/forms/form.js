// абстрактный класс формы
class Form{
    constructor(options){
        this.object = options;
    }

    // абстрактный метод построения формы
    makeView(){

    }

}

module.exports = Form;