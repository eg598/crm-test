import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

interface TicketAttributes {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  deadline: Date | null;
  clientId: number | null;
  assignedUserId: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TicketCreationAttributes
  extends Optional<
    TicketAttributes,
    'id' | 'description' | 'category' | 'priority' | 'status' | 'deadline' | 'clientId' | 'assignedUserId'
  > {}

export class Ticket
  extends Model<TicketAttributes, TicketCreationAttributes>
  implements TicketAttributes
{
  public id!: number;
  public title!: string;
  public description!: string | null;
  public category!: string | null;
  public priority!: TicketPriority;
  public status!: TicketStatus;
  public deadline!: Date | null;
  public clientId!: number | null;
  public assignedUserId!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): void {
    Ticket.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        title: { type: DataTypes.STRING(500), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        category: { type: DataTypes.STRING(100), allowNull: true },
        priority: {
          type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
          allowNull: false,
          defaultValue: 'medium',
        },
        status: {
          type: DataTypes.ENUM('new', 'in_progress', 'waiting', 'resolved', 'closed'),
          allowNull: false,
          defaultValue: 'new',
        },
        deadline: { type: DataTypes.DATE, allowNull: true },
        clientId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'Clients', key: 'id' },
          onDelete: 'SET NULL',
        },
        assignedUserId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onDelete: 'SET NULL',
        },
      },
      { sequelize, tableName: 'Tickets', timestamps: true }
    );
  }

  static associate(): void {}
}
