import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class Note extends Model {
  declare id: number;
  declare userId: number;
  declare courseId: number;
  declare lessonId: number;
  declare content: string;
  declare timePoint?: number;
  declare tag: 'normal' | 'important' | 'question';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Note.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timePoint: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time point in seconds for video lessons',
    },
    tag: {
      type: DataTypes.ENUM('normal', 'important', 'question'),
      allowNull: false,
      defaultValue: 'normal',
    },
  },
  {
    sequelize,
    modelName: 'Note',
    tableName: 'notes',
  }
);

export default Note;
