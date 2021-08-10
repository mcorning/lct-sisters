import { Some, None } from './monads/Maybe.js';
import { info, printJson } from '../utils/helpers';

export let firstOrNone = function(array) {
  return array?.length > 0 ? Some(array[0]) : None();
};
export let allOrNone = function(array) {
  return array?.length > 0 ? Some(array) : None();
};

export let inspect = (v) => {
  console.log(info('Inspecting:', printJson(v)));
  return v;
};
