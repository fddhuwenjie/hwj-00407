import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class Chapter extends Model {
  declare id: number;
  declare courseId: number;
  declare title: string;
  declare order: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Chapter.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Chapter',
    tableName: 'chapters',
  }
);

export default Chapter;
