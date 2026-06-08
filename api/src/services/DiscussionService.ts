import { literal, fn, col } from 'sequelize';
import { DiscussionPost, DiscussionReply, User, Course } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { DiscussionPost as DiscussionPostType, DiscussionReply as DiscussionReplyType } from '../../../shared/types.js';

interface DiscussionPostWithMetadata extends DiscussionPostType {
  isUnreplied: boolean;
}

class DiscussionService {
  async getPosts(courseId: number): Promise<DiscussionPostWithMetadata[]> {
    try {
      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const posts = await DiscussionPost.findAll({
        where: { courseId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar'],
          },
        ],
        attributes: {
          include: [
            [
              literal(`(
                SELECT COUNT(*) 
                FROM discussion_replies 
                WHERE discussion_replies.postId = DiscussionPost.id
              )`),
              'replyCount',
            ],
          ],
        },
        order: [
          ['isPinned', 'DESC'],
          ['createdAt', 'DESC'],
        ],
      });

      return posts.map(post => {
        const replyCount = post.getDataValue('replyCount') || 0;
        return {
          ...post.toJSON(),
          _count: {
            replies: replyCount,
          },
          isUnreplied: replyCount === 0,
        } as DiscussionPostWithMetadata;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch discussion posts', 500);
    }
  }

  async createPost(
    userId: number,
    courseId: number,
    data: { title: string; content: string }
  ): Promise<DiscussionPostType> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const post = await DiscussionPost.create({
        userId,
        courseId,
        title: data.title,
        content: data.content,
        isPinned: false,
        isFeatured: false,
      });

      return post as unknown as DiscussionPostType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create discussion post', 500);
    }
  }

  async createReply(
    userId: number,
    postId: number,
    content: string
  ): Promise<DiscussionReplyType> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const post = await DiscussionPost.findByPk(postId);
      if (!post) {
        throw new AppError('Discussion post not found', 404);
      }

      const reply = await DiscussionReply.create({
        userId,
        postId,
        content,
      });

      return reply as unknown as DiscussionReplyType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create reply', 500);
    }
  }

  async toggleFeatured(postId: number): Promise<DiscussionPostType> {
    try {
      const post = await DiscussionPost.findByPk(postId);
      if (!post) {
        throw new AppError('Discussion post not found', 404);
      }

      await post.update({
        isFeatured: !post.isFeatured,
      });

      return post as unknown as DiscussionPostType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to toggle featured status', 500);
    }
  }

  async togglePinned(postId: number): Promise<DiscussionPostType> {
    try {
      const post = await DiscussionPost.findByPk(postId);
      if (!post) {
        throw new AppError('Discussion post not found', 404);
      }

      await post.update({
        isPinned: !post.isPinned,
      });

      return post as unknown as DiscussionPostType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to toggle pinned status', 500);
    }
  }

  async getUnrepliedPosts(courseId: number): Promise<DiscussionPostType[]> {
    try {
      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const posts = await DiscussionPost.findAll({
        where: { courseId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar'],
          },
          {
            model: DiscussionReply,
            as: 'replies',
            required: false,
          },
        ],
        having: literal('COUNT(replies.id) = 0'),
        group: ['DiscussionPost.id', 'user.id'],
        order: [['createdAt', 'DESC']],
      });

      return posts.map(post => ({
        ...post.toJSON(),
        _count: {
          replies: 0,
        },
      })) as unknown as DiscussionPostType[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch unreplied posts', 500);
    }
  }
}

export default new DiscussionService();
