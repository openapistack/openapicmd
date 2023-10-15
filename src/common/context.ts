import { cloneDeep } from 'lodash'
import { Document } from "@apidevtools/swagger-parser";
import * as path from 'path'
import * as fs from 'fs'

/**
 * Context is a global shared object during the lifecycle of a command
 * 
 * Since we may spawn multiple nodejs processes, we store context in the filesystem
 */

export interface Context {
  document: Document
  flags: {
    interactive: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
}

export const getContext = (): Partial<Context> => {
  if (fs.existsSync(getContextFile())) {
   return JSON.parse(fs.readFileSync(getContextFile(), 'utf8'))
  }

  return {} as Partial<Context>;
}

export type ContextSetter = (prev: Partial<Context>) => Partial<Context>;
export const setContext = (fn: ContextSetter) => {
  const context = getContext();

  const newContext = fn(cloneDeep(context));

  fs.writeFileSync(getContextFile(), JSON.stringify(newContext))
}

const getContextFile = () => {
  // check if parent process has a context file
  if (fs.existsSync(getContextFileForPid(process.ppid))) {
    return getContextFileForPid(process.ppid)
  }

  // otherwise return our own
  return getContextFileForPid(process.pid)
}

const getContextFileForPid = (pid: number) => path.join('/tmp', `openapicmd-ctx-${pid}.json`);