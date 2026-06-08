import { DataTypes, Model } from 'sequelize';
import sequelize from '../database.js';

class GroupDiscussionReply extends Model {
  declare id: number;
  declare discussionId: number;
  declare userId: number;
  declare content: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

GroupDiscussionReply.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    discussionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'group_discussions',
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
    modelName: 'GroupDiscussionReply',
    tableName: 'group_discussion_replies',
  }
);

export default GroupDiscussionReply;
