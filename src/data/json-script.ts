/**
 * JSON for an inline `<script type="application/json">` or JSON-LD block.
 * "<" is escaped so no value can ever close the script tag early.
 */
export const jsonForScript = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
