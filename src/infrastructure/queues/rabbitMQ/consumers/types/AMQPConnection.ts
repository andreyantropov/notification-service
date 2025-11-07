import { AMQPClient } from "@cloudamqp/amqp-client";

export type AMQPConnection =
  ReturnType<AMQPClient["connect"]> extends Promise<infer T> ? T : never;
