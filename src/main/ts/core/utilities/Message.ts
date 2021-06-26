import { MessageImportance } from '../types/MessageImportance';
import { config } from '../Config';

export const message = function (messageText, level: MessageImportance = MessageImportance.DEBUG) {
  let color = '#777777';
  let name = 'DEBUG';

  switch (level) {
    case MessageImportance.DANGER:
      color = '#990000';
      name = 'DANGER';
      break;
    case MessageImportance.WARNING:
      color = '#DD9900';
      name = 'WARNING';
      break;
    case MessageImportance.SUCCESS:
      color = '#009900';
      name = 'SUCCESS';
      break;
    case MessageImportance.INFO:
      color = '#000099';
      name = 'INFO';
      break;
  }

  if (config.debug >= level) {
    // tslint:disable-next-line:no-console
    console.log('%c[PLINKOREKTOR: %c' + name + '%c] %c' + messageText, 'font-weight: bold', 'font-weight: bold; color: ' + color, 'font-weight: bold', '');
  }
};