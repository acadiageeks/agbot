import * as repl from 'repl'
import * as vm from 'vm'

//import { summarize } from '../lib/gcloud.js'

repl.start().context = vm.createContext({
  //summarize: summarize,
})
