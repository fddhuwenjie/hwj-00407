import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class GroupGoal extends Model {
  declare id: number;
  declare groupId: number;
  declare weekStart: Date;
  declare lessonsToComplete: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

GroupGoal.init(
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
    weekStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    lessonsToComplete: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
  },
  {
    sequelize,
    modelName: 'GroupGoal',
    tableName: 'group_goals',
  }
);

export default GroupGoal;
