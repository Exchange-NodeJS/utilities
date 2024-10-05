export class FormatterClass {
  /**
   * Formats a number to dollars
   * @returns {string}
   */
  public format_to_dollar(amount: number): string {
    const options: Intl.NumberFormatOptions = {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    const formatter = new Intl.NumberFormat("en-US", options);
    return formatter.format(amount);
  }
}