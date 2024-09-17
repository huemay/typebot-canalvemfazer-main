import Setting from "../models/Setting";

export const showHubToken = async (): Promise<string | any> => {
  const notificameHubToken = await Setting.findOne({
    where: {
      key: "hubToken"
    }
  });

  if (!notificameHubToken) {
    throw new Error("Notificame Hub token not found");
  }

  if(notificameHubToken) {
    return notificameHubToken.value;
  }
};