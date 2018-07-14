//Проверка:
errors = []
if(position.getSupplyWorkoutType()==SupplyWorkoutType.Supply)
{
    if(position.getQuantity().doubleValue()<=0.0)
        errors << "Не указано количество"
}
else if(position.getSupplyWorkoutType()==null)
{
    errors << "Не выбран тип отработки позиции снабжением"
}

if(errors.size()>0)
	return errors.join("\n")

return true

//Условия перехода:
if(position.getSupplyWorkoutType()==SupplyWorkoutType.Supply)
    return true
    
return false
