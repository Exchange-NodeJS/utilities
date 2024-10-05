import { Writable } from "stream";

/**
 * Options for the Logger contructor.
 * @interface ILoggerOptions
 */
export interface ILoggerOptions {
  bufferSize?: number;
  flushInterval?: number;
  writeStream?: Writable;
  highResTimestamps?: boolean;
  inmediate?: boolean;
}
