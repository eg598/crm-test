import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface TicketHistoryAttributes {
  id: number;
  ticketId: number;
  action: string;
  userId: number | null;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TicketHistoryCreationAttributes
  extends Optional<TicketHistoryAttributes, 'id' | 'userId' | 'timestamp'> {}

export class TicketHistory
  extends Model<TicketHistoryAttributes, TicketHistoryCreationAttributes>
  implements TicketHistoryAttributes
{
  public id!: number;
  public ticketId!: number;
  public action!: string;
  public userId!: number | null;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): void {
    TicketHistory.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        ticketId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Tickets', key: 'id' },
          onDelete: 'CASCADE',
        },
        action: { type: DataTypes.TEXT, allowNull: false },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onDelete: 'SET NULL',
        },
        timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      { sequelize, tableName: 'TicketHistories', timestamps: true }
    );
  }

  static associate(): void {}
}
