/**
 * Roles of the User & Access Management Bounded Context.
 * The display name of each role lives in the i18n dictionaries (`iam.roles.*`).
 *
 * @readonly
 * @enum {string}
 */
export const UserRole = Object.freeze({
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
});
