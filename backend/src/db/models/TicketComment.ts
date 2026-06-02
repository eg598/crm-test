import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface TicketCommentAttributes {
  id: number;
  ticketId: number;
  userId: number;
  body: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TicketCommentCreationAttributes
  extends Optional<TicketCommentAttributes, 'id'> {}

export class TicketComment
  extends Model<TicketCommentAttributes, TicketCommentCreationAttributes>
  implements TicketCommentAttributes
{
  public id!: number;
  public ticketId!: number;
  public userId!: number;
  public body!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): void {
    TicketComment.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        ticketId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Tickets', key: 'id' },
          onDelete: 'CASCADE',
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
        },
        body: { type: DataTypes.TEXT, allowNull: false },
      },
      { sequelize, tableName: 'TicketComments', timestamps: true }
    );
  }

  static associate(): void {}
}
