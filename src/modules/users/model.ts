import { IDb } from "../../drivers/db";
import { Observable, of, merge, never } from "rxjs";
import {
  concatMap,
  delay,
  switchMap,
  takeUntil,
  tap,
  share
} from "rxjs/operators";
import { IMessage } from "../../types";

export class User {
  private loggedInEventStream: Observable<IMessage>;
  private sessionTimedOutEventStream: Observable<IMessage>;
  private loggedOutEventStream: Observable<IMessage>;

  constructor(
    private db: IDb,
    private logInCommandStream: Observable<IMessage>,
    private logOutCommandStream: Observable<IMessage>,
    sessionTimeout?: number
  ) {
    this.loggedInEventStream = this.logInCommandStream.pipe(
      concatMap(async action => {
        await this.db.none(
          "update users set logged_in = $0 where name = $1 and password = $2",
          [true, action.payload.name, action.payload.password]
        );
        return action;
      }),
      share()
    );

    if (sessionTimeout === undefined) {
      this.sessionTimedOutEventStream = never();
    } else {
      //     return of({ meta: { cid: "" }, payload: { test: "test" } });
      this.sessionTimedOutEventStream = this.loggedInEventStream.pipe(
        switchMap(msg =>
          of({
            meta: { cid: msg.meta.cid },
            payload: { name: msg.payload.name }
          }).pipe(
            delay(sessionTimeout),
            takeUntil(this.logOutCommandStream)
          )
        ),
        share()
      );
    }

    this.loggedOutEventStream = merge(
      this.logOutCommandStream,
      this.sessionTimedOutEventStream
    ).pipe(
      concatMap(async action => {
        await this.db.none("update users set logged_in = $0 where name = $1", [
          false,
          action.payload.name
        ]);
        return action;
      }),
      share()
    );
  }

  public getLoggedInEventStream(): Observable<IMessage> {
    return this.loggedInEventStream;
  }

  /** Will send an event that the session has timed out. */
  public getSessionTimedOutEventStream(): Observable<IMessage> {
    return this.sessionTimedOutEventStream;
  }

  /** Logs out if the user sends a log out command or the session times out. */
  public getLoggedOutEventStream(): Observable<IMessage> {
    return this.loggedOutEventStream;
  }
}
