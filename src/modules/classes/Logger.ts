import { Writable } from "stream";
import { promisify } from "util";
import { SourceClass } from "../helpers/SourceClass";
import * as fs from "node:fs";
import { IBuffered } from "interfaces/IBuffered";
import { ILoggerOptions } from "interfaces/ILogger";

const setImmediatePromise = promisify(setImmediate);

export class Logger extends SourceClass implements IBuffered {
  private readonly source: string;
  private readonly buffer: (string | null)[];
  private readonly bufferSize: number;
  private readonly flushInterval: number;
  private isFlushing: boolean = false;
  private readonly writeStream: Writable;
  private index: number = 0; // For circular buffer
  private isClosed: boolean = false;
  private readonly highResTimestamps: boolean;
  private readonly inmediate: boolean;
  private readonly fileStreams: { [key: string]: Writable };

  static readonly colors = {
    error: "\x1b[31m",
    info: "\x1b[32m",
    warn: "\x1b[33m",
    debug: "\x1b[34m",
    reset: "\x1b[0m",
    mapKey: "\x1b[36m", // Cyan for map keys
    mapValue: "\x1b[35m", // Magenta for map values
    setValue: "\x1b[33m", // Yellow for set values
    objectKey: "\x1b[90m", // Gray for object keys
    objectValue: "\x1b[92m", // Light green for object values
  };

  /**
   * Creates a log utility.
   * @param {ILoggerOptions} [options={}] - Configuration options for the logger.
   * @param {number} [options.bufferSize=1024] - The buffer size for storing logs.
   * @param {number} [options.flushInterval=200] - Interval for flushing the buffer (in milliseconds).
   * @param {Writable} [options.writeStream=process.stdout] - Stream to write the output to.
   * @param {boolean} [options.highResTimestamps=false] - Whether to use high-resolution timestamps.
   * @param {boolean} [options.inmediate=true] - Whether to log immediately instead of buffering.
   * @extends {Writable}
   */
  constructor(
    options: ILoggerOptions = {
      bufferSize: 1024,
      flushInterval: 200,
      writeStream: process.stdout,
      highResTimestamps: false,
      inmediate: true,
    }
  ) {
    super();
    this.source = super.getCallerClass();
    this.bufferSize = options.bufferSize ?? 1024;
    this.flushInterval = options.flushInterval ?? 200;
    this.writeStream = options.writeStream ?? process.stdout;
    this.highResTimestamps = options.highResTimestamps ?? false;
    this.inmediate = options.inmediate ?? true;

    this.buffer = new Array(this.bufferSize).fill(null);

    this.startBuffering();
    this.fileStreams = this.initializeStreams();
  }

  /**
   * Logs a message with the specified level.
   * @param {string} level - The log level (e.g., 'warn', 'info').
   * @param {string} message - The message to log.
   * @throws {Error} If the logger is closed.
   * @returns {boolean} - If the log was correctly executed or not
   */
  log = (level: string, message: string): boolean => {
    if (this.isClosed) {
      throw new Error("Logger is closed. Cannot log new messages.");
    }

    const formattedMessage = this.formatMessage(level, message);
    const formattedMessageForFile = this.formatMessage(level, message, false);

    // Logs immediately for specific levels or if inmediate logging is enabled
    if (this.inmediate || level === "warn" || level === "error") {
      process.stdout.write(formattedMessage + "\n");
    } else {
      // Use circular buffer logic
      this.buffer[this.index] = formattedMessage;
      this.index = (this.index + 1) % this.bufferSize;

      if (this.index === 0) this.flush();
    }

    // Prints inmediately to a file (always)
    this.fileStreams[level].write(formattedMessageForFile + "\n");

    return true;
  };

  /**
   * Logs an info message.
   * @param {any} message - The message to log.
   * @returns {boolean} - If the log was correctly executed or not
   */
  info = (message: any): boolean => {
    return this.log("info", message);
  };

  /**
   * Logs a warn message.
   * @param {any} message - The message to log.
   * @returns {boolean} - If the log was correctly executed or not
   */
  warn = (message: any): boolean => {
    return this.log("warn", message);
  };

  /**
   * Logs an error message.
   * @param {any} message - The message to log.
   * @returns {boolean} - If the log was correctly executed or not
   */
  error = (message: any): boolean => {
    return this.log("error", message);
  };

  /**
   * Logs a debug message if the environment is 'development'.
   * @param {any} message - The message to log.
   * @returns {boolean} - If the log was correctly executed or not
   */
  debug = (message: any): boolean => {
    if (process.env.NODE_ENV === "development") {
      return this.log("debug", message);
    }

    return false;
  };

