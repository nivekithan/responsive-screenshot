import { EMPTY_USER, emptyUserData } from "./emptyUser";

export const ALL_USERS = [EMPTY_USER];

export const ALL_DATA = [emptyUserData];

export function getData(userId: string) {
  const data = ALL_DATA.find((v) => v.userObj.userId === userId);

  if (!data) {
    throw new Error(`There is no data for user with id ${userId}`);
  }
  return data || null;
}
