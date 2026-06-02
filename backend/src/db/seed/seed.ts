import 'dotenv/config';
import { sequelize, User, Client, Ticket, TicketHistory } from '../sequelize';
import { hashPassword } from '../../utils/hash';
import { TicketPriority, TicketStatus } from '../models/Ticket';

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  console.log('Clearing existing data...');
  await TicketHistory.destroy({ where: {} });
  await Ticket.destroy({ where: {} });
  await Client.destroy({ where: {} });
  await User.destroy({ where: {} });

  console.log('Creating users...');
  const [admin, supervisor, operator1, operator2] = await Promise.all([
    User.create({ name: 'Admin User', email: 'admin@desk.com', password: await hashPassword('admin123'), role: 'admin' }),
    User.create({ name: 'Super Visor', email: 'supervisor@desk.com', password: await hashPassword('supervisor123'), role: 'supervisor' }),
    User.create({ name: 'John Operator', email: 'operator1@desk.com', password: await hashPassword('operator123'), role: 'operator' }),
    User.create({ name: 'Jane Operator', email: 'operator2@desk.com', password: await hashPassword('operator123'), role: 'operator' }),
  ]);

  console.log('Creating clients...');
  const clients = await Client.bulkCreate([
    { name: 'Acme Corporation', contactPerson: 'Tom Smith', email: 'tom@acme.com', phone: '+1-555-0101', address: '100 Main St, NYC', comment: 'Premium client' },
    { name: 'Globex Inc', contactPerson: 'Alice Brown', email: 'alice@globex.com', phone: '+1-555-0102', address: '200 Oak Ave, LA' },
    { name: 'Initech', contactPerson: 'Bob Wilson', email: 'bob@initech.com', phone: '+1-555-0103', address: '300 Pine Rd, Chicago' },
    { name: 'Umbrella Corp', contactPerson: 'Carol Davis', email: 'carol@umbrella.com', phone: '+1-555-0104', address: '400 Elm St, Houston' },
    { name: 'Stark Industries', contactPerson: 'Dave Miller', email: 'dave@stark.com', phone: '+1-555-0105', address: '500 Maple Dr, Miami', comment: 'VIP account' },
  ]);

  const now = new Date();
  const pastDate = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000);
  const futureDate = (daysAhead: number) => new Date(now.getTime() + daysAhead * 86400000);

  console.log('Creating tickets...');
  const ticketData = [
    { title: 'Login page not loading', description: 'Users cannot access the login page', category: 'Bug', priority: 'critical' as const, status: 'new' as const, clientId: clients[0].id, assignedUserId: operator1.id, deadline: futureDate(1) },
    { title: 'Export to CSV feature request', description: 'Need ability to export ticket list to CSV', category: 'Feature', priority: 'low' as const, status: 'new' as const, clientId: clients[1].id, assignedUserId: operator1.id, deadline: futureDate(14) },
    { title: 'Dashboard slow performance', description: 'Dashboard takes 10s to load', category: 'Performance', priority: 'high' as const, status: 'in_progress' as const, clientId: clients[0].id, assignedUserId: operator1.id, deadline: futureDate(3) },
    { title: 'Email notifications not sending', description: 'System emails going to spam', category: 'Bug', priority: 'high' as const, status: 'in_progress' as const, clientId: clients[2].id, assignedUserId: operator2.id, deadline: futureDate(2) },
    { title: 'Mobile layout broken on iOS', description: 'Navigation menu overlaps content on iPhone', category: 'Bug', priority: 'medium' as const, status: 'waiting' as const, clientId: clients[1].id, assignedUserId: operator2.id, deadline: futureDate(7) },
    { title: 'Add dark mode support', description: 'Users requesting dark mode option', category: 'Feature', priority: 'low' as const, status: 'waiting' as const, clientId: clients[3].id, assignedUserId: operator1.id, deadline: futureDate(30) },
    { title: 'Password reset link expired', description: 'Reset link expires too quickly', category: 'Bug', priority: 'medium' as const, status: 'resolved' as const, clientId: clients[4].id, assignedUserId: operator2.id, deadline: pastDate(2) },
    { title: 'Report generation fails', description: 'Monthly report cannot be generated', category: 'Bug', priority: 'critical' as const, status: 'resolved' as const, clientId: clients[0].id, assignedUserId: operator1.id, deadline: pastDate(5) },
    { title: 'Add search functionality', description: 'Global search across all entities', category: 'Feature', priority: 'medium' as const, status: 'closed' as const, clientId: clients[2].id, assignedUserId: operator2.id, deadline: pastDate(10) },
    { title: 'Database backup failure', description: 'Nightly backup job fails silently', category: 'Infrastructure', priority: 'critical' as const, status: 'new' as const, clientId: clients[3].id, assignedUserId: operator1.id, deadline: futureDate(1) },
    { title: 'User profile picture upload broken', description: 'Cannot upload JPG files larger than 1MB', category: 'Bug', priority: 'medium' as const, status: 'new' as const, clientId: clients[4].id, assignedUserId: operator2.id, deadline: futureDate(5) },
    { title: 'API rate limiting needed', description: 'Implement rate limiting on public endpoints', category: 'Security', priority: 'high' as const, status: 'in_progress' as const, clientId: clients[0].id, assignedUserId: operator1.id, deadline: futureDate(7) },
    { title: 'Payment gateway integration', description: 'Integrate Stripe for subscription billing', category: 'Feature', priority: 'high' as const, status: 'in_progress' as const, clientId: clients[1].id, assignedUserId: operator2.id, deadline: futureDate(10) },
    { title: 'Two-factor authentication', description: 'Add 2FA via SMS or authenticator app', category: 'Security', priority: 'high' as const, status: 'waiting' as const, clientId: clients[2].id, assignedUserId: operator1.id, deadline: futureDate(14) },
    { title: 'Outdated SSL certificate', description: 'SSL cert expires in 3 days', category: 'Infrastructure', priority: 'critical' as const, status: 'new' as const, clientId: clients[3].id, assignedUserId: operator2.id, deadline: futureDate(3) },
    { title: 'Data import wizard', description: 'Bulk import clients from Excel/CSV', category: 'Feature', priority: 'medium' as const, status: 'new' as const, clientId: clients[4].id, assignedUserId: operator1.id, deadline: futureDate(21) },
    { title: 'Charts not rendering in Firefox', description: 'Dashboard charts blank in Firefox 120+', category: 'Bug', priority: 'medium' as const, status: 'in_progress' as const, clientId: clients[0].id, assignedUserId: operator2.id, deadline: futureDate(4) },
    { title: 'Session timeout too short', description: 'Users get logged out after 15 minutes of inactivity', category: 'UX', priority: 'low' as const, status: 'resolved' as const, clientId: clients[1].id, assignedUserId: operator1.id, deadline: pastDate(3) },
    { title: 'Localization support', description: 'Add Spanish and French language support', category: 'Feature', priority: 'low' as const, status: 'closed' as const, clientId: clients[2].id, assignedUserId: operator2.id, deadline: pastDate(15) },
    { title: 'Memory leak in background job', description: 'Worker process grows to 2GB after 24h', category: 'Bug', priority: 'critical' as const, status: 'in_progress' as const, clientId: clients[3].id, assignedUserId: operator1.id, deadline: pastDate(1) },
  ];

  const typedTicketData = ticketData as Array<{
    title: string;
    description: string;
    category: string;
    priority: TicketPriority;
    status: TicketStatus;
    clientId: number;
    assignedUserId: number;
    deadline: Date;
  }>;
  const tickets = await Ticket.bulkCreate(typedTicketData);

  console.log('Creating ticket history...');
  const historyData = tickets.map((ticket) => ({
    ticketId: ticket.id,
    action: `Ticket created`,
    userId: supervisor.id,
    timestamp: ticket.createdAt,
  }));

  await TicketHistory.bulkCreate([
    ...historyData,
    { ticketId: tickets[2].id, action: 'Status changed from "new" to "in_progress" by John Operator', userId: operator1.id, timestamp: new Date() },
    { ticketId: tickets[3].id, action: 'Status changed from "new" to "in_progress" by Jane Operator', userId: operator2.id, timestamp: new Date() },
    { ticketId: tickets[6].id, action: 'Status changed from "in_progress" to "resolved" by Jane Operator', userId: operator2.id, timestamp: new Date() },
    { ticketId: tickets[7].id, action: 'Status changed from "in_progress" to "resolved" by John Operator', userId: operator1.id, timestamp: new Date() },
    { ticketId: tickets[0].id, action: `Reassigned from "unassigned" to "John Operator" by Super Visor`, userId: supervisor.id, timestamp: new Date() },
  ]);

  console.log(`Seeded: ${await User.count()} users, ${await Client.count()} clients, ${await Ticket.count()} tickets`);
  console.log('Done!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
