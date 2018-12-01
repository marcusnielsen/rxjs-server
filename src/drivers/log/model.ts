import { ILog } from ".";

export class Log implements ILog {
  public info(message: string, cid: string): void {
    console.log(`<${new Date()}> <${cid}>: ${message}`);
  }
}
