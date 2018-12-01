import { OnlineStatus, User } from "./modules";
import { IDb } from "./drivers/db";
import { Observable, merge } from "rxjs";
import { map } from "rxjs/operators";
import { ILog } from "./drivers/log";
import { IMessage } from "./types";
import { IPubSub } from "./drivers/pub-sub";

export function main(
  db: IDb,
  pubSub: IPubSub,
  userLogInStream: Observable<IMessage>,
  userLogOutStream: Observable<IMessage>
) {
  const user = new User(db, userLogInStream, userLogOutStream);

  const updateOnlineStatusCommandStream = merge(
    user.getLoggedInEventStream().pipe(
      map(event => ({
        meta: { cid: event.meta.cid },
        payload: { name: event.payload.name, status: "logged_in" }
      }))
    ),
    user.getLoggedOutEventStream().pipe(
      map(event => ({
        meta: { cid: event.meta.cid },
        payload: { name: event.payload.name, status: "logged_out" }
      }))
    )
  );

  const onlineStatusSubscriptionStream = pubSub.subscription(
    "online_status_commands",
    "online_status_commands"
  );

  pubSub.publish(
    updateOnlineStatusCommandStream.pipe(
      map(command => ({ ...command, topic: "online_status_commands" }))
    )
  );

  const onlineStatus = new OnlineStatus(db, onlineStatusSubscriptionStream);

  return {
    user,
    onlineStatus
  };
}
