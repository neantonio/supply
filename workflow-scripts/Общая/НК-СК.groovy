//Проверка:
errors = []

if(!position.getPositionUsefulness())
	errors << "Не отмечена целесообразность"
	
if(position.getPositionType()==PositionType.specification){
    if(position.getNomenclature()==null)
		errors << "Не выбрана номенклатура"
}

if(errors.size()>0)
	return errors.join("\n")

return true

//Условия перехода:
return true
