import { WAMessage, AnyMessageContent } from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import mime from "mime-types";
import formatBody from "../../helpers/Mustache";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  body?: string;
}

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

const processAudio = async (audio: string, outputFormat = "mp3"): Promise<string> => {
  const outputAudio = `${publicFolder}/${new Date().getTime()}.${outputFormat}`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i ${audio} -vn -ar 44100 -ac 2 -b:a 192k ${outputAudio}`,
      (error, _stdout, _stderr) => {
        if (error) {
          reject(new AppError(`Error processing audio: ${error.message}`));
          return;
        }
        fs.unlinkSync(audio);  // Remove o arquivo original
        resolve(outputAudio);
      }
    );
  });
};

export const getMessageOptions = async (
  fileName: string,
  pathMedia: string,
  body?: string
): Promise<AnyMessageContent | null> => {
  const mimeType = mime.lookup(pathMedia);
  if (!mimeType) {
    Sentry.captureException(new Error("Invalid mimetype"));
    return null;
  }

  const typeMessage = mimeType.split("/")[0];
  let options: AnyMessageContent;

  try {
    switch (typeMessage) {
      case "video":
        options = {
          video: fs.readFileSync(pathMedia),
          caption: body || '',
          fileName
        };
        break;
      case "audio":
        const convertedAudio = await processAudio(pathMedia);
        options = {
          audio: fs.readFileSync(convertedAudio),
          mimetype: "audio/mp4",
          ptt: true
        };
        break;
      case "document":
      case "application":
        options = {
          document: fs.readFileSync(pathMedia),
          caption: body || '',
          fileName,
          mimetype: mimeType
        };
        break;
      default:
        options = {
          image: fs.readFileSync(pathMedia),
          caption: body || ''
        };
        break;
    }

    return options;
  } catch (e) {
    Sentry.captureException(e);
    return null;
  }
};

const SendWhatsAppMedia = async ({
  media,
  ticket,
  body
}: Request): Promise<WAMessage> => {
  try {
    const wbot = await GetTicketWbot(ticket);
    const pathMedia = media.path;
    const bodyMessage = formatBody(body, ticket.contact);

    const options = await getMessageOptions(media.originalname, pathMedia, bodyMessage);

    if (!options) {
      throw new AppError("Invalid media options");
    }

    const sentMessage = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      options
    );

    await ticket.update({ lastMessage: bodyMessage });

    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;
