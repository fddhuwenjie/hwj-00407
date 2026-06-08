import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare role: 'student' | 'instructor';
  declare avatar?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.ENUM('student', 'instructor'),
      allowNull: false,
      defaultValue: 'student',
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);

export default User;
