import sequelize from '../database.js';
import {
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
} from '../models/index.js';
import {
  instructorData,
  studentsData,
  coursesData,
  discussionPostsData,
  studentProgressConfig,
} from './data.js';

function generateCertificateNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${year}${month}${day}-${random}`;
}

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  await sequelize.sync({ force: true });
  console.log('✅ Database tables created');

  const instructor = await User.create(instructorData);
  console.log('✅ Instructor created:', instructor.name);

  const students = await User.bulkCreate(studentsData);
  console.log(`✅ ${students.length} students created`);

  const createdCourses = [];
  const allLessons: { courseId: number; lessons: Lesson[] }[] = [];

  for (const courseData of coursesData) {
    const course = await Course.create({
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      coverImageUrl: courseData.coverImageUrl,
      difficulty: courseData.difficulty,
      instructorId: instructor.id,
    });

    const courseLessons: Lesson[] = [];

    for (const chapterData of courseData.chapters) {
      const chapter = await Chapter.create({
        courseId: course.id,
        title: chapterData.title,
        order: chapterData.order,
      });

      for (const lessonData of chapterData.lessons) {
        const lesson = await Lesson.create({
          chapterId: chapter.id,
          title: lessonData.title,
          type: lessonData.type,
          content: lessonData.content,
          order: lessonData.order,
          duration: lessonData.duration,
        });

        if (lessonData.questions) {
          for (const questionData of lessonData.questions) {
            await QuizQuestion.create({
              lessonId: lesson.id,
              type: questionData.type,
              question: questionData.question,
              options: questionData.options,
              correctAnswers: questionData.correctAnswers,
              explanation: questionData.explanation,
              order: questionData.order,
            });
          }
        }

        courseLessons.push(lesson);
      }
    }

    createdCourses.push(course);
    allLessons.push({ courseId: course.id, lessons: courseLessons });
    console.log(`✅ Course created: ${course.title} (${courseLessons.length} lessons)`);
  }

  for (const postData of discussionPostsData) {
    const course = createdCourses[postData.courseIndex];
    const student = students[postData.studentIndex];

    const post = await DiscussionPost.create({
      courseId: course.id,
      userId: student.id,
      title: postData.title,
      content: postData.content,
      isPinned: postData.isPinned,
      isFeatured: postData.isFeatured,
    });

    for (const replyData of postData.replies) {
      const replyStudent = students[replyData.studentIndex];
      await DiscussionReply.create({
        postId: post.id,
        userId: replyStudent.id,
        content: replyData.content,
      });
    }
  }
  console.log('✅ Discussion posts and replies created');

  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  for (let i = 0; i < studentProgressConfig.length; i++) {
    const config = studentProgressConfig[i];
    const student = students[config.studentIndex];
    const course = createdCourses[config.courseIndex];
    const lessonsData = allLessons.find((l) => l.courseId === course.id);

    if (!lessonsData) continue;

    await Enrollment.create({
      userId: student.id,
      courseId: course.id,
      enrolledAt: daysAgo(15 - i * 2),
    });

    const quizLesson = lessonsData.lessons.find((l) => l.type === 'quiz');

    for (let j = 0; j < lessonsData.lessons.length; j++) {
      const lesson = lessonsData.lessons[j];
      const isCompleted = j < config.completedLessons;
      const timeSpent = config.timeSpent[j] || 0;

      if (isCompleted || timeSpent > 0) {
        await LearningProgress.create({
          userId: student.id,
          courseId: course.id,
          lessonId: lesson.id,
          completed: isCompleted,
          completedAt: isCompleted ? daysAgo(10 - i + Math.floor(j / 2)) : undefined,
          timeSpent: timeSpent,
        });
      }
    }

    if (config.quizScore > 0 && quizLesson) {
      await QuizAttempt.create({
        userId: student.id,
        lessonId: quizLesson.id,
        score: config.quizScore,
        answers: {},
        createdAt: daysAgo(5 - i),
      });
    }

    if (config.completedLessons === 6 && config.quizScore >= 80) {
      await Certificate.create({
        userId: student.id,
        courseId: course.id,
        certificateNumber: generateCertificateNumber(),
        issuedAt: daysAgo(3 - i),
      });
    }
  }
  console.log('✅ Learning progress, enrollments, quiz attempts, and certificates created');

  console.log('🎉 Database seeding complete!');
  console.log(`
📊 Summary:
- Users: ${students.length + 1} (1 instructor, ${students.length} students)
- Courses: ${createdCourses.length}
- Certificates: ${await Certificate.count()}
`);
}

export async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      { type: 'SELECT' }
    ) as unknown[];

    if (Array.isArray(tables) && tables.length === 0) {
      await seedDatabase();
    } else {
      console.log('ℹ️  Database already seeded');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
