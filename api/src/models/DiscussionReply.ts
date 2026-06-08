import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class DiscussionReply extends Model {
  declare id: number;
  declare postId: number;
  declare userId: number;
  declare content: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DiscussionReply.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'discussion_posts',
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
  },
  {
    sequelize,
    modelName: 'DiscussionReply',
    tableName: 'discussion_replies',
  }
);

export default DiscussionReply;
