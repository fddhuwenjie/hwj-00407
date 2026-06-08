import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class Assignment extends Model {
  declare id: number;
  declare lessonId: number;
  declare description: string;
  declare dueDate: Date;
  declare maxScore: number;
  declare allowLateSubmission: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Assignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lessons',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    maxScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    allowLateSubmission: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Assignment',
    tableName: 'assignments',
  }
);

export default Assignment;
