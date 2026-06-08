import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class StudyGroup extends Model {
  declare id: number;
  declare name: string;
  declare description: string;
  declare courseId: number;
  declare maxMembers: number;
  declare createdBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StudyGroup.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'StudyGroup',
    tableName: 'study_groups',
  }
);

export default StudyGroup;
