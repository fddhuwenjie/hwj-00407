import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class LearningProgress extends Model {
  declare id: number;
  declare userId: number;
  declare courseId: number;
  declare lessonId: number;
  declare completed: boolean;
  declare completedAt?: Date;
  declare timeSpent: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LearningProgress.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lessons',
        key: 'id',
      },
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Time spent in seconds',
    },
  },
  {
    sequelize,
    modelName: 'LearningProgress',
    tableName: 'learning_progress',
  }
);

export default LearningProgress;
