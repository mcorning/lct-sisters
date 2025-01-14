import Vue from 'vue';

import { logger } from '../utils/app-logger';

Vue.config.errorHandler = (err, vm, info) => {
  logger.logToServer({ err, vm, info });
};

window.onerror = function(message, source, lineno, colno, error) {
  logger.logToServer({ message, source, lineno, colno, error });
};
