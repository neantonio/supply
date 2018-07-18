//Проверка:
return true

//Условия перехода:
        DataManager dataManager = AppBeans.get(DataManager.class)
        String query = 'select count(v.suggestion), sum(v.weight), v.suggestion from supply$Vote v ' +
                'where v.position.id=:position ' +
                'group by v.suggestion ' +
                'order by sum(v.weight) desc'
        ValueLoadContext ctx = ValueLoadContext.create().setQuery(ValueLoadContext.createQuery(query)
                .setParameter("position",position))
        .addProperty("count")
        .addProperty("weight")
        .addProperty("suggestion")
        def maxw = 0
        def count = 0
        List res = dataManager.loadValues(ctx)
        for(r in res)
        {
            int w = r.getValue("weight")
            if(w>maxw)
                maxw = w
            else if(w.equals(maxw))
                return false
            count+=r.getValue("count")
        }
        return maxw>0 && count>=3
