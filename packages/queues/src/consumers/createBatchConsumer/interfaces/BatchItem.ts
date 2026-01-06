import { AMQPMessage } from "@cloudamqp/amqp-client";

export interface BatchItem<T> {
  item: T;
  msg: AMQPMessage;
}
