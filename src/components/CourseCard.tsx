import { useNavigate } from 'react-router-dom';
import { Users, User } from 'lucide-react';
import type { Course } from '../../shared/types.js';
import { cn } from '@/lib/utils';

const difficultyMap: Record<string, { label: string; className: string }> = {
  beginner: { label: '入门', className: 'bg-teal-100 text-teal-700' },
  intermediate: { label: '进阶', className: 'bg-amber-100 text-amber-700' },
  advanced: { label: '高级', className: 'bg-red-100 text-red-700' },
};

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();
  const difficulty = difficultyMap[course.difficulty] || difficultyMap.beginner;

  return (
    <div
      onClick={() => navigate(`/courses/${course.id}`)}
      className={cn(
        'group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer',
        'transition-all duration-300 hover:shadow-xl hover:-translate-y-1'
      )}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={course.coverImageUrl}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-3 py-1 bg-blue-800 text-white text-xs font-medium rounded-full">
            {course.category}
          </span>
          <span className={cn('px-3 py-1 text-xs font-medium rounded-full', difficulty.className)}>
            {difficulty.label}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-800 transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            {course.instructor ? (
              <>
                <div className="w-7 h-7 rounded-full bg-blue-800 flex items-center justify-center text-white text-xs font-semibold">
                  {course.instructor.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">{course.instructor.name}</span>
              </>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <User className="w-4 h-4" />
                <span className="text-sm">讲师未设置</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{course._count?.enrollments || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
