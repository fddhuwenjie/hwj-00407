import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class QuizQuestion extends Model {
  declare id: number;
  declare lessonId: number;
  declare type: 'single' | 'multiple' | 'boolean';
  declare question: string;
  declare options: string;
  declare correctAnswers: string;
  declare explanation: string;
  declare order: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

QuizQuestion.init(
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
    type: {
      type: DataTypes.ENUM('single', 'multiple', 'boolean'),
      allowNull: false,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue('options');
        return raw ? JSON.parse(raw) : [];
      },
      set(value: string[]) {
        this.setDataValue('options', JSON.stringify(value));
      },
    },
    correctAnswers: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue('correctAnswers');
        return raw ? JSON.parse(raw) : [];
      },
      set(value: number[]) {
        this.setDataValue('correctAnswers', JSON.stringify(value));
      },
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'QuizQuestion',
    tableName: 'quiz_questions',
  }
);

export default QuizQuestion;
