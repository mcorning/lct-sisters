import { Database } from '@vuex-orm/core';

import Setting from '@/models/Setting';
import Visit from '@/models/Visit';
import Place from '@/models/Place';
import Reward from '@/models/Reward';
import Appointment from '@/models/Appointment';

const database = new Database();

database.register(Setting);
database.register(Visit);
database.register(Place);
database.register(Reward);
database.register(Appointment);
console.log('Registered Databases');

export default database;
