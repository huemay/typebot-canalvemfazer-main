import Whatsapp from "../../models/Whatsapp";
import { downloadFiles } from "../../helpers/downloadHubFiles";
import CreateMessageService from "./CreateHubMessageService";
import CreateOrUpdateTicketService from "./CreateOrUpdateHubTicketService";
import FindOrCreateContactService from "./FindOrCreateHubContactService";
import { UpdateMessageAck } from "./UpdateMessageHubAck";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";

export interface HubInMessage {
  type: "MESSAGE";
  id: string;
  timestamp: string;
  subscriptionId: string;
  
  channel: "telegram" | "whatsapp" | "facebook" | "instagram" | "sms" | "email";
  direction: "IN";
  message: {
    id: string;
    from: string;
    to: string;
    direction: "IN";
    channel:
      | "telegram"
      | "whatsapp"
      | "facebook"
      | "instagram"
      | "sms"
      | "email";
    visitor: {
      name: string;
      firstName: string;
      lastName: string;
      picture: string;
    };
    contents: IContent[];
    timestamp: string;
    companyId?: number;
  };
}

export interface IContent {
  type: "text" | "image" | "audio" | "video" | "file" | "location";
  text?: string;
  url?: string;
  fileUrl?: string;
  latitude?: number;
  longitude?: number;
  filename?: string;
  fileSize?: number;
  fileMimeType?: string;
}

export interface HubConfirmationSentMessage {
  type: "MESSAGE_STATUS";
  timestamp: string;
  subscriptionId: string;
  channel: "telegram" | "whatsapp" | "facebook" | "instagram" | "sms" | "email";
  messageId: string;
  contentIndex: number;
  messageStatus: {
    timestamp: string;
    code: "SENT" | "REJECTED";
    description: string;
  };
}

const verifySentMessageStatus = (message: HubConfirmationSentMessage) => {
  const {
    messageStatus: { code }
  } = message;

  const isMessageSent = code === "SENT";

  if (isMessageSent) {
    return true;
  }

  return false;
};

const HubMessageListener = async (
  message: any | HubInMessage | HubConfirmationSentMessage,
  whatsapp: Whatsapp,
  medias: Express.Multer.File[],
  
) => {
  console.log("HubMessageListener", message);
  console.log("contents", message.message.contents);

  if (message.direction === 'IN') {
    message.fromMe = false;
  }

  const ignoreEvent = message.direction === 'OUT';
  if (ignoreEvent) {
    return;
  }

  const isMessageFromMe = message.type === "MESSAGE_STATUS";

  if (isMessageFromMe) {
    const isMessageSent = verifySentMessageStatus(
      message as HubConfirmationSentMessage
    );

    if (isMessageSent) {
      console.log("HubMessageListener: message sent");
      UpdateMessageAck(message.messageId);
    } else {
      console.log(
        "HubMessageListener: message not sent",
        message.messageStatus.code,
        message.messageStatus.description
      );
    }

    return;
  }

  const {
    message: { id, from, channel, contents, visitor,companyId }
  } = message as HubInMessage;

  try {
    const contact = await FindOrCreateContactService({
      ...visitor,
      from,
      whatsapp,
      channel
      
      
    });

    const unreadMessages = 1;

    const ticket = await FindOrCreateTicketService(
      contact,
      whatsapp.id!,
      unreadMessages,
      companyId
    );

    if (contents[0]?.type === "text") {
      await CreateMessageService({
        id,
        contactId: contact.id,
        body: contents[0].text || "",
        ticketId: ticket.id,
        fromMe: false,
      });
    } else if (contents[0]?.fileUrl) {
      const media = await downloadFiles(contents[0].fileUrl);

      if (typeof media.mimeType === "string") {
        await CreateMessageService({
          id,
          contactId: contact.id,
          body: contents[0].text || '',
          ticketId: ticket.id,
          fromMe: false,
          fileName: `${media.filename}`,
          mediaType: media.mimeType.split("/")[0],
          originalName: media.originalname
        });
      }
    }
  } catch (error: any) {
    console.log(error);
  }
};

export default HubMessageListener;
