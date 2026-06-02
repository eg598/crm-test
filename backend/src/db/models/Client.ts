import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface ClientAttributes {
  id: number;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  comment: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClientCreationAttributes extends Optional<ClientAttributes, 'id' | 'contactPerson' | 'email' | 'phone' | 'address' | 'comment'> {}

export class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
  public id!: number;
  public name!: string;
  public contactPerson!: string | null;
  public email!: string | null;
  public phone!: string | null;
  public address!: string | null;
  public comment!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): void {
    Client.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING(200), allowNull: false },
        contactPerson: { type: DataTypes.STRING(200), allowNull: true },
        email: { type: DataTypes.STRING(255), allowNull: true },
        phone: { type: DataTypes.STRING(50), allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        comment: { type: DataTypes.TEXT, allowNull: true },
      },
      { sequelize, tableName: 'Clients', timestamps: true }
    );
  }

  static associate(): void {}
}
