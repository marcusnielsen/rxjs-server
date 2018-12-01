import { main } from "./main";
import { Db } from "./drivers/db";
import { Log } from "./drivers/log";
import { Subject, merge } from "rxjs";
import uuidV4 from "uuid/v4";
import { IMessage } from "./types";
import { PubSub } from "./drivers/pub-sub";
import { map } from "rxjs/operators";

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

merge(
  modules.user
    .getLoggedInEventStream()
    .pipe(map(msg => [`<${msg.payload.name}> logged in.`, msg.meta.cid])),

  modules.user
    .getLoggedOutEventStream()
    .pipe(map(msg => [`<${msg.payload.name}> logged out.`, msg.meta.cid])),

  modules.onlineStatus
    .getStatusUpdatedEventStream()
    .pipe(
      map(msg => [
        `<${msg.payload.name}> changed status to <${msg.payload.status}>.`,
        msg.meta.cid
      ])
    )
).forEach(([text, cid]) => {
  log.info(text, cid);
});

logInSubject.next({
  meta: { cid: uuidV4() },
  payload: { name: "moa", password: "password1" }
});
logOutSubject.next({ meta: { cid: uuidV4() }, payload: { name: "moa" } });
