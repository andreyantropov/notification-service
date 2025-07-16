export enum EventType {
  BootstrapSuccess = "bootstrap_success",
  BootstrapError = "bootstrap_error",

  ServerSuccess = "server_success",
  ServerError = "server_error",

  NotificationSuccess = "notification_success",
  NotificationWarning = "notification_warning",
  NotificationError = "notification_error",

  RequestSuccess = "request_success",
  RequestError = "request_error",

  HealthCheckSuccess = "health_check_success",
  HealthCheckWarning = "health_check_warning",
  HealthCheckError = "health_check_error",
}
