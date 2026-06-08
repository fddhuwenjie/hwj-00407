import { col, literal, Op } from 'sequelize';
import {
  StudyGroup,
  GroupMember,
  GroupDiscussion,
  GroupDiscussionReply,
  GroupGoal,
  User,
  Course,
  LearningProgress,
  Lesson,
  Chapter,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';

class StudyGroupService {
  async createGroup(
    userId: number,
    data: { name: string; description: string; courseId: number; maxMembers: number }
  ) {
    try {
      const course = await Course.findByPk(data.courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const group = await StudyGroup.create({
        ...data,
        createdBy: userId,
      });

      await GroupMember.create({
        groupId: group.id,
        userId,
        role: 'admin',
        status: 'approved',
        joinedAt: new Date(),
      });

      return group;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create study group', 500);
    }
  }

  async getGroupsByCourse(courseId: number) {
    try {
      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const groups = await StudyGroup.findAll({
        where: { courseId },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'avatar'],
          },
        ],
        attributes: {
          include: [
            [
              literal(`(
                SELECT COUNT(*) 
                FROM group_members 
                WHERE group_members.groupId = StudyGroup.id 
                AND group_members.status = 'approved'
              )`),
              'memberCount',
            ],
          ],
        },
        order: [['createdAt', 'DESC']],
      });

      return groups.map((group) => ({
        ...group.toJSON(),
        _count: {
          members: group.getDataValue('memberCount') || 0,
        },
      }));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch groups by course', 500);
    }
  }

  async getGroupById(groupId: number) {
    try {
      const group = await StudyGroup.findByPk(groupId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'avatar'],
          },
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
          {
            model: GroupMember,
            as: 'members',
            where: { status: 'approved' },
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar'],
              },
            ],
          },
          {
            model: GroupDiscussion,
            as: 'discussions',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar'],
              },
              {
                model: GroupDiscussionReply,
                as: 'replies',
                include: [
                  {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'avatar'],
                  },
                ],
              },
            ],
            order: [['createdAt', 'DESC']],
          },
          {
            model: GroupGoal,
            as: 'goals',
            order: [['createdAt', 'DESC']],
          },
        ],
      });

      if (!group) {
        throw new AppError('Study group not found', 404);
      }

      return group;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch study group', 500);
    }
  }

  async joinGroup(userId: number, groupId: number) {
    try {
      const group = await StudyGroup.findByPk(groupId);
      if (!group) {
        throw new AppError('Study group not found', 404);
      }

      const existingMember = await GroupMember.findOne({
        where: { groupId, userId },
      });

      if (existingMember) {
        if (existingMember.status === 'approved') {
          throw new AppError('You are already a member of this group', 400);
        }
        if (existingMember.status === 'pending') {
          throw new AppError('Your membership request is already pending', 400);
        }
      }

      const memberCount = await GroupMember.count({
        where: { groupId, status: 'approved' },
      });

      if (memberCount >= group.maxMembers) {
        throw new AppError('Group is full', 400);
      }

      const membership = await GroupMember.create({
        groupId,
        userId,
        role: 'member',
        status: 'pending',
        joinedAt: new Date(),
      });

      return membership;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to join study group', 500);
    }
  }

  async approveMember(groupId: number, userId: number, adminId: number) {
    try {
      const group = await StudyGroup.findByPk(groupId);
      if (!group) {
        throw new AppError('Study group not found', 404);
      }

      const admin = await GroupMember.findOne({
        where: { groupId, userId: adminId, role: 'admin', status: 'approved' },
      });

      if (!admin) {
        throw new AppError('Only group admin permission required', 403);
      }

      const member = await GroupMember.findOne({
        where: { groupId, userId, status: 'pending' },
      });

      if (!member) {
        throw new AppError('Pending membership request not found', 404);
      }

      const memberCount = await GroupMember.count({
        where: { groupId, status: 'approved' },
      });

      if (memberCount >= group.maxMembers) {
        throw new AppError('Group is full', 400);
      }

      await member.update({ status: 'approved' });

      return member;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to approve member', 500);
    }
  }

  async rejectMember(groupId: number, userId: number, adminId: number) {
    try {
      const group = await StudyGroup.findByPk(groupId);
      if (!group) {
        throw new AppError('Study group not found', 404);
      }

      const admin = await GroupMember.findOne({
        where: { groupId, userId: adminId, role: 'admin', status: 'approved' },
      });

      if (!admin) {
        throw new AppError('Only group admin permission required', 403);
      }

      const member = await GroupMember.findOne({
        where: { groupId, userId, status: 'pending' },
      });

      if (!member) {
        throw new AppError('Pending membership request not found', 404);
      }

      await member.update({ status: 'rejected' });

      return member;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to reject member', 500);
    }
  }

  async removeMember(groupId: number, userId: number, adminId: number) {
    try {
      const group = await StudyGroup.findByPk(groupId);
      if (!group) {
        throw new AppError('Study group not found', 404);
      }

      const admin = await GroupMember.findOne({
        where: { groupId, userId: adminId, role: 'admin', status: 'approved' },
      });

      if (!admin) {
        throw new AppError('Only group admin permission required', 403);
      }

      if (userId === adminId) {
        throw new AppError('Cannot remove yourself from the group', 400);
      }

      const member = await GroupMember.findOne({
        where: { groupId, userId, status: 'approved' },
      });

      if (!member) {
        throw new AppError('Member not found', 404);
      }

      await member.destroy();

      return;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to remove member', 500);
    }
  }

  async setWeeklyGoal(groupId: number, adminId: number, lessonsToComplete: number) {
    try {
      const group = await StudyGroup.findByPk(groupId);
      if (!group) {
        throw new AppError('Study group not found', 404);
      }

      const admin = await GroupMember.findOne({
        where: { groupId, userId: adminId, role: 'admin', status: 'approved' },
      });

      if (!admin) {
        throw new AppError('Only group admin permission required', 403);
      }

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const existingGoal = await GroupGoal.findOne({
        where: {
          groupId,
          weekStart,
        },
      });

      let goal;
      if (existingGoal) {
        await existingGoal.update({ lessonsToComplete });
        goal = existingGoal;
      } else {
        goal = await GroupGoal.create({
          groupId,
          weekStart,
          lessonsToComplete,
        });
      }

      return goal;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to set weekly goal', 500);
    }
  }

  async getGroupProgress(groupId: number) {
    try {
      const group = await StudyGroup.findByPk(groupId);
      if (!group) {
        throw new AppError('Study group not found', 404);
      }

      const members = await GroupMember.findAll({
        where: { groupId, status: 'approved' },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar'],
          },
        ],
      });

      const lessons = await Lesson.findAll({
        include: [
          {
            model: Chapter,
            as: 'chapter',
            where: { courseId: group.courseId },
            attributes: ['id', 'title'],
          },
        ],
        order: [
          [col('chapter.order'), 'ASC'],
          ['order', 'ASC'],
        ],
      });

      const userIds = members.map((m) => m.userId);
      const progressRecords = await LearningProgress.findAll({
        where: {
          userId: { [Op.in]: userIds },
          courseId: group.courseId,
        },
      });

      const progressMap = new Map();
      progressRecords.forEach((record) => {
        const key = `${record.userId}-${record.lessonId}`;
        progressMap.set(key, record);
      });

      const progress = members.map((member) => {
        const lessonsProgress = lessons.map((lesson) => {
          const key = `${member.userId}-${lesson.id}`;
          const record = progressMap.get(key);
          const lessonWithChapter = lesson as unknown as Lesson & {
            chapter?: { id: number; title: string };
          };
          return {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            chapterTitle: lessonWithChapter.chapter?.title,
            completed: record?.completed || false,
            completedAt: record?.completedAt || null,
            timeSpent: record?.timeSpent || 0,
          };
        });

        const completedCount = lessonsProgress.filter((l) => l.completed).length;
        const memberWithUser = member as unknown as GroupMember & {
          user: { id: number; name: string; avatar?: string };
        };

        return {
          user: memberWithUser.user,
          lessons: lessonsProgress,
          completedCount,
          totalLessons: lessons.length,
          completionRate: lessons.length > 0 ? completedCount / lessons.length : 0,
        };
      });

      return {
        groupId,
        lessons,
        progress,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch group progress', 500);
    }
  }

  async getAllGroupsWithActivity() {
    try {
      const groups = await StudyGroup.findAll({
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'avatar'],
          },
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
            include: [
              {
                model: User,
                as: 'instructor',
                attributes: ['id', 'name', 'avatar'],
              },
            ],
          },
        ],
        attributes: {
          include: [
            [
              literal(`(
                SELECT COUNT(*) 
                FROM group_members 
                WHERE group_members.groupId = StudyGroup.id 
                AND group_members.status = 'approved'
              )`),
              'memberCount',
            ],
            [
              literal(`(
                SELECT COUNT(*) 
                FROM group_discussions 
                WHERE group_discussions.groupId = StudyGroup.id
              )`),
              'discussionCount',
            ],
            [
              literal(`(
                SELECT COUNT(*) 
                FROM group_discussion_replies
                INNER JOIN group_discussions 
                ON group_discussion_replies.discussionId = group_discussions.id
                WHERE group_discussions.groupId = StudyGroup.id
              )`),
              'replyCount',
            ],
            [
              literal(`(
                SELECT COUNT(DISTINCT group_members.userId)
                FROM group_members
                INNER JOIN group_discussions 
                ON group_members.groupId = group_discussions.groupId
                WHERE group_members.groupId = StudyGroup.id
                AND group_members.status = 'approved'
                AND (
                  EXISTS (
                    SELECT 1 FROM group_discussions gd
                    WHERE gd.groupId = StudyGroup.id
                    AND gd.userId = group_members.userId
                  )
                  OR EXISTS (
                    SELECT 1 FROM group_discussion_replies gdr
                    INNER JOIN group_discussions gd ON gdr.discussionId = gd.id
                    WHERE gd.groupId = StudyGroup.id
                    AND gdr.userId = group_members.userId
                  )
                )
              )`),
              'activeMemberCount',
            ],
          ],
        },
        order: [
          [literal('discussionCount + replyCount'), 'DESC'],
          [literal('memberCount'), 'DESC'],
        ],
      });

      return groups.map((group) => {
        const memberCount = group.getDataValue('memberCount') || 0;
        const discussionCount = group.getDataValue('discussionCount') || 0;
        const replyCount = group.getDataValue('replyCount') || 0;
        const activeMemberCount = group.getDataValue('activeMemberCount') || 0;

        return {
          ...group.toJSON(),
          _count: {
            members: memberCount,
            discussions: discussionCount,
            replies: replyCount,
            activeMembers: activeMemberCount,
          },
          activityScore: discussionCount + replyCount,
          activeRate: memberCount > 0 ? activeMemberCount / memberCount : 0,
        };
      });
    } catch (error) {
      throw new AppError('Failed to fetch groups with activity', 500);
    }
  }

  async createDiscussion(groupId: number, userId: number, title: string, content: string) {
    try {
      const group = await StudyGroup.findByPk(groupId);
      if (!group) {
        throw new AppError('Study group not found', 404);
      }

      const member = await GroupMember.findOne({
        where: { groupId, userId, status: 'approved' },
      });

      if (!member) {
        throw new AppError('You must be a member of the group to create discussions', 403);
      }

      const discussion = await GroupDiscussion.create({
        groupId,
        userId,
        title,
        content,
      });

      return discussion;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create discussion', 500);
    }
  }

  async getDiscussionsByGroup(groupId: number) {
    try {
      const group = await StudyGroup.findByPk(groupId);
      if (!group) {
        throw new AppError('Study group not found', 404);
      }

      const discussions = await GroupDiscussion.findAll({
        where: { groupId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar'],
          },
          {
            model: GroupDiscussionReply,
            as: 'replies',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return discussions;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch discussions', 500);
    }
  }

  async createDiscussionReply(discussionId: number, userId: number, content: string) {
    try {
      const discussion = await GroupDiscussion.findByPk(discussionId);
      if (!discussion) {
        throw new AppError('Discussion not found', 404);
      }

      const member = await GroupMember.findOne({
        where: { groupId: discussion.groupId, userId, status: 'approved' },
      });

      if (!member) {
        throw new AppError('You must be a member of the group to reply to discussions', 403);
      }

      const reply = await GroupDiscussionReply.create({
        discussionId,
        userId,
        content,
      });

      return reply;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create discussion reply', 500);
    }
  }

  async getUserGroups(userId: number) {
    try {
      const memberships = await GroupMember.findAll({
        where: { userId, status: 'approved' },
        include: [
          {
            model: StudyGroup,
            as: 'group',
            include: [
              {
                model: Course,
                as: 'course',
                attributes: ['id', 'title'],
              },
              {
                model: User,
                as: 'creator',
                attributes: ['id', 'name', 'avatar'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      const groups = memberships.map((membership) => {
        const membershipWithGroup = membership as unknown as GroupMember & {
          group: StudyGroup & {
            course?: { id: number; title: string };
            creator?: { id: number; name: string; avatar?: string };
          };
        };
        const group = membershipWithGroup.group;
        return {
          ...group.toJSON(),
          role: membership.role,
          joinedAt: membership.joinedAt,
        };
      });

      return groups;
    } catch (error) {
      throw new AppError('Failed to fetch user groups', 500);
    }
  }
}

export default new StudyGroupService();
