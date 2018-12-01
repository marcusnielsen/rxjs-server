import { User } from "./model";
import { Db } from "../../drivers/db";
import { Subject } from "rxjs";
import { IMessage } from "../../types";
import uuidV4 from "uuid/v4";
import { take } from "rxjs/operators";

function setup(sessionTimeout?: number) {
  const logInCommandSubject = new Subject<IMessage>();
  const logOutCommandSubject = new Subject<IMessage>();
  const db = new Db();
  const model = new User(
    db,
    logInCommandSubject,
    logOutCommandSubject,
    sessionTimeout
  );
  const uuidSeed = Array(16).fill(1);

  return {
    uuidSeed,
    model,
    db,
    logInCommandSubject,
    logOutCommandSubject
  };
}

test("user logs in", async () => {
  const { uuidSeed, db, model, logInCommandSubject } = setup();

  const resultP = model
    .getLoggedInEventStream()
    .pipe(take(1))
    .toPromise();

  logInCommandSubject.next({
    meta: { cid: uuidV4({ random: uuidSeed }) },
    payload: { name: "moa", password: "password1" }
  });

  const result = await resultP;

  expect(result).toEqual({
    meta: { cid: "01010101-0101-4101-8101-010101010101" },
    payload: { name: "moa", password: "password1" }
  });

  const persistedResult = db.getState().users.find(user => user.name === "moa");
  expect(persistedResult).toEqual({
    name: "moa",
    password: "password1",
    logged_in: true
  });
});

test("user logs out", async () => {
  const { db, model, logOutCommandSubject, uuidSeed } = setup();

  const resultP = model
    .getLoggedOutEventStream()
    .pipe(take(1))
    .toPromise();

  logOutCommandSubject.next({
    meta: { cid: uuidV4({ random: uuidSeed }) },
    payload: { name: "moa" }
  });

  const result = await resultP;

  expect(result).toEqual({
    meta: { cid: "01010101-0101-4101-8101-010101010101" },
    payload: { name: "moa" }
  });

  const persistedResult = db.getState().users.find(user => user.name === "moa");
  expect(persistedResult).toEqual({
    name: "moa",
    password: "password1",
    logged_in: false
  });
});

test("user session times out", async () => {
  const { db, model, logInCommandSubject, uuidSeed } = setup(0);

  const sessionResultP = model
    .getSessionTimedOutEventStream()
    .pipe(take(1))
    .toPromise();

  const loggedOutResultP = model
    .getLoggedOutEventStream()
    .pipe(take(1))
    .toPromise();

  logInCommandSubject.next({
    meta: { cid: uuidV4({ random: uuidSeed }) },
    payload: { name: "moa", password: "password1" }
  });

  const sessionResult = await sessionResultP;

  expect(sessionResult).toEqual({
    meta: { cid: "01010101-0101-4101-8101-010101010101" },
    payload: { name: "moa" }
  });

  const loggedOutResult = await loggedOutResultP;

  expect(loggedOutResult).toEqual({
    meta: { cid: "01010101-0101-4101-8101-010101010101" },
    payload: { name: "moa" }
  });

  const persistedResult = db.getState().users.find(user => user.name === "moa");
  expect(persistedResult).toEqual({
    name: "moa",
    password: "password1",
    logged_in: false
  });
});
