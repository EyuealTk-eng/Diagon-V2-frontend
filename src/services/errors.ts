import type { FieldErrors } from "../types/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public fields: FieldErrors,
  ) {
    super(ApiError.summarize(status, fields));
  }

  static summarize(status: number, fields: FieldErrors): string {
    const detail = fields.detail ?? fields.non_field_errors;
    if (detail) return Array.isArray(detail) ? detail.join(" ") : String(detail);
    if (status === 0) return "Can't reach Diagon right now. Check your connection.";
    if (status >= 500) return "Something went wrong on our side. Please try again.";
    return "Please check the highlighted fields.";
  }

  field(name: string): string | undefined {
    const value = this.fields[name];
    if (!value) return undefined;
    return Array.isArray(value) ? value.join(" ") : String(value);
  }
}
