import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class AssignmentSubmission extends Model {
  declare id: number;
  declare assignmentId: number;
  declare userId: number;
  declare content: string;
  declare score?: number;
  declare feedback?: string;
  declare submittedAt: Date;
  declare gradedAt?: Date;
  declare status: 'not_submitted' | 'submitted' | 'graded' | 'late';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AssignmentSubmission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assignmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'assignments',
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('not_submitted', 'submitted', 'graded', 'late'),
      allowNull: false,
      defaultValue: 'submitted',
    },
  },
  {
    sequelize,
    modelName: 'AssignmentSubmission',
    tableName: 'assignment_submissions',
  }
);

export default AssignmentSubmission;
