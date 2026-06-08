export const instructorData = {
  name: '李明教授',
  email: 'liming@example.com',
  role: 'instructor' as const,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor',
};

export const studentsData = [
  { name: '张伟', email: 'zhangwei@example.com', role: 'student' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei' },
  { name: '李娜', email: 'lina@example.com', role: 'student' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina' },
  { name: '王强', email: 'wangqiang@example.com', role: 'student' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangqiang' },
  { name: '刘洋', email: 'liuyang@example.com', role: 'student' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuyang' },
  { name: '陈静', email: 'chenjing@example.com', role: 'student' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenjing' },
  { name: '杨帆', email: 'yangfan@example.com', role: 'student' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yangfan' },
  { name: '赵敏', email: 'zhaomin@example.com', role: 'student' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaomin' },
  { name: '黄磊', email: 'huanglei@example.com', role: 'student' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huanglei' },
  { name: '周杰', email: 'zhoujie@example.com', role: 'student' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhoujie' },
  { name: '吴芳', email: 'wufang@example.com', role: 'student' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wufang' },
];

export const coursesData = [
  {
    title: 'Web前端开发实战',
    description: '从零开始学习现代Web前端开发技术栈。本课程涵盖HTML5、CSS3、JavaScript、React框架等核心内容，通过实战项目帮助你快速掌握前端开发技能，成为一名合格的前端工程师。',
    category: '前端开发',
    coverImageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20web%20development%20course%20cover%20with%20html%20css%20javascript%20logos%20on%20dark%20blue%20background&image_size=landscape_16_9',
    difficulty: 'intermediate' as const,
    chapters: [
      {
        title: '第一章：基础入门',
        order: 1,
        lessons: [
          {
            title: '1.1 HTML5 新特性详解',
            type: 'video' as const,
            content: 'https://www.w3schools.com/html/mov_bbb.mp4',
            order: 1,
            duration: 25,
          },
          {
            title: '1.2 CSS3 高级布局',
            type: 'document' as const,
            content: `# CSS3 高级布局

## Flexbox 布局

Flexbox 是 CSS3 中最强大的布局方式之一。

\`\`\`css
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
\`\`\`

## Grid 布局

CSS Grid 提供了二维布局能力。

\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
\`\`\`

## 响应式设计

使用媒体查询实现响应式布局：

\`\`\`css
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}
\`\`\`
`,
            order: 2,
            duration: 30,
          },
          {
            title: '1.3 JavaScript 核心概念',
            type: 'video' as const,
            content: 'https://www.w3schools.com/html/mov_bbb.mp4',
            order: 3,
            duration: 35,
          },
        ],
      },
      {
        title: '第二章：React 框架',
        order: 2,
        lessons: [
          {
            title: '2.1 React 基础与组件',
            type: 'document' as const,
            content: `# React 基础与组件

## 什么是 React？

React 是一个用于构建用户界面的 JavaScript 库。

## 函数组件

\`\`\`jsx
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}
\`\`\`

## useState Hook

\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

## Props 传递

Props 是组件之间传递数据的方式。
`,
            order: 4,
            duration: 40,
          },
          {
            title: '2.2 React Hooks 深入',
            type: 'video' as const,
            content: 'https://www.w3schools.com/html/mov_bbb.mp4',
            order: 5,
            duration: 45,
          },
          {
            title: '章节测验',
            type: 'quiz' as const,
            content: '',
            order: 6,
            questions: [
              {
                type: 'single' as const,
                question: 'React 中用于管理组件状态的 Hook 是？',
                options: ['useEffect', 'useState', 'useContext', 'useReducer'],
                correctAnswers: [1],
                explanation: 'useState 是 React 中最基本的状态管理 Hook，返回一个状态值和更新该状态的函数。',
                order: 1,
              },
              {
                type: 'multiple' as const,
                question: '以下哪些是 React 的核心特性？',
                options: ['虚拟DOM', '双向绑定', '组件化', 'JSX语法'],
                correctAnswers: [0, 2, 3],
                explanation: 'React 的核心特性包括虚拟DOM、组件化和JSX语法。双向绑定是Vue等框架的特性。',
                order: 2,
              },
              {
                type: 'boolean' as const,
                question: 'React 函数组件中可以使用 Hooks。',
                options: ['正确', '错误'],
                correctAnswers: [0],
                explanation: 'React 16.8 引入了 Hooks，允许在函数组件中使用状态和其他 React 特性。',
                order: 3,
              },
              {
                type: 'single' as const,
                question: 'CSS Flexbox 中，justify-content 的默认值是？',
                options: ['center', 'space-between', 'flex-start', 'stretch'],
                correctAnswers: [2],
                explanation: 'justify-content 的默认值是 flex-start，项目从容器起点开始排列。',
                order: 4,
              },
              {
                type: 'boolean' as const,
                question: 'CSS Grid 是一维布局系统。',
                options: ['正确', '错误'],
                correctAnswers: [1],
                explanation: 'CSS Grid 是二维布局系统，可以同时处理行和列。',
                order: 5,
              },
            ],
          },
          {
            title: '2.3 实战作业：React 组件开发',
            type: 'assignment' as const,
            content: '',
            order: 7,
          },
        ],
      },
    ],
  },
  {
    title: 'Python数据分析入门',
    description: '系统学习Python数据分析核心技能。本课程将带你掌握NumPy、Pandas、Matplotlib等数据处理库，学习数据清洗、可视化和基础分析方法，为数据科学之路打下坚实基础。',
    category: '数据科学',
    coverImageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=data%20analysis%20python%20course%20cover%20with%20charts%20graphs%20and%20python%20logo%20green%20theme&image_size=landscape_16_9',
    difficulty: 'beginner' as const,
    chapters: [
      {
        title: '第一章：Python 基础',
        order: 1,
        lessons: [
          {
            title: '1.1 Python 环境搭建',
            type: 'video' as const,
            content: 'https://www.w3schools.com/html/mov_bbb.mp4',
            order: 1,
            duration: 20,
          },
          {
            title: '1.2 Python 数据结构',
            type: 'document' as const,
            content: `# Python 数据结构

## 列表 (List)

\`\`\`python
numbers = [1, 2, 3, 4, 5]
numbers.append(6)
print(numbers[0])  # 1
\`\`\`

## 字典 (Dictionary)

\`\`\`python
student = {
    'name': '张三',
    'age': 20,
    'grades': [85, 90, 88]
}
print(student['name'])  # 张三
\`\`\`

## 元组 (Tuple)

元组是不可变的列表：

\`\`\`python
coordinates = (10, 20)
x, y = coordinates
\`\`\`

## 集合 (Set)

集合不允许重复元素：

\`\`\`python
unique_numbers = {1, 2, 3, 2, 1}
print(unique_numbers)  # {1, 2, 3}
\`\`\`
`,
            order: 2,
            duration: 25,
          },
          {
            title: '1.3 函数与模块',
            type: 'video' as const,
            content: 'https://www.w3schools.com/html/mov_bbb.mp4',
            order: 3,
            duration: 30,
          },
        ],
      },
      {
        title: '第二章：数据分析库',
        order: 2,
        lessons: [
          {
            title: '2.1 NumPy 基础',
            type: 'document' as const,
            content: `# NumPy 基础

## 数组创建

\`\`\`python
import numpy as np

# 一维数组
arr = np.array([1, 2, 3, 4, 5])

# 二维数组
matrix = np.array([[1, 2, 3], [4, 5, 6]])

# 特殊数组
zeros = np.zeros((3, 3))
ones = np.ones((2, 4))
identity = np.eye(3)
\`\`\`

## 数组运算

\`\`\`python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

print(a + b)  # [5 7 9]
print(a * 2)  # [2 4 6]
print(np.dot(a, b))  # 32 (点积)
\`\`\`

## 统计计算

\`\`\`python
data = np.array([1, 2, 3, 4, 5])
print(data.mean())  # 3.0
print(data.std())   # 1.414...
print(data.max())   # 5
\`\`\`
`,
            order: 4,
            duration: 35,
          },
          {
            title: '2.2 Pandas 数据处理',
            type: 'video' as const,
            content: 'https://www.w3schools.com/html/mov_bbb.mp4',
            order: 5,
            duration: 40,
          },
          {
            title: '章节测验',
            type: 'quiz' as const,
            content: '',
            order: 6,
            questions: [
              {
                type: 'single' as const,
                question: 'Pandas 中用于处理表格数据的主要数据结构是？',
                options: ['Array', 'Series', 'DataFrame', 'List'],
                correctAnswers: [2],
                explanation: 'DataFrame 是 Pandas 中最核心的数据结构，类似于 Excel 表格，可以存储和处理二维数据。',
                order: 1,
              },
              {
                type: 'multiple' as const,
                question: '以下哪些是 NumPy 的主要特性？',
                options: ['支持多维数组', '内置字典功能', '快速数值计算', '数据可视化'],
                correctAnswers: [0, 2],
                explanation: 'NumPy 主要提供多维数组支持和快速数值计算。字典是Python内置功能，数据可视化是Matplotlib的功能。',
                order: 2,
              },
              {
                type: 'boolean' as const,
                question: 'Python 元组 (tuple) 中的元素可以修改。',
                options: ['正确', '错误'],
                correctAnswers: [1],
                explanation: '元组是不可变的数据结构，创建后不能修改其元素。',
                order: 3,
              },
              {
                type: 'single' as const,
                question: 'Pandas 中用于读取 CSV 文件的函数是？',
                options: ['read_csv()', 'load_csv()', 'import_csv()', 'open_csv()'],
                correctAnswers: [0],
                explanation: 'pd.read_csv() 是 Pandas 读取 CSV 文件的标准函数。',
                order: 4,
              },
              {
                type: 'boolean' as const,
                question: 'NumPy 数组可以包含不同类型的元素。',
                options: ['正确', '错误'],
                correctAnswers: [1],
                explanation: 'NumPy 数组要求所有元素类型相同，这也是它比 Python 列表更快的原因之一。',
                order: 5,
              },
            ],
          },
          {
            title: '2.3 实战作业：数据分析报告',
            type: 'assignment' as const,
            content: '',
            order: 7,
          },
        ],
      },
    ],
  },
];

export const discussionPostsData = [
  {
    courseIndex: 0,
    studentIndex: 0,
    title: 'React 组件之间如何传值？',
    content: '请问各位同学，React中父子组件之间传值除了props还有什么方式？兄弟组件之间怎么通信呢？',
    isPinned: true,
    isFeatured: true,
    replies: [
      { studentIndex: 1, content: '父子组件用props，兄弟组件可以通过共同的父组件或者使用Context。' },
      { studentIndex: 2, content: '复杂状态管理可以用Redux或者Zustand，简单场景用lift state up就够了。' },
    ],
  },
  {
    courseIndex: 0,
    studentIndex: 3,
    title: 'CSS Grid 和 Flexbox 什么时候用哪个？',
    content: '现在布局既可以用Grid也可以用Flexbox，请问大家在实际项目中是怎么选择的？有什么最佳实践吗？',
    isPinned: false,
    isFeatured: false,
    replies: [],
  },
  {
    courseIndex: 0,
    studentIndex: 5,
    title: 'useEffect 依赖数组问题',
    content: '我在使用useEffect时总是遇到依赖数组的警告，有时候加了依赖会导致无限循环，请问有什么好的解决办法吗？',
    isPinned: false,
    isFeatured: true,
    replies: [
      { studentIndex: 4, content: '可以使用useCallback包裹函数，或者把不需要响应式的值用useRef存起来。' },
    ],
  },
  {
    courseIndex: 1,
    studentIndex: 2,
    title: 'NumPy 数组和 Python 列表的性能差异',
    content: '听说NumPy数组比Python列表快很多，请问具体原理是什么？什么时候该用哪个？',
    isPinned: false,
    isFeatured: false,
    replies: [
      { studentIndex: 6, content: '主要是因为NumPy数组是同类型数据的连续内存存储，而且底层是C实现的。' },
      { studentIndex: 7, content: '数值计算一定要用NumPy，普通数据存储用列表就够了。' },
    ],
  },
  {
    courseIndex: 1,
    studentIndex: 8,
    title: 'Pandas 处理大文件内存不足怎么办？',
    content: '我有一个10G的CSV文件，Pandas读的时候内存不够，请问有什么分批处理的方法吗？',
    isPinned: true,
    isFeatured: false,
    replies: [],
  },
];

export const studentProgressConfig = [
  { studentIndex: 0, courseIndex: 0, completedLessons: 6, quizScore: 100, timeSpent: [1800, 2400, 2700, 3000, 3300, 1200] },
  { studentIndex: 1, courseIndex: 0, completedLessons: 6, quizScore: 80, timeSpent: [1500, 2000, 2200, 2500, 2800, 1000] },
  { studentIndex: 2, courseIndex: 0, completedLessons: 4, quizScore: 0, timeSpent: [1200, 1800, 2000, 2400, 0, 0] },
  { studentIndex: 3, courseIndex: 0, completedLessons: 2, quizScore: 0, timeSpent: [900, 1500, 0, 0, 0, 0] },
  { studentIndex: 4, courseIndex: 0, completedLessons: 0, quizScore: 0, timeSpent: [0, 0, 0, 0, 0, 0] },
  { studentIndex: 5, courseIndex: 1, completedLessons: 6, quizScore: 90, timeSpent: [1600, 2100, 2500, 2800, 3200, 1100] },
  { studentIndex: 6, courseIndex: 1, completedLessons: 5, quizScore: 0, timeSpent: [1400, 1900, 2200, 2600, 2900, 0] },
  { studentIndex: 7, courseIndex: 1, completedLessons: 3, quizScore: 0, timeSpent: [1100, 1600, 1800, 0, 0, 0] },
  { studentIndex: 8, courseIndex: 1, completedLessons: 1, quizScore: 0, timeSpent: [800, 0, 0, 0, 0, 0] },
  { studentIndex: 9, courseIndex: 1, completedLessons: 6, quizScore: 85, timeSpent: [1300, 1700, 2000, 2400, 2700, 950] },
];