  /**
   * Formats a log message.
   * @param {string} level - The log level (e.g., 'warn', 'info').
   * @param {any} message - The message to format.
   * @returns {string} - The formatted log message.
   */
  formatMessage = (
    level: string,
    message: any,
    isConsole: boolean = true
  ): string => {
    const timestamp = this.highResTimestamps
      ? process.hrtime.bigint() // High-resolution timestamp
      : new Date().toISOString();
    const color =
      Logger.colors[level as keyof typeof Logger.colors] || Logger.colors.reset;
    const formattedMessage = this.formatValue(message);

    if (isConsole)
      return `[${timestamp}] ${color}[${level.toUpperCase()}] ${this.source}${
        Logger.colors.reset
      }: ${formattedMessage}`;
    else
      return `[${timestamp}] [${level.toUpperCase()}] ${
        this.source
      }: ${formattedMessage}`;
  };

  /**
   * Formats a Map object into a readable string with color-coding.
   * @param {Map<any, any>} map - The Map object to format.
   * @returns {string} - The formatted string representation of the Map.
   */
  private formatMap(map: Map<any, any>): string {
    const entries = Array.from(map.entries()).map(
      ([key, value]) =>
        `${Logger.colors.mapKey}${this.formatValue(key)}${
          Logger.colors.reset
        } => ${Logger.colors.mapValue}${this.formatValue(value)}${
          Logger.colors.reset
        }`
    );
    return `Map(${map.size}) { ${entries.join(", ")} }`;
  }

  /**
   * Formats a Set object into a readable string with color-coding.
   * @param {Set<any>} set - The Set object to format.
   * @returns {string} - The formatted string representation of the Set.
   */
  private formatSet(set: Set<any>): string {
    const values = Array.from(set.values()).map(
      (value) =>
        `${Logger.colors.setValue}${this.formatValue(value)}${
          Logger.colors.reset
        }`
    );
    return `Set(${set.size}) { ${values.join(", ")} }`;
  }

  /**
   * Formats a value into a string representation, handling Map, Set, objects, and primitives.
   * @param {any} value - The value to format.
   * @returns {string} - The formatted string representation of the value.
   */
  private formatValue(value: any): string {
    if (value instanceof Map) {
      return this.formatMap(value);
    } else if (value instanceof Set) {
      return this.formatSet(value);
    } else if (typeof value === "object" && value !== null) {
      try {
        // Avoid pretty-printing for large or deeply nested objects
        return JSON.stringify(value);
      } catch (e) {
        return `[Circular]`; // Handle circular references
      }
    } else {
      return String(value);
    }
  }

  /**
   * Starts the buffer flushing process at regular intervals.
   */
  startBuffering = (): void => {
    const flushLoop = async () => {
      if (!this.isClosed && this.index > 0 && !this.isFlushing) {
        await this.flush();
      }

      setTimeout(flushLoop, this.flushInterval);
    };

    flushLoop();
  };

  /**
   * Writes the contents of the buffer to the stream asynchronously.
   * @returns {Promise<void>}
   */
  flush = async (): Promise<void> => {
    if (this.isFlushing || this.isClosed) return;

    this.isFlushing = true;

    const batch: string[] = [];

    for (let i = 0; i < this.bufferSize; i++) {
      if (this.buffer[i]) {
        batch.push(this.buffer[i]!); // Non-null assertion
        this.buffer[i] = null;
      }
    }

    if (batch.length) {
      this.writeStream.write(batch.join("\n") + "\n");
    }

    this.index = 0;
    this.isFlushing = false;

    await setImmediatePromise();
  };

  /**
   * Closes the logger and ensures all pending logs are flushed.
   * @returns {Promise<void>}
   */
  close = async (): Promise<void> => {
    if (this.isClosed) return;

    this.isClosed = true;

    if (this.index > 0 || this.isFlushing) {
      await this.flush();
    }

    if (this.writeStream !== process.stdout) {
      this.writeStream.end();
    }

    // Closes all streams
    Object.keys(this.fileStreams).forEach((key) => {
      this.fileStreams[key].end();
    });
  };

  /**
   * Initializes file streams (to log in files)
   */
  private initializeStreams = (): { [key: string]: Writable } => {
    if (!fs.existsSync("logs")) fs.mkdirSync("logs");

    return {
      info: fs.createWriteStream("logs/info.log", {
        encoding: "utf-8",
        emitClose: true,
        flags: "a",
        highWaterMark: 16 * 1024,
      }),
      debug: fs.createWriteStream("logs/debug.log", {
        encoding: "utf-8",
        emitClose: true,
        flags: "a",
        highWaterMark: 16 * 1024,
      }),
      error: fs.createWriteStream("logs/error.log", {
        encoding: "utf-8",
        emitClose: true,
        flags: "a",
        highWaterMark: 16 * 1024,
      }),
      warn: fs.createWriteStream("logs/warn.log", {
        encoding: "utf-8",
        emitClose: true,
        flags: "a",
        highWaterMark: 16 * 1024,
      }),
    };
  };
}
