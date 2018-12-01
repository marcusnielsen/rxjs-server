import { IDb } from "../../drivers/db";
import { Observable } from "rxjs";
import { concatMap } from "rxjs/operators";
import { IMessage } from "../../types";

export class User {
  constructor(
    private db: IDb,
    private logInCommandStream: Observable<IMessage>,
    private logOutCommandStream: Observable<IMessage>
  ) {}

  public loggedInEventStream(): Observable<IMessage> {
    return this.logInCommandStream.pipe(
      concatMap(async action => {
        await this.db.none("update users set logged_in = $0 where name = $1", [
          true,
          action.payload.name
        ]);
        return action;
      })
    );
  }

  public loggedOutEventStream(): Observable<IMessage> {
    return this.logOutCommandStream.pipe(
      concatMap(async action => {
        await this.db.none("update users set logged_in = $0 where name = $1", [
          false,
          action.payload.name
        ]);
        return action;
      })
    );
  }
}
