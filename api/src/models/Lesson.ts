import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class Lesson extends Model {
  declare id: number;
  declare chapterId: number;
  declare title: string;
  declare type: 'video' | 'document' | 'quiz';
  declare content: string;
  declare order: number;
  declare duration?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Lesson.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chapters',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('video', 'document', 'quiz'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in minutes',
    },
  },
  {
    sequelize,
    modelName: 'Lesson',
    tableName: 'lessons',
  }
);

export default Lesson;
