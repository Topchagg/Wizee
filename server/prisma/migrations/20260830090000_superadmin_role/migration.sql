-- Not reachable through any app flow: SetRoleDto's whitelist never includes
-- it, so the only way a row ends up with this value is an operator running
-- UPDATE "User" SET "role" = 'SUPERADMIN' WHERE ... directly against the DB.
ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';
