export interface IDb {
  none(q: string, v: any[]): Promise<any>;
  one(q: string, v: any[]): Promise<any>;
  getState(): any;
}
