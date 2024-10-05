/**
 * Class for buffered logging or data handling.
 * @interface IBuffered
 */
export interface IBuffered {
  /**
   * Closes the buffer, ensuring all pending data is flushed.
   * @returns {Promise<void>} - A promise that resolves when the buffer has been successfully closed.
   */
  close(): Promise<void>;

  /**
   * Flushes the contents of the buffer.
   * @returns {Promise<void>} - A promise that resolves when the buffer has been successfully flushed.
   */
  flush(): Promise<void>;

  /**
   * Starts buffering data and periodically flushes the buffer.
   * @returns {void}
   */
  startBuffering(): void;
}
