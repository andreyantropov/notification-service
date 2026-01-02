export enum EventType {
  Bootstrap = "bootstrap",
  Shutdown = "shutdown",

  Request = "request",
  Command = "command",
  Query = "query",

  ExternalCall = "external_call",
  MessagePublish = "message_publish",
  MessageConsume = "message_consume",

  HealthCheck = "health_check",
  CronJob = "cron_job",
  CacheOperation = "cache_operation",

  AuthAttempt = "auth_attempt",
  AccessDenied = "access_denied",

  ConfigReload = "config_reload",
  DependencyFailure = "dependency_failure",
  RetryAttempt = "retry_attempt",
  CircuitBreaker = "circuit_breaker",
  InfrastructureFailure = "infrastructure_failure",
}
