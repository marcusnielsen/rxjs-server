import { main } from "./main";
import { Db } from "./drivers/db";
import { Log } from "./drivers/log";
import { Subject } from "rxjs";
import uuidV4 from "uuid/v4";
import { IMessage } from "./types";
import { PubSub } from "./drivers/pub-sub";

const db = new Db();
const pubSub = new PubSub();
const log = new Log();
const logInSubject = new Subject<IMessage>();
const logOutSubject = new Subject<IMessage>();

const modules = main(
  db,
  pubSub,
  logInSubject.asObservable(),
  logOutSubject.asObservable()
);

modules.user.loggedInEventStream().forEach((action: IMessage) => {
  // TODO: Continue here.
  log.info(`TODO: Message for loggedInEvent.`, action.meta.cid);
});

modules.onlineStatus.statusUpdatedEventStream().forEach((action: IMessage) => {
  log.info(
    `<${action.payload.name}> changed status to <${action.payload.status}>.`,
    action.meta.cid
  );
});

logInSubject.next({ meta: { cid: uuidV4() }, payload: { name: "moa" } });
logOutSubject.next({ meta: { cid: uuidV4() }, payload: { name: "moa" } });
