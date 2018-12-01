import { IDb } from "../../drivers/db";
import { Observable } from "rxjs";
import { concatMap } from "rxjs/operators";
import { IMessage } from "../../types";

export class OnlineStatus {
  constructor(
    private db: IDb,
    private updateOnlineStatusCommandStream: Observable<IMessage>
  ) {}

  public statusUpdatedEventStream(): Observable<IMessage> {
    return this.updateOnlineStatusCommandStream.pipe(
      concatMap(async action => {
        await this.db.none(
          "update online_statuses set status = $0 where name = $1",
          [action.payload.status, action.payload.name]
        );
        return action;
      })
    );
  }
}
