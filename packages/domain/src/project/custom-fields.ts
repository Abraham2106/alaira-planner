import { DomainError } from "../index.js";
import type { CustomFieldType } from "./types.js";
import { CUSTOM_FIELD_TYPES } from "./types.js";

export function isCustomFieldType(value: string): value is CustomFieldType {
  return (CUSTOM_FIELD_TYPES as readonly string[]).includes(value);
}

export function assertCustomFieldType(value: string): CustomFieldType {
  if (!isCustomFieldType(value)) {
    throw new DomainError("VALIDATION", `Invalid custom field type: ${value}`);
  }
  return value;
}
