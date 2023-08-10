import * as repl from 'repl'
import * as vm from 'vm'

import { functionLibrary } from '../lib/function-library.js';

(async () => {
  const functions = await functionLibrary();
  repl.start().context = vm.createContext({
    functions: functions,
  });
})();
