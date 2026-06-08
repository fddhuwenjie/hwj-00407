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
};
