import User from './User.js';
import Course from './Course.js';
import Chapter from './Chapter.js';
import Lesson from './Lesson.js';
import QuizQuestion from './QuizQuestion.js';
import Enrollment from './Enrollment.js';
import LearningProgress from './LearningProgress.js';
import QuizAttempt from './QuizAttempt.js';
import Certificate from './Certificate.js';
import DiscussionPost from './DiscussionPost.js';
import DiscussionReply from './DiscussionReply.js';
import Assignment from './Assignment.js';
import AssignmentSubmission from './AssignmentSubmission.js';
import Note from './Note.js';
import StudyGroup from './StudyGroup.js';
import GroupMember from './GroupMember.js';
import GroupDiscussion from './GroupDiscussion.js';
import GroupDiscussionReply from './GroupDiscussionReply.js';
import GroupGoal from './GroupGoal.js';

User.hasMany(Course, { foreignKey: 'instructorId', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

Course.hasMany(Chapter, { foreignKey: 'courseId', as: 'chapters' });
Chapter.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Chapter.hasMany(Lesson, { foreignKey: 'chapterId', as: 'lessons' });
Lesson.belongsTo(Chapter, { foreignKey: 'chapterId', as: 'chapter' });

Lesson.hasMany(QuizQuestion, { foreignKey: 'lessonId', as: 'questions' });
QuizQuestion.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

User.hasMany(Enrollment, { foreignKey: 'userId', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(LearningProgress, { foreignKey: 'userId', as: 'learningProgress' });
LearningProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Course.hasMany(LearningProgress, { foreignKey: 'courseId', as: 'learningProgress' });
LearningProgress.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Lesson.hasMany(LearningProgress, { foreignKey: 'lessonId', as: 'learningProgress' });
LearningProgress.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

User.hasMany(QuizAttempt, { foreignKey: 'userId', as: 'quizAttempts' });
QuizAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Lesson.hasMany(QuizAttempt, { foreignKey: 'lessonId', as: 'quizAttempts' });
QuizAttempt.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

User.hasMany(Certificate, { foreignKey: 'userId', as: 'certificates' });
Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Course.hasMany(Certificate, { foreignKey: 'courseId', as: 'certificates' });
Certificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(DiscussionPost, { foreignKey: 'userId', as: 'discussionPosts' });
DiscussionPost.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Course.hasMany(DiscussionPost, { foreignKey: 'courseId', as: 'discussionPosts' });
DiscussionPost.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(DiscussionReply, { foreignKey: 'userId', as: 'discussionReplies' });
DiscussionReply.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DiscussionPost.hasMany(DiscussionReply, { foreignKey: 'postId', as: 'replies' });
DiscussionReply.belongsTo(DiscussionPost, { foreignKey: 'postId', as: 'post' });

Lesson.hasOne(Assignment, { foreignKey: 'lessonId', as: 'assignment' });
Assignment.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

Assignment.hasMany(AssignmentSubmission, { foreignKey: 'assignmentId', as: 'submissions' });
AssignmentSubmission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });
User.hasMany(AssignmentSubmission, { foreignKey: 'userId', as: 'assignmentSubmissions' });
AssignmentSubmission.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Note, { foreignKey: 'userId', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Course.hasMany(Note, { foreignKey: 'courseId', as: 'notes' });
Note.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Lesson.hasMany(Note, { foreignKey: 'lessonId', as: 'notes' });
Note.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

Course.hasMany(StudyGroup, { foreignKey: 'courseId', as: 'studyGroups' });
StudyGroup.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
User.hasMany(StudyGroup, { foreignKey: 'createdBy', as: 'createdGroups' });
StudyGroup.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

StudyGroup.hasMany(GroupMember, { foreignKey: 'groupId', as: 'members' });
GroupMember.belongsTo(StudyGroup, { foreignKey: 'groupId', as: 'group' });
User.hasMany(GroupMember, { foreignKey: 'userId', as: 'groupMemberships' });
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

StudyGroup.hasMany(GroupDiscussion, { foreignKey: 'groupId', as: 'discussions' });
GroupDiscussion.belongsTo(StudyGroup, { foreignKey: 'groupId', as: 'group' });
User.hasMany(GroupDiscussion, { foreignKey: 'userId', as: 'groupDiscussions' });
GroupDiscussion.belongsTo(User, { foreignKey: 'userId', as: 'user' });

GroupDiscussion.hasMany(GroupDiscussionReply, { foreignKey: 'discussionId', as: 'replies' });
GroupDiscussionReply.belongsTo(GroupDiscussion, { foreignKey: 'discussionId', as: 'discussion' });
User.hasMany(GroupDiscussionReply, { foreignKey: 'userId', as: 'groupDiscussionReplies' });
GroupDiscussionReply.belongsTo(User, { foreignKey: 'userId', as: 'user' });

StudyGroup.hasMany(GroupGoal, { foreignKey: 'groupId', as: 'goals' });
GroupGoal.belongsTo(StudyGroup, { foreignKey: 'groupId', as: 'group' });

export {
  User,
  Course,
  Chapter,
  Lesson,
  QuizQuestion,
  Enrollment,
  LearningProgress,
  QuizAttempt,
  Certificate,
  DiscussionPost,
  DiscussionReply,
  Assignment,
  AssignmentSubmission,
  Note,
  StudyGroup,
  GroupMember,
  GroupDiscussion,
  GroupDiscussionReply,
  GroupGoal,
};
