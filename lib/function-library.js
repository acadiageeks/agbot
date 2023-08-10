import path from 'node:path';
import { fileURLToPath } from 'url';
import { readdir } from 'node:fs/promises';

export const functionLibrary = async () => {
  // dynamically load all defined function classes in the functions directory
  const functionsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'functions');
  const directoryEntities = await readdir(functionsDir);
  const functionFilenames = directoryEntities.filter((entity) => entity.endsWith('.js'));

  let functions = {};

  for (const functionFilename of functionFilenames) {
    const functionPath = path.join(functionsDir, functionFilename);
    const { default: klass } = await import(functionPath);

    let commandName = klass.name;
    functions[commandName] = klass;
  }

  return functions;
}
