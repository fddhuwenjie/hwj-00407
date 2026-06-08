import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class QuizAttempt extends Model {
  declare id: number;
  declare userId: number;
  declare lessonId: number;
  declare score: number;
  declare answers: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

QuizAttempt.init(
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
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lessons',
        key: 'id',
      },
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Score in percentage (0-100)',
    },
    answers: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue('answers');
        return raw ? JSON.parse(raw) : {};
      },
      set(value: Record<number, number[]>) {
        this.setDataValue('answers', JSON.stringify(value));
      },
    },
  },
  {
    sequelize,
    modelName: 'QuizAttempt',
    tableName: 'quiz_attempts',
  }
);

export default QuizAttempt;
