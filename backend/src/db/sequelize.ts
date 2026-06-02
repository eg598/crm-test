import { Sequelize } from 'sequelize';
import { User } from './models/User';
import { Client } from './models/Client';
import { Ticket } from './models/Ticket';
import { TicketHistory } from './models/TicketHistory';
import { TicketComment } from './models/TicketComment';

const {
  DB_NAME = 'servicedesk',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_HOST = 'localhost',
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'postgres',
  logging: false,
});

User.initModel(sequelize);
Client.initModel(sequelize);
Ticket.initModel(sequelize);
TicketHistory.initModel(sequelize);
TicketComment.initModel(sequelize);

// Associations
User.hasMany(Ticket, { foreignKey: 'assignedUserId', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assignedUserId', as: 'assignedUser' });

Client.hasMany(Ticket, { foreignKey: 'clientId', as: 'tickets' });
Ticket.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

Ticket.hasMany(TicketHistory, { foreignKey: 'ticketId', as: 'history' });
TicketHistory.belongsTo(Ticket, { foreignKey: 'ticketId' });

User.hasMany(TicketHistory, { foreignKey: 'userId', as: 'historyEntries' });
TicketHistory.belongsTo(User, { foreignKey: 'userId', as: 'actor' });

Ticket.hasMany(TicketComment, { foreignKey: 'ticketId', as: 'comments' });
TicketComment.belongsTo(Ticket, { foreignKey: 'ticketId' });

User.hasMany(TicketComment, { foreignKey: 'userId', as: 'comments' });
TicketComment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

export { User, Client, Ticket, TicketHistory, TicketComment };
