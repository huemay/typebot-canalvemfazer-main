import Whatsapp from "../models/Whatsapp";
import { IChannel } from "../controllers/ChannelHubController";
import { showHubToken } from "./showHubToken";
const {
  Client,
  MessageSubscription
} = require("notificamehubsdk");
require("dotenv").config();

export const setChannelWebhook = async (
  whatsapp: IChannel | any,
  whatsappId: string
) => {
  const notificameHubToken = await showHubToken();

  const client = new Client(notificameHubToken);

  const url = `https://1bf1-2804-3d34-5009-5f01-00-2.ngrok-free.app/hub-webhook/${whatsapp.qrcode}`;

  const subscription = new MessageSubscription(
    {
      url
    },
    {
      channel: whatsapp.qrcode
    }
  );

  // client
  // .updateSubscription("subscription-identifier", subscription)
  client
    .createSubscription(subscription)
    .then((response: any) => {
      console.log("Webhook subscribed:", response);
    })
    .catch((error: any) => {
      console.log("Error:", error);
    });

  await Whatsapp.update(
    {
      status: "CONNECTED"
    },
    {
      where: {
        id: whatsappId
      }
    }
  );
};