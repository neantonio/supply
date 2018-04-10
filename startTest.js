import {Populate} from "./src/test/secureServiceTest/populate";
import {SecureTest} from "./src/test/secureServiceTest/SecureTest";
import {RinTest} from "./src/test/rinTest/RinTest";
import {AliasTest} from "./src/test/aliasTest/AliasTest";
import {HistoryTest} from "./src/test/actionHistoryTest/HistoryTest";
import {ShortSchemaTest} from "./src/test/shortSchemaPopulate/ShortSchemaTest";
import {Populate1C} from "./src/test/Populate1C";

switch (2) {
    //
    case 1:
        new Populate().init().catch((e) => console.log(e));
        break;
    case 2:
        new SecureTest().init().catch((e) => console.log(e));
        break;
    case 3:
        new RinTest().init().catch((e) => console.log(e));
        break;
    case 4:
        new AliasTest().init().catch((e) => console.log(e));
        break;
    case 5:
        new HistoryTest().init().catch((e) => console.log(e));
        break;
    case 6:
        new ShortSchemaTest().init().catch((e) => console.log(e));
        break;
    case 8:
        new Populate1C().sync1C().catch((e) => console.log(e));
        break;
}

