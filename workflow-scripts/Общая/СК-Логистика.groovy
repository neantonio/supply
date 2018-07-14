//Проверка:
errors = []
if(position.getSupplyWorkoutType()==SupplyWorkoutType.Relocation)
{
    if(position.getQuantity().doubleValue()<=0.0)
        errors << "Не указано количество"
    if(position.getSrcStore()==null)
        errors << "Не указан склад перемещения"    
}
else if(position.getSupplyWorkoutType()==null)
{
    errors << "Не выбран тип отработки позиции снабжением"
}

if(errors.size()>0)
	return errors.join("\n")

//Условия перехода:
if(position.getSupplyWorkoutType()==SupplyWorkoutType.Relocation)
    return true
    
return false
