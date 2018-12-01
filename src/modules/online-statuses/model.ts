import { IDb } from "../../drivers/db";
import { Observable } from "rxjs";
import { concatMap, share } from "rxjs/operators";
import { IMessage } from "../../types";

export class OnlineStatus {
  private statusUpdatedEventStream: Observable<IMessage>;

  constructor(
    private db: IDb,
    private updateOnlineStatusCommandStream: Observable<IMessage>
  ) {
    this.statusUpdatedEventStream = this.updateOnlineStatusCommandStream.pipe(
      concatMap(async action => {
        await this.db.none(
          "update online_statuses set status = $0 where name = $1",
          [action.payload.status, action.payload.name]
        );
        return action;
      }),
      share()
    );
  }

  public getStatusUpdatedEventStream(): Observable<IMessage> {
    return this.statusUpdatedEventStream;
  }
}
