import { OnlineStatus } from "./model";
import { Db } from "../../drivers/db";
import { Subject } from "rxjs";
import { IMessage } from "../../types";
import uuidV4 from "uuid/v4";
import { take } from "rxjs/operators";

function setup() {
  const updateStatusCommandSubject = new Subject<IMessage>();
  const model = new OnlineStatus(new Db(), updateStatusCommandSubject);
  const uuidSeed = Array(16).fill(1);
  return { model, updateStatusCommandSubject, uuidSeed };
}

test("status updated to <logged_in>", async () => {
  const { model, updateStatusCommandSubject, uuidSeed } = setup();

  const resultP = model
    .statusUpdatedEventStream()
    .pipe(take(1))
    .toPromise();

  updateStatusCommandSubject.next({
    meta: { cid: uuidV4({ random: uuidSeed }) },
    payload: { name: "moa", status: "logged_in" }
  });

  const result = await resultP;

  expect(result).toEqual({
    meta: { cid: "01010101-0101-4101-8101-010101010101" },
    payload: { name: "moa", status: "logged_in" }
  });
});
