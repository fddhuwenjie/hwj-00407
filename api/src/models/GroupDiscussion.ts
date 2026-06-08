import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class GroupDiscussion extends Model {
  declare id: number;
  declare groupId: number;
  declare userId: number;
  declare title: string;
  declare content: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

GroupDiscussion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'study_groups',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'GroupDiscussion',
    tableName: 'group_discussions',
  }
);

export default GroupDiscussion;
