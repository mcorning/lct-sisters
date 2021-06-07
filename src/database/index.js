import { Database } from '@vuex-orm/core';

import Visit from '@/models/Visit';
import Place from '@/models/Place';
import Appointment from '@/models/Appointment';

const database = new Database();

database.register(Visit);
database.register(Place);
database.register(Appointment);
console.log('Registered Database');

export default database;
