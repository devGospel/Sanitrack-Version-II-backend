import {Logger} from "./logger";
export const createChildLogger = (name: string) => {
    return Logger.child({ label: name }); // Set module name as label
  };