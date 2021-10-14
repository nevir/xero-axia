export type LogFunction = (...params: any[]) => void

export interface Logger {
  debug: LogFunction
  info: LogFunction
  warn: LogFunction
  error: LogFunction
}

export function newLogger(...prefix: [string, ...any[]]) {
  return {
    debug: wrapLogFunc(prefix, console.debug.bind(console)),
    info: wrapLogFunc(prefix, console.info.bind(console)),
    warn: wrapLogFunc(prefix, console.warn.bind(console)),
    error: wrapLogFunc(prefix, console.error.bind(console)),
    child: (...childPrefix: [...any]) => newLogger(...prefix, ...childPrefix),
  }
}

export function wrapLogFunc(
  prefix: [string, ...any[]],
  func: LogFunction,
): LogFunction {
  return function logFunction(message: string, ...params: any[]) {
    func(...prefix, message, ...params)
  }
}
