const { join } = require('path');

const protoRoot = join(__dirname, 'proto');
const healthProto = join(protoRoot, 'common', 'v1', 'health.proto');

module.exports = {
  protoRoot,
  healthProto,
  HEALTH_PACKAGE: 'society.common.v1',
  HEALTH_SERVICE: 'HealthService',
};
