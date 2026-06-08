import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class DiscussionPost extends Model {
  declare id: number;
  declare courseId: number;
  declare userId: number;
  declare title: string;
  declare content: string;
  declare isPinned: boolean;
  declare isFeatured: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DiscussionPost.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'DiscussionPost',
    tableName: 'discussion_posts',
  }
);

export default DiscussionPost;
