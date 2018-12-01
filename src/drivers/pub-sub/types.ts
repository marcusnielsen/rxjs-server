import { Observable } from "rxjs";

export interface IPubSubMessage {
  topic: string;
  meta: { cid: string };
  payload: any;
}

export interface IMessage {
  meta: { cid: string };
  payload: any;
}

export interface IPubSub {
  publish(stream: Observable<IPubSubMessage>): void;
  subscription(topic: string, subscription: string): Observable<IMessage>;
}
