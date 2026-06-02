import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export type UserRole = 'operator' | 'supervisor' | 'admin';

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: UserRole;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): void {
    User.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING(100), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        password: { type: DataTypes.STRING(255), allowNull: false },
        role: {
          type: DataTypes.ENUM('operator', 'supervisor', 'admin'),
          allowNull: false,
          defaultValue: 'operator',
        },
      },
      { sequelize, tableName: 'Users', timestamps: true }
    );
  }

  static associate(): void {
    // defined in sequelize.ts after all models init
  }
}
