import { Observable, Subject } from "rxjs";
import { delay, filter, map } from "rxjs/operators";
import { IPubSubMessage, IPubSub } from ".";
import { IMessage } from "../../types";

export class PubSub implements IPubSub {
  private pubSubSubject: Subject<IPubSubMessage>;

  constructor() {
    this.pubSubSubject = new Subject<IPubSubMessage>();
  }

  public publish(stream: Observable<IPubSubMessage>): void {
    stream.subscribe(
      msg => {
        this.pubSubSubject.next(msg);
      },
      error => {
        this.pubSubSubject.error(error);
      },
      () => {
        this.pubSubSubject.complete();
      }
    );
  }

  public subscription(
    topic: string,
    subscription: string
  ): Observable<IMessage> {
    return this.pubSubSubject.pipe(
      filter(msg => msg.topic === topic),
      map(msg => ({ meta: { ...msg.meta }, payload: { ...msg.payload } })),
      delay(1000)
    );
  }
}
