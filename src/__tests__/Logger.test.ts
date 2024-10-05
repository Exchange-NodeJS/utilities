import { describe, it, expect, vi, beforeAll } from "vitest";
import { Logger } from "../modules/classes/Logger";
import dotenv from "dotenv";

describe("Logger tests", () => {
  let normal_logger: Logger;

  beforeAll(() => {
    process.env.NODE_ENV = "development";
    normal_logger = new Logger();
  });

  it("should be initialized", () => {
    expect(normal_logger).toBeInstanceOf(Logger);
  });

  it("should log an error message", () => {
    const stdoutSpy = vi.spyOn(process.stdout, "write");
    const formattedMessageConsole = `[${new Date().toISOString()}] \x1b[31m[ERROR] Logger\x1b[0m: Test\n`;

    normal_logger.error("Test");
    expect(process.stdout.write).toHaveBeenCalledWith(formattedMessageConsole);

    stdoutSpy.mockRestore();
  });

  it("should log an warn message", () => {
    const stdoutSpy = vi.spyOn(process.stdout, "write");
    const formattedMessage = `[${new Date().toISOString()}] \x1b[33m[WARN] Logger\x1b[0m: Test\n`;

    normal_logger.warn("Test");
    expect(process.stdout.write).toHaveBeenCalledWith(formattedMessage);

    stdoutSpy.mockRestore();
  });

  it("should log an info message", () => {
    const stdoutSpy = vi.spyOn(process.stdout, "write");
    const formattedMessage = `[${new Date().toISOString()}] \x1b[32m[INFO] Logger\x1b[0m: Test\n`;

    normal_logger.info("Test");
    expect(process.stdout.write).toHaveBeenCalledWith(formattedMessage);

    stdoutSpy.mockRestore();
  });

  it("should log an debug message", () => {
    const stdoutSpy = vi.spyOn(process.stdout, "write");
    const formattedMessage = `[${new Date().toISOString()}] \x1b[34m[DEBUG] Logger\x1b[0m: Test\n`;

    normal_logger.debug("Test");

    expect(process.stdout.write).toHaveBeenCalledWith(formattedMessage);

    stdoutSpy.mockRestore();
  });
});
