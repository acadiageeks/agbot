import * as repl from 'repl'
import * as vm from 'vm'

repl.start().context = vm.createContext({
  //registerCommands: registerCommands,
})
