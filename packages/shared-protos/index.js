const { join } = require('path');

const protoRoot = join(__dirname, 'proto');
const healthProto = join(protoRoot, 'common', 'v1', 'health.proto');
const userProto = join(protoRoot, 'core', 'v1', 'user.proto');

module.exports = {
  protoRoot,
  healthProto,
  userProto,
  HEALTH_PACKAGE: 'society.common.v1',
  HEALTH_SERVICE: 'HealthService',
  CORE_PACKAGE: 'society.core.v1',
  USER_SERVICE: 'UserService',
  ROLE_SERVICE: 'RoleService',
  PERMISSION_SERVICE: 'PermissionService',
  AUTH_SERVICE: 'AuthService',
};
