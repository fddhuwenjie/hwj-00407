import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class Enrollment extends Model {
  declare id: number;
  declare userId: number;
  declare courseId: number;
  declare enrolledAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Enrollment.init(
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
    enrolledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Enrollment',
    tableName: 'enrollments',
  }
);

export default Enrollment;
