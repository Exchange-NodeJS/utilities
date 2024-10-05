/**
 * Interface representing a stack frame in the call stack.
 * @interface IStackFrame
 */
export interface IStackFrame {
  identifier: string;
  path: string;
  line: number;
}
