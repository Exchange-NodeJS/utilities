import path from "path";
import { IStackFrame } from "interfaces/IStackFrame";

export class SourceClass {
  /**
   * Gets the name of the caller class.
   * This method inspects the call stack to determine which class called the current method.
   * @returns {string} The name of the caller class, or "Unknown" if it cannot be determined.
   */
  protected getCallerClass(): string {
    const inobj: { stack: string } = { stack: "" };
    const filterDir = process.cwd();
    const limit = 10;
    const oldLimit = Error.stackTraceLimit;

    // Temporarily limit the stack trace size
    Error.stackTraceLimit = limit;
    Error.captureStackTrace(inobj);
    Error.stackTraceLimit = oldLimit;

    const detectorRegex = /at (.+?) \((.+?):(\d+):(\d+)\)/;

    const stack = inobj.stack
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("at"))
      .map((line) => line.match(detectorRegex))
      .filter((match): match is RegExpMatchArray => match !== null);

    // Remove the first frame which is the current function
    stack.shift();
    stack.reverse();

    // Extract relevant information from stack frames
    const detections: IStackFrame[] = stack.map((match) => {
      const identifier = match[1];
      const path = match[2];
      const line = parseInt(match[3], 10);
      return { identifier, path, line };
    });

    // Filter frames that are within the current project directory and not from node_modules
    const local = detections.filter(
      (frame) =>
        frame.path.startsWith(path.resolve(filterDir)) &&
        !frame.path.includes("node_modules")
    );

    // Filter out anonymous and module-related identifiers
    const named = local.filter(
      (frame) =>
        !frame.identifier.includes("<anonymous>") &&
        !frame.identifier.startsWith("Object.") &&
        !frame.identifier.startsWith("Module.")
    );

    // Find the most relevant stack frame by sorting by line number
    const sortedAndSelected = named.sort(
      (element_a, element_b) => element_a.line - element_b.line
    )[0];

    if (!sortedAndSelected) return "Unknown";

    // Extract and return the class name from the identifier
    const separated = sortedAndSelected.identifier.split(".")[0].split(" ");

    // If there are multiple parts, remove the first one
    if (separated.length > 1) separated.shift();

    return separated[0];
  }
}
