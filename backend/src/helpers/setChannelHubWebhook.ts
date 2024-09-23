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

  const url = `https://07ad-2804-2c0-c0ba-2700-1446-e9ff-fe63-e26d.ngrok-free.app/hub-webhook/${whatsapp.qrcode}`;

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