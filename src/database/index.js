import { Database } from '@vuex-orm/core';

import Visit from '@/models/Visit';
import Place from '@/models/Place';

const database = new Database();

database.register(Visit);
database.register(Place);
console.log('Registered Database');

export default database;
