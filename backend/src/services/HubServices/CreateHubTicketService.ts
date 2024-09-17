import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import ShowContactService from "../ContactServices/ShowContactService"; // Apenas uma vez
import User from "../../models/User";
import { getIO } from "../../libs/socket";
import Whatsapp from "../../models/Whatsapp";
import GetDefaultWhatsAppByUser from "../../helpers/GetDefaultWhatsAppByUser";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";


interface Request {
  contactId: number;
  status: string;
  userId: number;
  queueId ?: number;
  companyId: number;
  channel: string;
}

const CreateTicketService = async ({
  contactId,
  status,
  userId,
  queueId,
  companyId,
  channel
}: Request): Promise<Ticket> => {

  let connectionType

  if(channel === 'instagram' || channel === 'facebook') {
    connectionType = 'facebook'
  }

  console.log('channel', channel)
  console.log('connectionType', connectionType)

  const connection = await Whatsapp.findOne({
    where: { type: connectionType! }
  });

  if (!connection) {
    throw new Error("Connection id not found");
  }

  await CheckContactOpenTickets(contactId);

  const { isGroup } = await ShowContactService(contactId, companyId);

  if(queueId === undefined) {
    const user = await User.findByPk(userId, { include: ["queues"]});
    queueId = user?.queues.length === 1 ? user.queues[0].id : undefined;
  }

  const newTicket = await Ticket.create({
    status,
    lastMessage: null,
    contactId,
    isGroup,
    whatsappId: connection.id
  });

  const ticket = await Ticket.findByPk(newTicket.id, { include: ["contact"] });

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  return ticket;
};

export default CreateTicketService;