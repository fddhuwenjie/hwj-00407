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
  Assignment,
  AssignmentSubmission,
  Note,
  StudyGroup,
  GroupMember,
  GroupDiscussion,
  GroupDiscussionReply,
  GroupGoal,
} from '../models/index.js';
import {
  instructorData,
  studentsData,
  coursesData,
  discussionPostsData,
  studentProgressConfig,
} from './data.js';
import { hashPassword } from '../utils/password.js';

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

  const instructorPasswordHash = await hashPassword(instructorData.password);
  const instructor = await User.create({
    ...instructorData,
    passwordHash: instructorPasswordHash,
  });
  console.log('✅ Instructor created:', instructor.name, '(password:', instructorData.password, ')');

  const studentsWithPasswords = await Promise.all(
    studentsData.map(async (student) => ({
      ...student,
      passwordHash: await hashPassword(student.password),
    }))
  );
  const students = await User.bulkCreate(studentsWithPasswords);
  console.log(`✅ ${students.length} students created:`);
  students.forEach((student, index) => {
    console.log(`   - ${student.name}: ${studentsData[index].email} / ${studentsData[index].password}`);
  });

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

  const createdAssignments: { courseId: number; assignment: any }[] = [];

  for (const courseLessons of allLessons) {
    const course = createdCourses.find((c) => c.id === courseLessons.courseId);
    if (!course) continue;

    for (const lesson of courseLessons.lessons) {
      if (lesson.type === 'assignment') {
        const isFirstCourse = courseLessons.courseId === createdCourses[0].id;
        const assignment = await Assignment.create({
          lessonId: lesson.id,
          description: isFirstCourse
            ? '请创建一个完整的 React 组件，包含状态管理、Props 传递和事件处理功能。'
            : '请使用 Pandas 分析一份数据集，生成一份包含数据清洗、统计分析和可视化的完整报告。',
          dueDate: daysAgo(isFirstCourse ? -30 : -15),
          maxScore: 100,
          allowLateSubmission: isFirstCourse,
        });
        createdAssignments.push({ courseId: courseLessons.courseId, assignment });
      }
    }
  }
  console.log('✅ Assignments created');

  for (const { courseId, assignment } of createdAssignments) {
    const isFirstCourse = courseId === createdCourses[0].id;

    await AssignmentSubmission.create({
      assignmentId: assignment.id,
      userId: students[0].id,
      content: isFirstCourse
        ? '我完成了一个 React 待办事项组件，包含添加、删除和标记完成功能。'
        : '我分析了泰坦尼克号数据集，生成了完整的数据报告。',
      score: 85,
      feedback: '完成很好！',
      submittedAt: daysAgo(5),
      gradedAt: daysAgo(3),
      status: 'graded',
    });

    await AssignmentSubmission.create({
      assignmentId: assignment.id,
      userId: students[1].id,
      content: isFirstCourse
        ? '我创建了一个 React 计数器组件，使用 useState 和 useEffect。'
        : '我分析了销售数据集，包含基础统计分析。',
      submittedAt: daysAgo(2),
      status: 'submitted',
    });

    if (assignment.allowLateSubmission) {
      await AssignmentSubmission.create({
        assignmentId: assignment.id,
        userId: students[2].id,
        content: isFirstCourse
          ? '抱歉迟交了，我完成了一个简单的 React 表单组件。'
          : '抱歉迟交了，完成了基础数据分析。',
        submittedAt: daysAgo(1),
        status: 'late',
      });
    }
  }
  console.log('✅ Assignment submissions created');

  const noteConfigs = [
    { studentIndex: 0, courseIndex: 0, lessonOrder: 1, content: 'HTML5 新特性很实用，特别是语义化标签', tag: 'normal' as const, timePoint: undefined },
    { studentIndex: 0, courseIndex: 0, lessonOrder: 2, content: 'Flexbox 布局的 justify-content 和 align-items 区别要记清楚', tag: 'important' as const, timePoint: undefined },
    { studentIndex: 0, courseIndex: 1, lessonOrder: 4, content: 'NumPy 的广播机制还需要再理解一下', tag: 'question' as const, timePoint: undefined },
    { studentIndex: 1, courseIndex: 0, lessonOrder: 1, content: '视频 5:30 处提到的语义化标签很重要', tag: 'important' as const, timePoint: 330 },
    { studentIndex: 1, courseIndex: 0, lessonOrder: 5, content: 'useEffect 的依赖数组问题要注意', tag: 'question' as const, timePoint: 600 },
    { studentIndex: 2, courseIndex: 1, lessonOrder: 2, content: 'Python 字典的常用方法', tag: 'normal' as const, timePoint: undefined },
    { studentIndex: 2, courseIndex: 1, lessonOrder: 4, content: 'Pandas 的 DataFrame 和 Series 区别', tag: 'important' as const, timePoint: undefined },
  ];

  for (const config of noteConfigs) {
    const student = students[config.studentIndex];
    const course = createdCourses[config.courseIndex];
    const lessonsData = allLessons.find((l) => l.courseId === course.id);
    if (!lessonsData) continue;

    const lesson = lessonsData.lessons.find((l) => l.order === config.lessonOrder);
    if (!lesson) continue;

    await Note.create({
      userId: student.id,
      courseId: course.id,
      lessonId: lesson.id,
      content: config.content,
      tag: config.tag,
      timePoint: config.timePoint,
    });
  }
  console.log('✅ Notes created');

  const studyGroups = [
    {
      name: '前端开发交流群',
      description: '一起学习前端开发技术，分享经验，共同进步！',
      courseIndex: 0,
      maxMembers: 10,
      createdByIndex: 0,
    },
    {
      name: '数据分析学习小组',
      description: '专注于 Python 数据分析学习，一起探讨数据科学！',
      courseIndex: 1,
      maxMembers: 8,
      createdByIndex: 5,
    },
  ];

  const createdGroups: any[] = [];

  for (const groupData of studyGroups) {
    const course = createdCourses[groupData.courseIndex];
    const creator = students[groupData.createdByIndex];

    const group = await StudyGroup.create({
      name: groupData.name,
      description: groupData.description,
      courseId: course.id,
      maxMembers: groupData.maxMembers,
      createdBy: creator.id,
    });

    createdGroups.push(group);
  }
  console.log('✅ Study groups created');

  const groupMemberConfigs = [
    { groupIndex: 0, userIndex: 0, role: 'admin' as const, status: 'approved' as const, daysAgoVal: 10 },
    { groupIndex: 0, userIndex: 1, role: 'member' as const, status: 'approved' as const, daysAgoVal: 8 },
    { groupIndex: 0, userIndex: 2, role: 'member' as const, status: 'approved' as const, daysAgoVal: 7 },
    { groupIndex: 0, userIndex: 3, role: 'member' as const, status: 'pending' as const, daysAgoVal: 1 },
    { groupIndex: 1, userIndex: 5, role: 'admin' as const, status: 'approved' as const, daysAgoVal: 12 },
    { groupIndex: 1, userIndex: 6, role: 'member' as const, status: 'approved' as const, daysAgoVal: 9 },
    { groupIndex: 1, userIndex: 7, role: 'member' as const, status: 'approved' as const, daysAgoVal: 6 },
  ];

  for (const config of groupMemberConfigs) {
    const group = createdGroups[config.groupIndex];
    const user = students[config.userIndex];

    await GroupMember.create({
      groupId: group.id,
      userId: user.id,
      role: config.role,
      status: config.status,
      joinedAt: daysAgo(config.daysAgoVal),
    });
  }
  console.log('✅ Group members created');

  const discussionConfigs = [
    {
      groupIndex: 0,
      userIndex: 0,
      title: '本周学习计划',
      content: '大家好，本周我们计划学习 React Hooks 的高级用法，希望大家积极参与讨论！',
      replies: [
        { userIndex: 1, content: '好的，我已经开始预习了，期待和大家交流。' },
        { userIndex: 2, content: '我有一些关于 useCallback 的问题，到时候请教大家。' },
      ],
    },
    {
      groupIndex: 0,
      userIndex: 1,
      title: 'React 性能优化技巧',
      content: '最近在研究 React 性能优化，大家有什么好的经验分享吗？比如 memo、useMemo 等。',
      replies: [],
    },
    {
      groupIndex: 0,
      userIndex: 2,
      title: 'CSS Grid 布局问题',
      content: '我在做项目时遇到了 Grid 布局的问题，想请教一下大家。',
      replies: [
        { userIndex: 0, content: '可以具体描述一下问题吗？最好能附上代码。' },
      ],
    },
    {
      groupIndex: 1,
      userIndex: 5,
      title: 'Pandas 数据清洗经验分享',
      content: '最近在处理一个脏数据集，积累了一些数据清洗的经验，想和大家分享一下。',
      replies: [
        { userIndex: 6, content: '太好了，我正好在处理类似的问题，期待分享！' },
      ],
    },
    {
      groupIndex: 1,
      userIndex: 6,
      title: 'Matplotlib 可视化问题',
      content: '我在画饼图时遇到了中文乱码问题，有人知道怎么解决吗？',
      replies: [],
    },
    {
      groupIndex: 1,
      userIndex: 7,
      title: 'NumPy 数组运算效率',
      content: '大家在处理大数组时，有没有什么提高运算效率的技巧？',
      replies: [
        { userIndex: 5, content: '尽量使用向量化操作，避免循环。另外可以考虑使用 Numba 加速。' },
        { userIndex: 6, content: '还有就是注意内存使用，尽量不用复制数组。' },
      ],
    },
  ];

  for (const config of discussionConfigs) {
    const group = createdGroups[config.groupIndex];
    const user = students[config.userIndex];

    const discussion = await GroupDiscussion.create({
      groupId: group.id,
      userId: user.id,
      title: config.title,
      content: config.content,
    });

    for (const replyData of config.replies) {
      const replyUser = students[replyData.userIndex];
      await GroupDiscussionReply.create({
        discussionId: discussion.id,
        userId: replyUser.id,
        content: replyData.content,
      });
    }
  }
  console.log('✅ Group discussions and replies created');

  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const thisMonday = getMonday(new Date());

  for (const group of createdGroups) {
    await GroupGoal.create({
      groupId: group.id,
      weekStart: thisMonday,
      lessonsToComplete: 5,
    });
  }
  console.log('✅ Group goals created');

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
- Assignments: ${await Assignment.count()}
- Assignment Submissions: ${await AssignmentSubmission.count()}
- Notes: ${await Note.count()}
- Study Groups: ${await StudyGroup.count()}
- Group Members: ${await GroupMember.count()}
- Group Discussions: ${await GroupDiscussion.count()}
- Group Goals: ${await GroupGoal.count()}
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
